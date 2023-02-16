import AllCollection from './all';
import ChestCollection from './chests';
import ItemCollection from './items';
import MobCollection from './mobs';
import NpcCollection from './npcs';
import PlayerCollection from './players';
import ProjectileCollection from './projectiles';
import PetsCollection from './pets';

import log from '@kaetram/common/util/log';

import type Collection from './collection';
import type World from '../../world';
import type Entity from '../entity';

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
    public readonly pets: PetsCollection;
    private readonly all: Collection<Entity>[] = [];

    public constructor(public world: World) {
        this.allEntities = new AllCollection(this);
        this.players = new PlayerCollection(this);
        this.items = new ItemCollection(this);
        this.mobs = new MobCollection(this);
        this.chests = new ChestCollection(this);
        this.npcs = new NpcCollection(this);
        this.projectiles = new ProjectileCollection(this);
        this.pets = new PetsCollection(this);
    }

    /**
     * Registers a collection of entities that we later use for iterating.
     */

    public register<T extends Collection<Entity>>(collection: T): T {
        log.debug(`Registering entity collection of type ${collection.constructor.name}`);

        // Collection hasn't been registered yet.
        if (!this.all.includes(collection)) this.all.push(collection);

        return collection;
    }

    /**
     * Iterates through each collection and returns a callback for it.
     */

    public forEachCollection(callback: (collection: Collection<Entity>) => void): void {
        for (let collection of this.all) callback(collection);
    }
}
