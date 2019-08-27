/* global module */

let _ = require('underscore'),
    Messages = require('../network/messages'),
    Packets = require('../network/packets'),
    MapClient = require('../../data/map/world_client');

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

                self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'There are currently ' + self.world.getPopulation() + ' online.'));

                break;

            case 'tutstage':

                log.info(self.player.getTutorial().stage);

                break;

            case 'coords':

                self.player.send(new Messages.Notification(Packets.NotificationOpcode.Text, 'x: ' + self.player.x + ' y: ' + self.player.y));

                break;

            case 'progress':

                let tutorialQuest = self.player.getTutorial();

                self.player.send(new Messages.Quest(Packets.QuestOpcode.Progress, {
                    id: tutorialQuest.id,
                    stage: tutorialQuest.stage
                }));

                break;

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

                break;

            case 'region':
                log.info(self.player.region);
                break;

            case 'getintroduction':
                log.info(self.player.quests.getQuest(0).getStage());
                break;

            case 'resetintro':
                let introduction = self.player.quests.getQuest(0);

                introduction.setStage(0);
                introduction.clearPointers();
                introduction.update();
                introduction.updatePointers();

                self.player.updateRegion(true);
                self.player.save();

                break;

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

                break;

            case 'unmute':

                let uTargetName = blocks.join(' '),
                    uUser = self.world.getPlayerByName(uTargetName);

                if (!uTargetName)
                    return;

                uUser.mute = new Date().getTime() - 3600;

                uUser.save();

                break;

        }
    }

    handleAdminCommands(command, blocks) {
        let self = this;

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

                break;

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

                break;

            case 'teleport':

                let x = parseInt(blocks.shift()),
                    y = parseInt(blocks.shift()),
                    withAnimation = parseInt(blocks.shift())

                log.info(withAnimation ? true : false);

                if (x && y)
                    self.player.teleport(x, y, false, withAnimation ? true : false);

                break;

            case 'teletome':

                let username = blocks.join(' '),
                    player = self.world.getPlayerByName(username);

                if (player)
                    player.teleport(self.player.x, self.player.y);

                break;

            case 'nohit':

                log.info('invincinil');

                self.player.invincible = !self.player.invincible;

                break;

            case 'mob':

                let npcId = parseInt(blocks.shift());

                self.world.spawnMob(npcId, self.player.x, self.player.y);

                break;

            case 'pointer':

                let posX = parseInt(blocks.shift()),
                    posY = parseInt(blocks.shift());

                if (!posX || !posY)
                    return;

                self.player.send(new Messages.Pointer(Packets.PointerOpcode.Location, {
                    id: self.player.instance,
                    x: posX,
                    y: posY
                }));

                break;

            case 'teleall':

                _.each(self.world.players, function(player) {
                    player.teleport(self.player.x, self.player.y);
                });

                break;

            case 'attackaoe':

                let radius = parseInt(blocks.shift());

                if (!radius)
                    radius = 1;

                self.player.combat.dealAoE(radius);

                break;

            case 'addexp':

                let exp = parseInt(blocks.shift());

                if (!exp)
                    return;

                self.player.addExperience(exp);

                break;

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

                break;

            case 'gettile':

                let getTileX = parseInt(blocks.shift()),
                    getTileY = parseInt(blocks.shift());

                if (!getTileX || !getTileY)
                    return;

                let getTileIndex = self.world.region.gridPositionToIndex(getTileX - 1, getTileY);

                log.info('Tile Index: ' + getTileIndex);
                log.info('Tile Info: ' + MapClient.data[getTileIndex]);
                log.info('Actual Index: ' + self.world.map.getActualTileIndex(getTileIndex));

                break;

            case 'instance':
                self.world.region.createInstance(self.player, self.player.region);
                break;

            case 'checkregion':
                self.player.notify('Current Region: ' + self.player.region);
                break;

            case 'deinstance':
                self.world.region.deleteInstance(self.player);
                break;

            case 'debug':
                self.player.send(new Messages.Command({
                    command: 'debug'
                }));
                break;

            case 'resetregions':
                log.info('Resetting regions...');

                self.player.regionsLoaded = [];
                self.player.updateRegion(true);

                break;

        }
    }

}

module.exports = Commands;
