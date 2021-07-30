import $ from 'jquery';

import Character from '../entity/character/character';
import Mob from '../entity/character/mob/mob';
import NPC from '../entity/character/npc/npc';
import Player from '../entity/character/player/player';
import Item from '../entity/objects/item';

import type Entity from '../entity/entity';
import type InputController from './input';

export default class OverlayController {
    private hovering!: Entity | null;

    private attackInfo = $('#attackInfo');

    // private image = this.attackInfo.find('.image div');
    private name = this.attackInfo.find('.name');
    private details = this.attackInfo.find('.details');
    private health = this.attackInfo.find('.health');

    public updateCallback?(id: string, data: number): void;

    public constructor(private input: InputController) {}

    public update(entity: Entity | undefined): void {
        let { name, health, details } = this;

        if (!entity || !this.validEntity(entity)) {
            this.hovering = null;

            if (this.isVisible()) this.hide();

            return;
        }

        if (!this.isVisible()) this.display();

        this.hovering = entity;

        name.html(entity instanceof Player ? entity.username : entity.name);

        if (this.hasHealth() && entity instanceof Character) {
            health.css({
                display: 'block',
                width: `${Math.ceil((entity.hitPoints / entity.maxHitPoints) * 100) - 10}%`
            });

            details.html(`${entity.hitPoints} / ${entity.maxHitPoints}`);
        } else {
            health.hide();
            details.html('');
        }

        this.onUpdate((entityId: string, hitPoints: number) => {
            let { hovering } = this;
            if (
                hovering &&
                hovering.id === entityId &&
                hovering instanceof NPC &&
                hovering instanceof Item
            )
                if (hitPoints < 1) this.hide();
                else {
                    health.css(
                        'width',
                        `${Math.ceil((hitPoints / hovering.maxHitPoints) * 100) - 10}%`
                    );
                    details.html(`${hitPoints} / ${hovering.maxHitPoints}`);
                }
        });
    }

    private validEntity(entity: Entity): boolean {
        return entity && entity.id !== this.input.getPlayer().id && entity.type !== 'projectile';
    }

    private hasHealth(): boolean {
        return this.hovering
            ? this.hovering instanceof Mob || this.hovering instanceof Player
            : false;
    }

    private display(): void {
        this.attackInfo.fadeIn('fast');
    }

    private hide(): void {
        this.attackInfo.fadeOut('fast');
    }

    private isVisible(): boolean {
        return this.attackInfo.css('display') === 'block';
    }

    private onUpdate(callback: (id: string, data: number) => void): void {
        this.updateCallback = callback;
    }
}
