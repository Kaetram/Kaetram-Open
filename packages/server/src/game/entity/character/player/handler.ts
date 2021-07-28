import _ from 'lodash';

import * as Modules from '@kaetram/common/src/modules';
import Packets from '@kaetram/common/src/packets';

import config from '../../../../../config';
import Areas from '../../../../map/areas/areas';
import Map from '../../../../map/map';
import Messages from '../../../../network/messages';
import log from '../../../../util/log';
import Npcs from '../../../../util/npcs';
import Shops from '../../../../util/shops';
import Utils from '../../../../util/utils';
import World from '../../../world';
import Entity from '../../entity';
import NPC from '../../npc/npc';
import Hit from '../combat/hit';
import Mob from '../mob/mob';
import Player from './player';

export default class Handler {
    player: Player;
    world: World;
    map: Map;

    updateTicks: number;
    updateInterval: NodeJS.Timeout | null;

    constructor(player: Player) {
        this.player = player;

        this.world = player.world;
        this.map = player.world.map;

        this.updateTicks = 0;
        this.updateInterval = null;

        this.load();
    }

    destroy(): void {
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.updateInterval = null;
    }

    load(): void {
        this.updateInterval = setInterval(() => {
            this.detectAggro();

            if (this.updateTicks % 4 === 0)
                // Every 4 (1.6 seconds) update ticks.
                this.handlePoison();

            if (this.updateTicks % 16 === 0)
                // Every 16 (6.4 seconds) update ticks.
                this.player.cheatScore = 0;

            if (this.updateTicks > 100)
                // Reset them every now and then.
                this.updateTicks = 0;

            this.updateTicks++;
        }, 400);

        this.player.onMovement((x: number, y: number) => {
            this.player.checkRegions();

            this.detectAreas(x, y);
            this.detectLights(x, y);

            this.detectClipping(x, y);
        });

        this.player.onDeath(() => {
            this.player.combat.stop();
            this.player.professions.stopAll();
        });

        this.player.onHit((attacker, damage) => {
            /**
             * Handles actions whenever the player
             * instance is hit by 'damage' amount
             */

            if (this.player.combat.isRetaliating()) this.player.combat.begin(attacker);

            log.debug(`Player has been hit - damage: ${damage}`);
        });

        this.player.onKill((character) => {
            if (!this.player.quests) {
                log.warning(`${this.player.username} does not have quests initialized.`);
                return;
            }

            const mob = character as Mob;

            if (this.player.quests.isAchievementMob(mob)) {
                let achievement = this.player.quests.getAchievementByMob(mob);

                if (achievement && achievement.isStarted()) achievement.step();
            }
        });

        this.player.onRegion(() => {
            this.player.lastRegionChange = Date.now();

            this.world.region.handle(this.player);
            this.world.region.push(this.player);
        });

        this.player.connection.onClose(() => {
            this.player.stopHealing();

            /* Avoid a memory leak */
            if (this.updateInterval) clearInterval(this.updateInterval);
            this.updateInterval = null;

            if (this.player.ready) {
                if (config.discordEnabled)
                    this.world.discord.sendWebhook(this.player.username, 'has logged out!');

                if (config.hubEnabled)
                    this.world.api.sendChat(
                        Utils.formatUsername(this.player.username),
                        'has logged out!'
                    );
            }

            this.world.entities.removePlayer(this.player);
        });

        this.player.onTalkToNPC((npc: NPC) => {
            if (this.player.quests.isQuestNPC(npc)) {
                this.player.quests.getQuestByNPC(npc)!.triggerTalk(npc);

                return;
            }

            if (this.player.quests.isAchievementNPC(npc)) {
                this.player.quests.getAchievementByNPC(npc)!.converse(npc);

                return;
            }

            if (Shops.isShopNPC(npc.id)) {
                this.world.shops.open(this.player, npc.id);
                return;
            }

            switch (Npcs.getType(npc.id)) {
                case 'banker':
                    this.player.send(new Messages.NPC(Packets.NPCOpcode.Bank, {}));
                    return;

                case 'enchanter':
                    this.player.send(new Messages.NPC(Packets.NPCOpcode.Enchant, {}));
                    break;
            }

            let text = Npcs.getText(npc.id);

            if (!text) return;

            this.player.send(
                new Messages.NPC(Packets.NPCOpcode.Talk, {
                    id: npc.instance,
                    text: npc.talk(text, this.player)
                })
            );
        });

        this.player.onTeleport((x: number, y: number, isDoor?: boolean) => {
            if (!this.player.finishedTutorial() && isDoor && this.player.doorCallback) {
                this.player.doorCallback(x, y);
                return;
            }
        });

        this.player.onPoison((info) => {
            this.player.sync();

            if (info) this.player.notify('You have been poisoned.');
            else this.player.notify('The poison has worn off.');

            log.debug(`Player ${this.player.instance} updated poison status.`);
        });

        this.player.onCheatScore(() => {
            /**
             * This is a primitive anti-cheating system.
             * It will not accomplish much, but it is enough for now.
             */

            if (this.player.cheatScore > 10) this.player.timeout();

            log.debug('Cheat score - ' + this.player.cheatScore);
        });
    }

    detectAggro(): void {
        let region = this.world.region.regions[this.player.region!];

        if (!region) return;

        _.each(region.entities, (character) => {
            if (character && character.type === 'mob' && this.canEntitySee(character)) {
                const mob = character as Mob;

                let aggro = mob.canAggro(this.player);

                if (aggro) mob.combat.begin(this.player);
            }
        });
    }

    detectAreas(x: number, y: number): void {
        this.map.forEachAreas((areas: Areas, name: string) => {
            let info = areas.inArea(x, y);

            switch (name) {
                case 'pvp':
                    return this.player.updatePVP(!!info);

                case 'music':
                    return this.player.updateMusic(info);

                case 'overlay':
                    return this.player.updateOverlay(info);

                case 'camera':
                    return this.player.updateCamera(info);

                case 'achievements':
                    if (!info || !info.achievement) return;

                    if (!this.player.achievementsLoaded) return;

                    this.player.finishAchievement(info.achievement);

                    break;

                case 'door':
                    break;
            }
        });
    }

    detectLights(x: number, y: number): void {
        _.each(this.map.lights, (light) => {
            const { id } = light;

            if (this.map.nearLight(light, x, y) && !this.player.hasLoadedLight(id)) {
                // Add a half a tile offset so the light is centered on the tile.

                this.player.lightsLoaded.push(id);
                this.player.send(new Messages.Overlay(Packets.OverlayOpcode.Lamp, light));
            }
        });
    }

    detectClipping(x: number, y: number): void {
        let isColliding = this.map.isColliding(x, y);

        if (!isColliding) return;

        this.player.incoming.handleNoClip(x, y);
    }

    handlePoison(): void {
        if (!this.player.poison) return;

        let info = this.player.poison.split(':'),
            date = parseInt(info[0]),
            time = parseInt(info[1]),
            damage = parseInt(info[2]),
            timeDiff = Date.now() - date;

        if (timeDiff > time) {
            this.player.setPoison('');
            return;
        }

        let hit = new Hit(Modules.Hits.Poison, damage);

        hit.poison = true;

        this.player.combat.hit(this.player, this.player, hit.getData());
    }

    canEntitySee(entity: Entity): boolean {
        return !this.player.hasInvisible(entity) && !this.player.hasInvisibleId(entity.id);
    }
}
