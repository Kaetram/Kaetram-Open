import Entity from '../entity';
import Utils from '../../utils/util';

import type Character from '../character/character';
import { Modules } from '@kaetram/common/network';

export default class Projectile extends Entity {
    public override type = Modules.EntityType.Projectile;

    public speed = 150;

    public override readonly fadingDuration = 100;

    public target!: Character;

    private impactCallback?(): void;

    public constructor(instance: string, public owner: Entity) {
        super(instance, Modules.EntityType.Projectile);
    }

    public override idle(): void {
        this.setAnimation('travel');
    }

    public impact(): void {
        this.impactCallback?.();
    }

    public setStart(x: number, y: number): void {
        this.setGridPosition(Math.floor(x / Utils.tileSize), Math.floor(y / Utils.tileSize));
    }

    public setTarget(target: Character): void {
        if (!target) return;

        this.target = target;

        this.updateAngle();
    }

    public getAnimationSpeed(): number {
        return this.idleSpeed;
    }

    public getTimeDiff(): number {
        return (Date.now() - this.lastUpdate) / 1000;
    }

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
