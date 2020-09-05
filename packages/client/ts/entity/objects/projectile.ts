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
    destX: number;
    destY: number;
    special: number;
    static: boolean;
    dynamic: boolean;
    speed: number;
    lighting: Lighting;
    impactCallback: () => void;

    constructor(id: string, kind: number, owner: Entity) {
        super(id, kind);

        this.owner = owner;

        this.name = '';

        this.startX = -1;
        this.startY = -1;

        this.destX = -1;
        this.destY = -1;

        this.special = -1;

        this.static = false;
        this.dynamic = false;

        this.speed = 150;

        this.angle = 0;

        this.lighting = null;
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

    setDestination(x: number, y: number): void {
        this.static = true;

        this.destX = x;
        this.destY = y;

        this.updateAngle();
    }

    setTarget(target: Character): void {
        if (!target) return;

        this.dynamic = true;

        this.destX = target.x;
        this.destY = target.y;

        this.updateAngle();

        if (target.type !== 'mob') return;

        target.onMove(() => {
            this.destX = target.x;
            this.destY = target.y;

            this.updateAngle();
        });
    }

    getSpeed(): number {
        return 1;
    }

    updateTarget(x: number, y: number): void {
        this.destX = x;
        this.destY = y;
    }

    hasPath(): boolean {
        return false;
    }

    updateAngle(): void {
        this.angle = Math.atan2(this.destY - this.y, this.destX - this.x) * (180 / Math.PI) - 90;
    }

    onImpact(callback: () => void): void {
        this.impactCallback = callback;
    }
}
