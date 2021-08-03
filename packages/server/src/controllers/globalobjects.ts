import Objects, { ObjectsData } from '../util/objects';
import Utils from '@kaetram/common/util/utils';

import type { Tree } from '@kaetram/common/types/map';
import type Player from '../game/entity/character/player/player';
import type World from '../game/world';

interface SignData {
    object: ObjectsData;
    info: {
        id: string;
        x: number;
        y: number;
    };
}

export default class GlobalObjects {
    private map;

    public constructor(world: World) {
        this.map = world.map;
    }

    public getInfo(id: string): { type: string; tree?: Tree } | null {
        let position = Objects.getPosition(id),
            objectId = this.map.getPositionObject(position.x, position.y);

        if (objectId in this.map.trees)
            return {
                type: 'lumberjacking',
                tree: this.map.trees[objectId]
            };

        let object = Objects.getObject(id);

        if (!object) return null;

        return {
            type: object.type
        };
    }

    /**
     * Used for objects that display text bubbles. Returns formatted
     * position data for the client to display the bubble.
     */
    public getSignData(id: string): SignData | null {
        let object = Objects.getObject(id);

        if (!object) return null;

        let position = Objects.getPosition(id);

        object.id = id;

        return {
            object,
            info: {
                id,
                x: position.x * 16,
                y: position.y * 16 + 8 // offset for the chat bubble
            }
        };
    }

    /**
     * Ripped from `npc.js` but with some minor adjustments.
     */
    public talk(object: ObjectsData, player: Player): string {
        if (player.npcTalk !== object.id) {
            player.npcTalk = object.id!;
            player.talkIndex = 0;
        }

        let message = object.messages[player.talkIndex];

        if (message && message.includes('@player@')) {
            message = message.replace('@player@', `@red@${Utils.formatUsername(player.username)}`);
            message = Utils.parseMessage(message);
        }

        if (player.talkIndex > object.messages.length - 1) player.talkIndex = 0;
        else player.talkIndex++;

        return message;
    }
}
