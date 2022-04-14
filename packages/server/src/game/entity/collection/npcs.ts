import Collection from '@kaetram/server/src/game/entity/collection/collection';
import NPC from '@kaetram/server/src/game/entity/npc/npc';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class NpcCollection extends Collection<NPC> {
    onSpawn(params: { key: string; x: number; y: number }): NPC {
        return new NPC(params.key, params.x, params.y);
    }
}
