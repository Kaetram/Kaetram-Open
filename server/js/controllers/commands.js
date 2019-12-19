/* global module */

let _ = require('underscore'),
    Messages = require('../network/messages'),
    Packets = require('../network/packets'),
    MapClient = require('../../data/map/world_client'),
    config = require('../../config');

class Commands {

    constructor(player) {
        let self = this;

        self.player = player;
        self.world = player.world;
    }

    parse(rawText) {
        let self = this,
            blocks = rawText.substring(1).split(' ');

        if (blocks.length < 1)
            return;

        let command = blocks.shift();

        self.handlePlayerCommands(command, blocks);

        if (self.player.rights > 0)
            self.handleModeratorCommands(command, blocks);

        if (self.player.rights > 1)
            self.handleAdminCommands(command, blocks);
    }

    handlePlayerCommands(command, blocks) {
        let self = this;

        switch(command) {

            case 'players':
                let population = self.world.getPopulation(),
                    singular = population === 1;

                self.player.notify(`There ${singular ? 'is' : 'are'} currently ${population} ${singular ? 'person' : 'people'} online.`);

                if (self.player.rights > 1)
                    _.each(self.world.players, (player) => {
                        self.player.notify(player.username);
                    });

                return;

            case 'tutstage':

                log.info(self.player.getTutorial().stage);

                return;

            case 'coords':

                self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'x: ' + self.player.x + ' y: ' + self.player.y));

                return;

            case 'progress':

                let tutorialQuest = self.player.getTutorial();

                self.player.send(new Messages.Quest(Packets.QuestOpcode.Progress, {
                    id: tutorialQuest.id,
                    stage: tutorialQuest.stage
                }));

                return;

            case 'global':

                self.world.push(Packets.PushOpcode.Broadcast, {
                    message: new Messages.Chat({
                        name: self.player.username,
                        text: blocks.join(' '),
                        isGlobal: true,
                        withBubble: false,
                        colour: 'rgba(191, 191, 63, 1.0)'
                    })
                });

                return;

            case 'region':
                log.info(self.player.region);
                return;

            case 'getintroduction':
                log.info(self.player.quests.getQuest(0).getStage());
                return;

            case 'resetintro':
                let introduction = self.player.quests.getQuest(0);

                introduction.setStage(0);
                introduction.clearPointers();
                introduction.update();
                introduction.updatePointers();

                self.player.updateRegion();
                self.player.save();

