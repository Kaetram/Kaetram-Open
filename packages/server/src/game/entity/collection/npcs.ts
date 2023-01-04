import npcData from '@kaetram/server/data/npcs.json';
import Collection from '@kaetram/server/src/game/entity/collection/collection';
import NPC from '@kaetram/server/src/game/entity/npc/npc';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class NpcCollection extends Collection<NPC> {
    public override tryLoad(position: Position, key: string): NPC | undefined {
        if (!(key in npcData)) return undefined;
        return this.spawn({ key, x: position.x, y: position.y });
    }

    public createEntity(params: { key: string; x: number; y: number }): NPC {
        return new NPC(params.key, params.x, params.y);
    }
}
