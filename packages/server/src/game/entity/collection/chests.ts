import World from '@kaetram/server/src/game/world';
import Collection from '@kaetram/server/src/game/entity/collection/collection';
import Chest from '@kaetram/server/src/game/entity/objects/chest';
import ItemCollection from '@kaetram/server/src/game/entity/collection/items';
import Player from '@kaetram/server/src/game/entity/character/player/player';
import AllCollection from '@kaetram/server/src/game/entity/collection/all';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class ChestCollection extends Collection<Chest> {
    public constructor(
        world: World,
        allEntities: AllCollection,
        protected itemEntityCollection: ItemCollection
    ) {
        super(world, allEntities);
    }

    onSpawn(params: {
        items: string[];
        x: number;
        y: number;
        isStatic?: boolean;
        achievement?: number;
    }): Chest {
        return this.createChest(
            params.items,
            params.x,
            params.y,
            params.isStatic,
            params.achievement
        );
    }

    private createChest(
        items: string[],
        x: number,
        y: number,
        isStatic = false,
        achievement?: number
    ): Chest {
        let chest = new Chest(x, y, achievement);

        chest.addItems(items);

        if (isStatic) {
            chest.static = isStatic;
            chest.onRespawn(() => this.add(chest));
        }
        chest.onOpen((player?: Player) => {
            this.remove(chest);

            let item = chest.getItem();

            if (!item) return;

            this.itemEntityCollection.spawn({
                key: item.string,
                x: chest.x,
                y: chest.y,
                dropped: true,
                count: item.count
            });

            if (player && chest.achievement) player.finishAchievement(chest.achievement);
        });
        return chest;
    }

    override shouldRemove(entity: Chest) {
        if (entity.static) {
            entity.respawn();
            return false;
        }
        return true;
    }
}