                return;

        }
    }

    handleModeratorCommands(command, blocks) {
        let self = this;

        switch (command) {

            case 'mute':
            case 'ban':

                let duration = blocks.shift(),
                    targetName = blocks.join(' '),
                    user = self.world.getPlayerByName(targetName);

                if (!user)
                    return;

                if (!duration)
                    duration = 24;

                let timeFrame = new Date().getTime() + duration * 60 * 60;

                if (command === 'mute')
                    user.mute = timeFrame;
                else if (command === 'ban') {
                    user.ban = timeFrame;
                    user.save();

                    user.sendUTF8('ban');
                    user.connection.close('banned');
                }

                user.save();

                return;

            case 'unmute':

                let uTargetName = blocks.join(' '),
                    uUser = self.world.getPlayerByName(uTargetName);

                if (!uTargetName)
                    return;

                uUser.mute = new Date().getTime() - 3600;

                uUser.save();

                return;

        }
    }

    handleAdminCommands(command, blocks) {
        let self = this,
            username, player;

        switch (command) {

            case 'spawn':

                let spawnId = parseInt(blocks.shift()),
                    count = parseInt(blocks.shift()),
                    ability = parseInt(blocks.shift()),
                    abilityLevel = parseInt(blocks.shift());

                if (!spawnId || !count)
                    return;

                self.player.inventory.add({
                    id: spawnId,
                    count: count,
                    ability: ability ? ability : -1,
                    abilityLevel: abilityLevel ? abilityLevel : -1
                });

                return;

            case 'maxhealth':

                self.player.notify('Max health is ' + self.player.hitPoints.getMaxHitPoints());

                return;

            case 'ipban':

                return;

            case 'drop':

                let id = parseInt(blocks.shift()),
                    dCount = parseInt(blocks.shift());

                if (!id)
                    return;

                if (!dCount)
                    dCount = 1;

                self.world.dropItem(id, dCount, self.player.x, self.player.y);

                return;

            case 'ghost':

                self.player.equip('ghost', 1, -1, -1);

                return;

            case 'notify':

                self.player.notify('Hello!!!');

                return;

            case 'teleport':

                let x = parseInt(blocks.shift()),
                    y = parseInt(blocks.shift()),
                    withAnimation = parseInt(blocks.shift())

                log.info(withAnimation ? true : false);

                if (x && y)
                    self.player.teleport(x, y, false, withAnimation ? true : false);

                return;

            case 'teletome':

                username = blocks.join(' ');
                player = self.world.getPlayerByName(username);

                if (player)
                    player.teleport(self.player.x, self.player.y);

                return;

            case 'teleto':

                username = blocks.join(' ');
                player = self.world.getPlayerByName(username);

                if (player)
                    self.player.teleport(player.x, player.y);

                return;

            case 'nohit':

                log.info('invincinil');

                self.player.invincible = !self.player.invincible;

                return;

            case 'mob':

                let npcId = parseInt(blocks.shift());

                self.world.spawnMob(npcId, self.player.x, self.player.y);

                return;

            case 'pointer':

                if (blocks.length > 1) {
                    let posX = parseInt(blocks.shift()),
                        posY = parseInt(blocks.shift());

                    if (!posX || !posY)
                        return;

                    self.player.send(new Messages.Pointer(Packets.PointerOpcode.Location, {
                        id: self.player.instance,
                        x: posX,
                        y: posY
                    }));
                } else {
                    let instance = blocks.shift();

                    if (!instance)
                        return;

                    self.player.send(new Messages.Pointer(Packets.PointerOpcode.NPC, {
                        id: instance
                    }));
                }

                return;

            case 'teleall':

                _.each(self.world.players, (player) => {
                    player.teleport(self.player.x, self.player.y);
                });

                return;

            case 'attackaoe':

                let radius = parseInt(blocks.shift());

                if (!radius)
                    radius = 1;

                self.player.combat.dealAoE(radius);

                return;

            case 'addexp':

                let exp = parseInt(blocks.shift());

                if (!exp)
                    return;

                self.player.addExperience(exp);

                return;

            case 'region':

                let tileX = parseInt(blocks.shift()),
                    tileY = parseInt(blocks.shift()),
                    tileInfo = parseInt(blocks.shift());

                if (!tileX || !tileY)
                    return;

                let tileIndex = self.world.region.gridPositionToIndex(tileX - 1, tileY);

                log.info('Sending Tile: ' + tileIndex);

                self.world.push(Packets.PushOpcode.Player, {
                    player: self.player,
                    message: new Messages.Region(Packets.RegionOpcode.Modify, {
                        index: tileIndex,
                        data: tileInfo
                    })
                });

                return;

            case 'gettile':

                let getTileX = parseInt(blocks.shift()),
                    getTileY = parseInt(blocks.shift());

                if (!getTileX || !getTileY)
                    return;

                let getTileIndex = self.world.region.gridPositionToIndex(getTileX - 1, getTileY);

                log.info('Tile Index: ' + getTileIndex);
                log.info('Tile Info: ' + MapClient.data[getTileIndex]);
                log.info('Actual Index: ' + self.world.map.getActualTileIndex(getTileIndex));

                return;

            case 'instance':
                self.world.region.createInstance(self.player, self.player.region);
                return;

            case 'checkregion':
                self.player.notify('Current Region: ' + self.player.region);
                return;

            case 'deinstance':
                self.world.region.deleteInstance(self.player);
                return;

            case 'debug':
                self.player.send(new Messages.Command({
                    command: 'debug'
                }));
                return;

            case 'addexperience':
                self.player.addExperience(parseInt(blocks.shift()));
                return;

            case 'attackrange':
                log.info(self.player.attackRange);
                return;

            case 'resetregions':
                log.info('Resetting regions...');

                self.player.regionsLoaded = [];
                self.player.updateRegion();

                return;

            case 'finishQuest':

                self.player.quests.getQuest(1).finish();

                break;

            case 'finishAchievement':

                self.player.quests.achievements[0].finish();

                break;

            case 'resetAchievement':

                self.player.quests.achievements[1].setProgress(0);

                break;

            case 'clear':

                self.player.inventory.forEachSlot((slot) => {
                    if (slot !== -1) {
                        self.player.inventory.remove(slot.id, slot.count);
                    }
                });

                break;

            case 'timeout':

                self.player.timeout();

                break;

            case 'togglepvp':

                self.world.forEachPlayer((player) => {
                    player.updatePVP(true, true);
                });

                break;

            case 'die':

                self.world.handleDeath(self.player);

                break;

        }
    }

}

module.exports = Commands;
