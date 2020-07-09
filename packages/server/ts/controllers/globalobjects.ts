import Objects from '../util/objects';
import Utils from '../util/utils';
import Map from '../map/map';
import World from '../game/world';

class GlobalObjects {
    world: World;
    map: Map;

    constructor(world) {
        this.world = world;
        this.map = world.map;
    }

    getInfo(id) {
        let position = Objects.getPosition(id),
            objectId = this.map.getPositionObject(position.x, position.y);

        if (objectId in this.map.trees)
            return {
                type: 'lumberjacking',
                tree: this.map.trees[objectId],
            };

        let object = Objects.getObject(id);

        if (!object) return null;

        return {
            type: object.type,
        };
    }

    /**
     * Used for objects that display text bubbles. Returns formatted
     * position data for the client to display the bubble.
     */

    getSignData(id) {
        let object = Objects.getObject(id);

        if (!object) return null;

        let position = Objects.getPosition(id);

        object.id = id;

        return {
            object: object,
            info: {
                id: id,
                x: position.x * 16,
                y: position.y * 16 + 8, // offset for the chat bubble
            },
        };
    }

    /**
     * Ripped from `npc.js` but with some minor adjustments.
     */

    talk(object, player) {
        if (player.npcTalk !== object.id) {
            player.npcTalk = object.id;
            player.talkIndex = 0;
        }

        let message = object.messages[player.talkIndex];

        if (message && message.includes('@player@')) {
            message = message.replace('@player@', '@red@' + Utils.formatUsername(player.username));
            message = Utils.parseMessage(message);
        }

        if (player.talkIndex > object.messages.length - 1) player.talkIndex = 0;
        else player.talkIndex++;

        return message;
    }
}

export default GlobalObjects;
