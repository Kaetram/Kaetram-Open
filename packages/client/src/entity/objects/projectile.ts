import Utils from '../../utils/util';
import Entity from '../entity';

import { Modules } from '@kaetram/common/network';

import type Character from '../character/character';

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
        this.target = target;

        this.updateAngle();
    }

    /**
     * @returns How fast the projectile animation travels between frames (milliseconds)
     */

    public getAnimationSpeed(): number {
        return this.idleSpeed;
    }

    /**
     * Used to calculate the projectile's approach towards the target.
     * @returns Time difference betwene the last update and now.
     */

    public getTimeDiff(): number {
        return (Date.now() - this.lastUpdate) / 1000;
    }

    /**
     * Impact effect is a special effect that is played when the projectile despawns.
     * @returns The effect that is played when the projectile impacts the target.
     */

    public getImpactEffect(): Modules.Effects {
        switch (this.sprite.name) {
            case 'projectile-boulder': {
                return Modules.Effects.Boulder;
            }

            case 'projectile-poisonball': {
                return Modules.Effects.Poisonball;
            }

            case 'projectile-fireball':
            case 'projectile-gift6': {
                return Modules.Effects.Fireball;
            }

            case 'projectile-iceball': {
                return Modules.Effects.Iceball;
            }

            case 'projectile-terror': {
                return Modules.Effects.Terror;
            }
        }

        return Modules.Effects.None;
    }

    /**
     * Calculates the angle between the projectile and the target.
     * @returns Angle in radians so that the projectile faces the target.
     */

    public updateAngle(): void {
        if (!this.target) return;

        this.angle =
            Math.atan2(this.target.y - this.y, this.target.x - this.x) * (180 / Math.PI) - 90;
    }

    public override getAngle(): number {
        return (this.angle * Math.PI) / 180;
    }

    /**
     * Callback for when the projectile impacts the target.
     */

    public onImpact(callback: () => void): void {
        this.impactCallback = callback;
    }
}
