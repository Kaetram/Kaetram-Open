/* global module */

import _ from 'underscore';
import Messages from '../../../../network/messages';
import Modules from '../../../../util/modules';
import Packets from '../../../../network/packets';
import Npcs from '../../../../util/npcs';
import Hit from '../combat/hit';
import Utils from '../../../../util/utils';
import Shops from '../../../../util/shops';
import log from "../../../../util/log";
import config from "../../../../../config";

class Handler {

    constructor(player) {

        this.player = player;
        this.world = player.world;
        this.map = player.world.map;

        this.updateTicks = 0;
        this.updateInterval = null;

        this.load();
    }

    destroy() {

        clearInterval(this.updateInterval);
        this.updateInterval = null;
    }

    load() {

        this.updateInterval = setInterval(() => {

            this.detectAggro();
            this.detectPVP(this.player.x, this.player.y);

            if (this.updateTicks % 4 === 0) // Every 4 (1.6 seconds) update ticks.
                this.handlePoison();

            if (this.updateTicks % 16 === 0) // Every 16 (6.4 seconds) update ticks.
                this.player.cheatScore = 0;

            if (this.updateTicks > 100) // Reset them every now and then.
                this.updateTicks = 0;

            this.updateTicks++;

        }, 400);

        this.player.onMovement((x, y) => {

            this.player.checkRegions();

            this.detectMusic(x, y);
            this.detectOverlay(x, y);
            this.detectCamera(x, y);
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

            if (this.player.combat.isRetaliating())
                this.player.combat.begin(attacker);

        });

        this.player.onKill((character) => {

            if (this.player.quests.isAchievementMob(character)) {
                let achievement = this.player.quests.getAchievementByMob(character);

                if (achievement && achievement.isStarted())
                    this.player.quests.getAchievementByMob(character).step();
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

            if (this.player.ready) {
                if (config.discordEnabled)
                    this.world.discord.sendWebhook(this.player.username, 'has logged out!')

                if (config.hubEnabled)
                    this.world.api.sendChat(Utils.formatUsername(this.player.username), 'has logged out!');
            }

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
                    this.player.send(new Messages.NPC(Packets.NPCOpcode.Bank, {}));
                    return;

                case 'enchanter':
                    this.player.send(new Messages.NPC(Packets.NPCOpcode.Enchant, {}));
                    break;
            }

            let text = Npcs.getText(npc.id);

            if (!text)
                return;

            this.player.send(new Messages.NPC(Packets.NPCOpcode.Talk, {
                id: npc.instance,
                text: npc.talk(text, this.player)
            }));

        });

        this.player.onTeleport((x, y, isDoor) => {
            if (!this.player.finishedTutorial() && isDoor && this.player.doorCallback) {
                this.player.doorCallback(x, y);
                return;
            }


        });

        this.player.onPoison((info) => {
            this.player.sync();

            if (info)
                this.player.notify('You have been poisoned.');
            else
                this.player.notify('The poison has worn off.');

            log.debug(`Player ${this.player.instance} updated poison status.`);
        });

        this.player.onCheatScore(() => {
            /**
             * This is a primitive anti-cheating system.
             * It will not accomplish much, but it is enough for now.
             */

            if (this.player.cheatScore > 10)
                this.player.timeout();

            log.debug('Cheat score - ' + this.player.cheatScore);
        });
    }

    detectAggro() {
        let region = this.world.region.regions[this.player.region];

        if (!region)
            return;

        _.each(region.entities, (entity) => {
            if (entity && entity.type === 'mob' && this.canEntitySee(entity)) {
                let aggro = entity.canAggro(this.player);

                if (aggro)
                    entity.combat.begin(this.player);
            }
        });
    }

    detectMusic(x, y) {
        let musicArea = _.find(this.world.getMusicAreas(), (area) => { return area.contains(x, y); }),
            song = musicArea ? musicArea.id : null;

        if (this.player.currentSong !== song)
            this.player.updateMusic(song);

    }

    detectPVP(x, y) {
        let pvpArea = _.find(this.world.getPVPAreas(), (area) => { return area.contains(x, y); });

        this.player.updatePVP(!!pvpArea);
    }

    detectOverlay(x, y) {
        let overlayArea = _.find(this.world.getOverlayAreas(), (area) => {
                return area.contains(x, y);
            });

        this.player.updateOverlay(overlayArea);
    }

    detectCamera(x, y) {
        let cameraArea = _.find(this.world.getCameraAreas(), (area) => {
                return area.contains(x, y);
            });

        this.player.updateCamera(cameraArea);
    }

    detectLights(x, y) {

        _.each(this.map.lights, (light) => {
            if (this.map.nearLight(light, x, y) && !this.player.hasLoadedLight(light)) {

                // Add a half a tile offset so the light is centered on the tile.

                this.player.lightsLoaded.push(light);
                this.player.send(new Messages.Overlay(Packets.OverlayOpcode.Lamp, light));
            }
        });
    }

    detectClipping(x, y) {
        let isColliding = this.map.isColliding(x, y)

        if (!isColliding)
            return;

        this.player.incoming.handleNoClip(x, y);
    }

    handlePoison() {

        if (!this.player.poison)
            return;

        let info = this.player.poison.split(':'),
            timeDiff = new Date().getTime() - info[0];

        if (timeDiff > info[1]) {
            this.player.setPoison(false);
            return;
        }

        let hit = new Hit(Modules.Hits.Poison, info[2])

        hit.poison = true;

        this.player.combat.hit(this.player, this.player, hit.getData());

    }

    canEntitySee(entity) {
        return !this.player.hasInvisible(entity) && !this.player.hasInvisibleId(entity.id);
    }

}

export default Handler;
