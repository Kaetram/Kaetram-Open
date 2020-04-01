import * as _ from 'underscore';
import Messages from '../../../../network/messages';
import Modules from '../../../../util/modules';
import Packets from '../../../../network/packets';
import Npcs from '../../../../util/npcs';
import Hit from '../combat/hit';
import Shops from '../../../../util/shops';
import Entity from '../../entity';
import Area from '../../../../map/area';
import Player from './player';

/**
 *
 */
class Handler {
    public player: Player;

    public updateInterval: any;

    public updateTicks: any;

    public world: any;

    public map: any;

    constructor(player) {
        this.player = player;
        this.world = player.world;
        this.map = player.world.map;

        this.updateTicks = 0;
        this.updateInterval = null;

        this.load();
    }

    load() {
        this.updateInterval = setInterval(() => {
            this.detectAggro();
            this.detectPVP(this.player.x, this.player.y);

            if (this.updateTicks % 4 === 0) {
                // Every 4 (1.6 seconds) update ticks.
                this.handlePoison();
            }

            if (this.updateTicks % 16 === 0) {
                // Every 16 (6.4 seconds) update ticks.
                this.player.cheatScore = 0;
            }

            if (this.updateTicks > 100) {
                // Reset them every now and then.
                this.updateTicks = 0;
            }

            this.updateTicks++;
        }, 400);

        this.player.onMovement((x, y) => {
            this.player.checkRegions();

            this.detectMusic(x, y);
            this.detectOverlay(x, y);
            this.detectCamera(x, y);
            this.detectLights(x, y);
        });

        this.player.onDeath(() => {
            this.player.combat.stop();
        });

        this.player.onHit((attacker, damage) => {
            /**
             * Handles actions whenever the player
             * instance is hit by 'damage' amount
             */

            if (this.player.combat.isRetaliating()) {
                this.player.combat.begin(attacker);
            }
        });

        this.player.onKill((character) => {
            if (this.player.quests.isAchievementMob(character)) {
                const achievement = this.player.quests.getAchievementByMob(
                    character
                );

                if (achievement && achievement.isStarted()) {
                    this.player.quests.getAchievementByMob(character).step();
                }
            }
        });

        this.player.onRegion(() => {
            this.player.lastRegionChange = new Date().getTime();

            this.world.region.handle(this.player);
            this.world.region.push(this.player);
        });

        this.player.connection.onClose(() => {
            this.player.stopHealing();

            /* Avoid a memory leak */
            clearInterval(this.updateInterval);
            this.updateInterval = null;

            this.world.removePlayer(this.player);
        });

        this.player.onTalkToNPC((npc) => {
            if (this.player.quests.isQuestNPC(npc)) {
                this.player.quests.getQuestByNPC(npc).triggerTalk(npc);

                return;
            }

            if (this.player.quests.isAchievementNPC(npc)) {
                this.player.quests.getAchievementByNPC(npc).converse(npc);

                return;
            }

            if (Shops.isShopNPC(npc.id)) {
                this.world.shops.open(this.player, npc.id);

                return;
            }

            switch (Npcs.getType(npc.id)) {
                case 'banker':
                    this.player.send(
                        new Messages.NPC(Packets.NPCOpcode.Bank, {})
                    );

                    return;

                case 'enchanter':
                    this.player.send(
                        new Messages.NPC(Packets.NPCOpcode.Enchant, {})
                    );
                    break;
            }

            const text = Npcs.getText(npc.id);

            if (!text) return;

            this.player.send(
                new Messages.NPC(Packets.NPCOpcode.Talk, {
                    id: npc.instance,
                    text: npc.talk(text, this.player),
                })
            );
        });

        this.player.onTeleport((x, y, isDoor) => {
            if (
                !this.player.finishedTutorial() &&
                isDoor &&
                this.player.doorCallback
            ) {
                this.player.doorCallback(x, y);
            }
        });

        this.player.onPoison((info) => {
            this.player.sync();

            if (info) this.player.notify('You have been poisoned.');
            else this.player.notify('The poison has worn off.');

            console.debug(
                `Player ${this.player.instance} updated poison status.`
            );
        });

        this.player.onCheatScore(() => {
            /**
             * This is a primitive anti-cheating system.
             * It will not accomplish much, but it is enough for now.
             */

            if (this.player.cheatScore > 10) this.player.timeout();

            console.debug(`Cheat score - ${this.player.cheatScore}`);
        });
    }

    detectAggro() {
        const region = this.world.region.regions[this.player.region];

        if (!region) return;

        _.each(region.entities, (entity: Entity) => {
            if (entity && entity.type === 'mob' && this.canEntitySee(entity)) {
                const aggro = entity.canAggro(this.player);

                if (aggro) entity.combat.begin(this.player);
            }
        });
    }

    detectMusic(x, y) {
        const musicArea = _.find(this.world.getMusicAreas(), (area: Area) => {
            return area.contains(x, y);
        });
        const song = musicArea ? musicArea.id : null;

        if (this.player.currentSong !== song) this.player.updateMusic(song);
    }

    detectPVP(x, y) {
        const pvpArea = _.find(this.world.getPVPAreas(), (area: Area) => {
            return area.contains(x, y);
        });

        this.player.updatePVP(!!pvpArea);
    }

    detectOverlay(x, y) {
        const overlayArea = _.find(
            this.world.getOverlayAreas(),
            (area: Area) => {
                return area.contains(x, y);
            }
        );

        this.player.updateOverlay(overlayArea);
    }

    detectCamera(x, y) {
        const cameraArea = _.find(this.world.getCameraAreas(), (area: Area) => {
            return area.contains(x, y);
        });

        this.player.updateCamera(cameraArea);
    }

    detectLights(x, y) {
        _.each(this.map.lights, (light) => {
            if (
                this.map.nearLight(light, x, y) &&
                !this.player.hasLoadedLight(light)
            ) {
                // Add a half a tile offset so the light is centered on the tile.

                this.player.lightsLoaded.push(light);
                this.player.send(
                    new Messages.Overlay(Packets.OverlayOpcode.Lamp, light)
                );
            }
        });
    }

    handlePoison() {
        if (!this.player.poison) return;

        const info = this.player.poison.split(':');
        const timeDiff = new Date().getTime() - info[0];

        if (timeDiff > info[1]) {
            this.player.setPoison(false);

            return;
        }

        const hit = new Hit(Modules.Hits.Poison, info[2]);

        hit.poison = true;

        this.player.combat.hit(this.player, this.player, hit.getData());
    }

    canEntitySee(entity) {
        return (
            !this.player.hasInvisible(entity) &&
            !this.player.hasInvisibleId(entity.id)
        );
    }
}

export default Handler;
