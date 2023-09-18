import Entity from '../entity';

import { Modules } from '@kaetram/common/network';

import type Character from '../character/character';

export default class Projectile extends Entity {
    public override type: number = Modules.EntityType.Projectile;

    public override readonly fadingDuration: number = 100;

    public speed = 150;

    public target!: Character;

    // Callback created when the projectile impacts the target.
    public impactCallback?(): void;

    public constructor(
        instance: string,
        private hitType: Modules.Hits
    ) {
        super(instance, Modules.EntityType.Projectile);
    }

    /**
     * Override for the idle animation to use the projectile's default animation.
     */

    public override idle(): void {
        this.setAnimation('travel');
    }

    /**
     * Updates the projectile's target and calculates the new angle.
     * @param target The character object that we are setting as the target.
     */

    public setTarget(target: Character): void {
        this.target = target;

        this.updateAngle();
    }

    /**
     * @returns How fast the projectile animation travels between frames (milliseconds)
     */

    public getAnimationSpeed(): number {
        return this.sprite.idleSpeed;
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
        switch (this.hitType) {
            case Modules.Hits.Explosive: {
                return Modules.Effects.Fireball;
            }
        }

        switch (this.sprite.key) {
            case 'projectiles/boulder': {
                return Modules.Effects.Boulder;
            }

            case 'projectiles/poisonball': {
                return Modules.Effects.Poisonball;
            }

            case 'projectiles/fireball':
            case 'projectiles/gift6': {
                return Modules.Effects.Fireball;
            }

            case 'projectiles/iceball': {
                return Modules.Effects.Iceball;
            }

            case 'projectiles/terror': {
                return Modules.Effects.Terror;
            }
        }

        return Modules.Effects.None;
    }

    /**
     * Updates the projectile's angle to face the target. We take the
     * inverse tangent of the target's y and x coordinates.
     */

    public updateAngle(): void {
        if (!this.target) return;

        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x) - Math.PI / 2;
    }

    /**
     * Callback for when the projectile impacts the target.
     */

    public onImpact(callback: () => void): void {
        this.impactCallback = callback;
    }
}
