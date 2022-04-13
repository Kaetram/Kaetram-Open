import EntityCollection from '@kaetram/server/src/game/entity/entitycollection/entitycollection';
import Player from '@kaetram/server/src/game/entity/character/player/player';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class PlayerEntityCollection extends EntityCollection<Player> {
    onSpawn(): Player | undefined {
        // We should not try to spawn a player this way, add() will not be called
        return undefined;
    }

    override onRemove(entity: Player): void {
        if (entity.ready) entity.save();
        this.world.network.deletePacketQueue(entity);
        // Unsure about this since garbage collector should handle it.
        entity.destroy();
    }
}
