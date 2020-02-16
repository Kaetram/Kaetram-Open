let Objects = require('../util/objects');

class GlobalObjects {

    constructor(world) {
        let self = this;

        self.world = world;

    }

    getObject(id) {
        return Objects.getObject(id);
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

        if (player.talkIndex > object.messages.length - 1)
            player.talkIndex = 0;
        else
            player.talkIndex++;

        return message;
    }

}

module.exports = GlobalObjects;
