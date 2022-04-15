import World from '@kaetram/server/src/game/world';
import AllCollection from '@kaetram/server/src/game/entity/collection/all';
import PlayerCollection from '@kaetram/server/src/game/entity/collection/players';
import ItemCollection from '@kaetram/server/src/game/entity/collection/items';
import MobCollection from '@kaetram/server/src/game/entity/collection/mobs';
import ChestCollection from '@kaetram/server/src/game/entity/collection/chests';
import NpcCollection from '@kaetram/server/src/game/entity/collection/npcs';
import ProjectileCollection from '@kaetram/server/src/game/entity/collection/projectiles';
import Collection from '@kaetram/server/src/game/entity/collection/collection';
import _ from 'lodash';
import log from '@kaetram/common/util/log';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class Collections {
    public readonly allEntities: AllCollection;
    public readonly players: PlayerCollection;
    public readonly items: ItemCollection;
    public readonly mobs: MobCollection;
    public readonly chests: ChestCollection;
    public readonly npcs: NpcCollection;
    public readonly projectiles: ProjectileCollection;
    private readonly all: Collection<any>[] = [];

    public constructor(public world: World) {
        this.allEntities = new AllCollection(this);
        this.players = new PlayerCollection(this);
        this.items = new ItemCollection(this);
        this.mobs = new MobCollection(this);
        this.chests = new ChestCollection(this);
        this.npcs = new NpcCollection(this);
        this.projectiles = new ProjectileCollection(this);
    }

    /**
     * Register a collection for easy iteration
     */
    public register<T extends Collection<any>>(collection: T): T {
        log.debug(`Registering entity collection of type ${collection.constructor.name}`);
        if (!this.all.includes(collection)) {
            if (this !== collection.collections) {
                log.warning(
                    'Collections reference does not match. Registering is skipped. Check your implementation!'
                );
                return collection;
            }
            this.all.push(collection);
        }
        return collection;
    }

    /**
     * Perform a callback for each registered collection
     */
    forEachCollection(callback: (collection: Collection<any>) => void) {
        _.each(this.all, callback);
    }
}
