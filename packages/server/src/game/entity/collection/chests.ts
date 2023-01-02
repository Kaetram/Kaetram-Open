import Collection from '@kaetram/server/src/game/entity/collection/collection';
import Chest from '@kaetram/server/src/game/entity/objects/chest';

import type Player from '@kaetram/server/src/game/entity/character/player/player';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class ChestCollection extends Collection<Chest> {
    public createEntity(params: {
        items: string[];
        x: number;
        y: number;
        isStatic?: boolean;
        achievement?: string;
        mimic?: boolean;
    }): Chest {
        return this.createChest(
            params.items,
            params.x,
            params.y,
            params.isStatic,
            params.achievement,
            params.mimic
        );
    }

    private createChest(
        items: string[],
        x: number,
        y: number,
        isStatic = false,
        achievement?: string,
        mimic = false
    ): Chest {
        let chest = new Chest(x, y, achievement, mimic, items);

        if (isStatic) {
            chest.static = isStatic;
            chest.onRespawn(() => this.add(chest));
        }

        chest.onOpen((player?: Player) => {
            this.remove(chest);

            // We use the player's world instance to spawn mimic mob.
            if (player && mimic) {
                let mimic = this.collections.mobs.spawn({
                    world: player.world,
                    key: 'mimic',
                    x: chest.x,
                    y: chest.y
                });

                // Mimic's death respawns the chest. We also ensure mimic doesn't respawn.
                if (mimic) {
                    mimic.respawnable = false;
                    mimic.chest = chest;
                }
            }

            let item = chest.getItem();

            if (!item) return;

            this.collections.items.spawn({
                key: item.key,
                x: chest.x,
                y: chest.y,
                dropped: true,
                count: item.count
            });

            if (player && chest.achievement) player.achievements.get(chest.achievement)?.finish();
        });
        return chest;
    }

    public override shouldRemove(chest: Chest) {
        if (chest.static) {
            if (!chest.mimic) chest.respawn();

            return false;
        }
        return true;
    }
}
