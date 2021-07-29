import type Mob from '../../game/entity/character/mob/mob';
import type Player from '../../game/entity/character/player/player';
import type Chest from '../../game/entity/objects/chest';

export default class Area {
    public polygon!: Pos[];

    private entities: Mob[] = [];
    public chest: Chest | null = null;
    public items: string[] = [];

    public hasRespawned = true;

    // Overlay properties
    public darkness!: number;
    public type!: string;
    public fog!: string;

    // Properties it can hold
    public achievement!: number;
    public cameraType!: string;
    public song!: string;

    // Door coordinates
    public tx!: number;
    public ty!: number;

    // Chest coordinates
    public cx!: number;
    public cy!: number;

    public maxEntities = 0;
    public spawnDelay = 0;
    public lastSpawn!: number;

    private spawnCallback?(): void;
    private emptyCallback?(): void;

    public constructor(
        public id: number,
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) {}

    public addEntity(mob: Mob): void {
        if (!this.entities.includes(mob)) return;
        this.entities.push(mob);
        mob.area = this;

        // Grab a spawn delay from an mob to create an offset for the chest.
        if (!this.spawnDelay) this.spawnDelay = mob.respawnDelay;

        this.spawnCallback?.();
    }

    public removeEntity(mob: Mob): void {
        let index = this.entities.indexOf(mob);

        if (index > -1) this.entities.splice(index, 1);

        if (this.entities.length === 0 && this.emptyCallback) {
            if (mob.lastAttacker) this.handleAchievement(mob.lastAttacker as Player);

            this.emptyCallback();
        }
    }

    private handleAchievement(player: Player): void {
        if (!this.achievement) return;

        player.finishAchievement(this.achievement);
    }

    public contains(x: number, y: number): boolean {
        return this.polygon ? this.inPolygon(x, y) : this.inRectangularArea(x, y);
    }

    private inRectangularArea(x: number, y: number): boolean {
        return x >= this.x && y >= this.y && x < this.x + this.width && y < this.y + this.height;
    }

    private inPolygon(x: number, y: number): boolean {
        for (let i = 0, j = this.polygon.length - 1; i < this.polygon.length; j = i++) {
            let xi = this.polygon[i].x,
                yi = this.polygon[i].y,
                xj = this.polygon[j].x,
                yj = this.polygon[j].y,
                intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

            if (intersect) return true;
        }

        return false;
    }

    private setMaxEntities(maxEntities: number): void {
        this.maxEntities = maxEntities;
    }

    public onEmpty(callback: () => void): void {
        this.emptyCallback = callback;
    }

    public onSpawn(callback: () => void): void {
        this.spawnCallback = callback;
    }
}
