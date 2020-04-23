let Objects = require('../util/objects'),
    Utils = require('../util/utils');

class GlobalObjects {

    constructor(world) {
        let self = this;

        self.world = world;

    }

    getData(id) {
        let self = this,
            object = Objects.getObject(id);

        if (!object)
            return null;

        let position = Objects.getPosition(id);

        object.id = id;

        return {
            object: object,
            info: {
                id: id,
                x: position.x * 16,
                y: (position.y * 16) + 8 // offset for the chat bubble
            }
        }
    }

    /**
     * Ripped from `npc.js` but with some minor adjustments.
     */

    talk(object, player) {
        let self = this;

        if (player.npcTalk !== object.id) {
            player.npcTalk = object.id;
            player.talkIndex = 0;
        }

        let message = object.messages[player.talkIndex];

        if (message && message.includes("@player@")) {
            message = message.replace('@player@', '@red@' + Utils.formatUsername(player.username));
            message = Utils.parseMessage(message);
        }

        if (player.talkIndex > object.messages.length - 1)
            player.talkIndex = 0;
        else
            player.talkIndex++;

        return message;
    }

}

module.exports = GlobalObjects;
