/* global module */

let Entity = require('../entity');

class NPC extends Entity {
    constructor(id, instance, x, y) {
        super(id, 'npc', instance, x, y);

        this.talkIndex = 0;
    }

    talk(messages) {
        let self = this,
            message = messages[self.talkIndex];

        if (self.talkIndex > messages.length - 1) self.talkIndex = 0;
        else self.talkIndex++;

        return message;
    }
}

module.exports = NPC;
