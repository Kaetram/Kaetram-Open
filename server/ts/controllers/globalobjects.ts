import Objects from '../util/objects';

class GlobalObjects {
    world: any;

    constructor(world) {
        

        this.world = world;

    }

    getObject(id) {
        return Objects.getObject(id);
    }

    /**
     * Ripped from `npc.js` but with some minor adjustments.
     */

    talk(object, player) {
        

        if (player.npcTalk !== object.id) {
            player.npcTalk = object.id;
            player.talkIndex = 0;
        }

        const message = object.messages[player.talkIndex];

        if (player.talkIndex > object.messages.length - 1)
            player.talkIndex = 0;
        else
            player.talkIndex++;

        return message;
    }

}

export default GlobalObjects;
