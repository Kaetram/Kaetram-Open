import { Lighting } from 'illuminated';

import Character from '../character/character';
import Entity from '../entity';

export default class Projectile extends Entity {
    name: string;
    angled: boolean;
    type: string;
    owner: Entity;
    startX: number;
    startY: number;
    special: number;
    static: boolean;
    dynamic: boolean;
    speed: number;
    lighting: Lighting;

    target: Character;

    impactCallback: () => void;

    constructor(id: string, type: string, owner: Entity) {
        super(id, type);

        this.owner = owner;

        this.name = '';

        this.startX = -1;
        this.startY = -1;

        this.special = -1;

        this.static = false;
        this.dynamic = false;

        this.speed = 150;

        this.angle = 0;

        this.lighting = null;

        this.fadingDuration = 100;
    }

    getId(): string {
        return this.id;
    }

    impact(): void {
        this.impactCallback?.();
    }

    setStart(x: number, y: number): void {
        this.setGridPosition(Math.floor(x / 16), Math.floor(y / 16));

        this.startX = x;
        this.startY = y;
    }

    setTarget(target: Character): void {
        if (!target) return;

        this.dynamic = true;

        this.target = target;

        this.updateAngle();
    }

    getSpeed(): number {
        return 1;
    }

    hasPath(): boolean {
        return false;
    }

    updateAngle(): void {
        if (!this.target) return;

        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x) * (180 / Math.PI) - 90;
    }

    getAngle(): number {
        return (this.angle * Math.PI) / 180;
    }

    onImpact(callback: () => void): void {
        this.impactCallback = callback;
    }
}
