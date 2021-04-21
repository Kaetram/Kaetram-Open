/* global module */

import Mob from '../../game/entity/character/mob/mob';
import Player from '../../game/entity/character/player/player';

class Area {

    public id: number;
    public x: number;
    public y: number;
    public width: number;
    public height: number;

    public polygon: any[];

    public entities: any;
    public chest: any;
    public items: any;

    public hasRespawned: boolean;

    // Overlay properties
    public darkness: string;
    public type: string;
    public fog: boolean;

    // Properties it can hold
    public achievement: number;
    public cameraType: string;
    public song: string;

    // Door coordinates
    public tx: number;
    public ty: number;

    // Chest coordinates
    public cx: number;
    public cy: number;

    public maxEntities: number;
    public spawnDelay: number;
    public lastSpawn: number;

    private spawnCallback: Function;
    private emptyCallback: Function;

    constructor(id: number, x: number, y: number, width: number, height: number) {
        this.id = id;

        this.x = x;
        this.y = y;

        this.width = width;
        this.height = height;

        this.entities = [];
        this.items = [];

        this.hasRespawned = true;
        this.chest = null;

        this.maxEntities = 0;
        this.spawnDelay = 0;
    }

    addEntity(mob: Mob) {
        if (this.entities.indexOf(mob) > 0) return;

        this.entities.push(mob);
        mob.area = this;

        // Grab a spawn delay from an mob to create an offset for the chest.
        if (!this.spawnDelay) this.spawnDelay = mob.respawnDelay;

        if (this.spawnCallback) this.spawnCallback();
    }

    removeEntity(mob: Mob) {
        let index = this.entities.indexOf(mob);

        if (index > -1) this.entities.splice(index, 1);

        if (this.entities.length === 0 && this.emptyCallback) {
            if (mob.lastAttacker) this.handleAchievement(mob.lastAttacker);

            this.emptyCallback();
        }
    }

    handleAchievement(player: Player) {
        if (!this.achievement) return;

        player.finishAchievement(this.achievement);
    }

    contains(x: number, y: number): boolean {
        return this.polygon ? this.inPolygon(x, y) : this.inRectangularArea(x, y);
    }

    inRectangularArea(x: number, y: number): boolean {
        return x >= this.x && y >= this.y && x < this.x + this.width && y < this.y + this.height;
    }

    inPolygon(x: number, y: number): boolean {
        for (let i = 0, j = this.polygon.length - 1; i < this.polygon.length; j = i++) {
            let xi = this.polygon[i].x, yi = this.polygon[i].y,
                xj = this.polygon[j].x, yj = this.polygon[j].y;

            let intersect = ((yi > y) != (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

            if (intersect) return true;
        }

        return false;
    }

    setMaxEntities(maxEntities: number) {
        this.maxEntities = maxEntities;
    }

    onEmpty(callback: Function) {
        this.emptyCallback = callback;
    }

    onSpawn(callback: Function) {
        this.spawnCallback = callback;
    }
}

export default Area;
