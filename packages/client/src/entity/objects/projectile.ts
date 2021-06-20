import Entity from '../entity';

import type Character from '../character/character';

export default class Projectile extends Entity {
    // public name = '';

    public speed = 150;
    // public angle = 0;

    public override readonly fadingDuration = 100;

    public target!: Character;

    private impactCallback?(): void;

    public constructor(id: string, kind: string, public owner: Entity) {
        super(id, kind);
    }

    public getId(): string {
        return this.id;
    }

    public impact(): void {
        this.impactCallback?.();
    }

    public setStart(x: number, y: number): void {
        this.setGridPosition(Math.floor(x / 16), Math.floor(y / 16));
    }

    public setTarget(target: Character): void {
        if (!target) return;

        this.target = target;

        this.updateAngle();
    }

    public getSpeed(): number {
        return 1;
    }

    // public hasPath(): boolean {
    //     return false;
    // }

    public updateAngle(): void {
        if (!this.target) return;

        this.angle =
            Math.atan2(this.target.y - this.y, this.target.x - this.x) * (180 / Math.PI) - 90;
    }

    public override getAngle(): number {
        return (this.angle * Math.PI) / 180;
    }

    public onImpact(callback: () => void): void {
        this.impactCallback = callback;
    }
}
