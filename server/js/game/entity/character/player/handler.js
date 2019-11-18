/* global module */

const _ = require('underscore');
const Messages = require('../../../../network/messages');
const Packets = require('../../../../network/packets');
const Npcs = require('../../../../util/npcs');
const Shops = require('../../../../util/shops');

class Handler {
    constructor(player) {
        const self = this;

        self.player = player;
        self.world = player.world;
        self.map = player.world.map;

        self.updateInterval = 400; // 400 milliseconds

        self.load();
    }

    load() {
        const self = this;

        self.player.updateInterval = setInterval(() => {
            self.detectAggro();
        }, 400);

        self.player.onMovement((x, y) => {
            self.player.checkRegions();

            self.detectPVP(x, y);
            self.detectMusic(x, y);
            self.detectOverlay(x, y);
            self.detectCamera(x, y);
            self.detectLights(x, y);
        });

        self.player.onDeath(() => {


        });

        self.player.onHit((attacker, damage) => {
            /**
             * Handles actions whenever the player
             * instance is hit by 'damage' amount
             */

            if (self.player.combat.isRetaliating())
                self.player.combat.begin(attacker);
        });

        self.player.onKill(character => {
            if (self.player.quests.isAchievementMob(character)) {
                const achievement = self.player.quests.getAchievementByMob(character);

                if (achievement && achievement.isStarted())
                    self.player.quests.getAchievementByMob(character).step();
            }
        });

        self.player.onRegion(() => {
            self.player.lastRegionChange = new Date().getTime();

            self.world.region.handle(self.player);
            self.world.region.push(self.player);
        });

        self.player.connection.onClose(() => {
            self.player.stopHealing();

            self.world.removePlayer(self.player);
        });

        self.player.onTalkToNPC(npc => {
            if (self.player.quests.isQuestNPC(npc)) {
                self.player.quests.getQuestByNPC(npc).triggerTalk(npc);

                return;
            }

            if (self.player.quests.isAchievementNPC(npc)) {
                self.player.quests.getAchievementByNPC(npc).converse(npc);

                return;
            }

            if (Shops.isShopNPC(npc.id)) {
                self.world.shops.open(self.player, npc.id);
                return;
            }

            switch (Npcs.getType(npc.id)) {
                case 'banker':
                    self.player.send(new Messages.NPC(Packets.NPCOpcode.Bank, {}));
                    return;

                case 'enchanter':
                    self.player.send(new Messages.NPC(Packets.NPCOpcode.Enchant, {}));
                    break;
            }

            const text = Npcs.getText(npc.id);

            if (!text)
                return;

            self.player.send(new Messages.NPC(Packets.NPCOpcode.Talk, {
                id: npc.instance,
                text: npc.talk(text)
            }));
        });
    }

    detectAggro() {
        const self = this;
        const region = self.world.region.regions[self.player.region];

        if (!region)
            return;

        _.each(region.entities, entity => {
            if (entity && entity.type === 'mob' && self.canEntitySee(entity)) {
                const aggro = entity.canAggro(self.player);

                if (aggro)
                    entity.combat.begin(self.player);
            }
        });
    }

    detectMusic(x, y) {
        const self = this;
        const musicArea = _.find(self.world.getMusicAreas(), area => {return area.contains(x, y);});

        if (musicArea && self.player.currentSong !== musicArea.id)
            self.player.updateMusic(musicArea.id);
    }

    detectPVP(x, y) {
        const self = this;
        const pvpArea = _.find(self.world.getPVPAreas(), area => {return area.contains(x, y);});

        self.player.updatePVP(!!pvpArea);
    }

    detectOverlay(x, y) {
        const self = this;
        const overlayArea = _.find(self.world.getOverlayAreas(), area => {
            return area.contains(x, y);
        });

        self.player.updateOverlay(overlayArea);
    }

    detectCamera(x, y) {
        const self = this;
        const cameraArea = _.find(self.world.getCameraAreas(), area => {
            return area.contains(x, y);
        });

        self.player.updateCamera(cameraArea);
    }

    detectLights(x, y) {
        const self = this;

        _.each(self.map.lights, light => {
            if (self.map.nearLight(light, x, y) && !self.player.hasLoadedLight(light)) {
                self.player.lightsLoaded.push(light);
                self.player.send(new Messages.Overlay(Packets.OverlayOpcode.Lamp, light));
            }
        });
    }

    canEntitySee(entity) {
        return !this.player.hasInvisible(entity) && !this.player.hasInvisibleId(entity.id);
    }
}

module.exports = Handler;
