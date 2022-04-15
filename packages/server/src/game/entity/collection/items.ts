import Collection from '@kaetram/server/src/game/entity/collection/collection';
import Item from '@kaetram/server/src/game/entity/objects/item';
import { Blink } from '@kaetram/server/src/network/packets';
import { Modules } from '@kaetram/common/network';
import itemData from '@kaetram/server/data/items.json';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class ItemCollection extends Collection<Item> {
    override tryLoad(position: Position, key: string): Item | undefined {
        if (!(key in itemData)) return undefined;
        return this.spawn({
            key,
            x: position.x,
            y: position.y,
            dropped: false
        });
    }

    createEntity(params: {
        key: string;
        x: number;
        y: number;
        dropped?: boolean;
        count?: number;
        ability?: number;
        abilityLevel?: number;
    }): Item {
        return this.createItem(
            params.key,
            params.x,
            params.y,
            params.dropped,
            params.count,
            params.ability,
            params.abilityLevel
        );
    }

    // workaround to support default values
    private createItem(
        key: string,
        x: number,
        y: number,
        dropped = false,
        count = 1,
        ability = -1,
        abilityLevel = -1
    ): Item {
        return new Item(key, x, y, dropped, count, ability, abilityLevel);
    }

    override onAdd(entity: Item): void {
        // Not the prettiest way of doing it honestly...
        entity.onDespawn(() => this.remove(entity));
        if (entity.dropped) {
            entity.despawn();
            entity.onBlink(() =>
                this.world.push(Modules.PacketType.Broadcast, {
                    packet: new Blink(entity.instance)
                })
            );
        } else entity.onRespawn(() => this.add(entity));
    }

    override shouldRemove(entity: Item) {
        if (!entity.dropped) {
            entity.respawn();
            return false;
        }
        return true;
    }
}
