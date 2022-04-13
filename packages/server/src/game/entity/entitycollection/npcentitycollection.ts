import EntityCollection from '@kaetram/server/src/game/entity/entitycollection/entitycollection';
import NPC from '@kaetram/server/src/game/entity/npc/npc';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class NpcEntityCollection extends EntityCollection<NPC> {
    onSpawn(params: { key: string; x: number; y: number }): NPC {
        return new NPC(params.key, params.x, params.y);
    }
}
