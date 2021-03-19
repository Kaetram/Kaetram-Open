import $ from 'jquery';

import type Character from '../entity/character/character';
import type Player from '../entity/character/player/player';
import type Entity from '../entity/entity';
import type InputController from './input';

export default class OverlayController {
    private hovering!: Entity | null;

    private attackInfo = $('#attackInfo');

    // private image = this.attackInfo.find('.image div');
    private name = this.attackInfo.find('.name');
    private details = this.attackInfo.find('.details');
    private health = this.attackInfo.find('.health');

    public updateCallback!: (id: string, data: number) => void;

    public constructor(private input: InputController) {}

    public update(entity: Entity | undefined): void {
        if (!entity || !this.validEntity(entity)) {
            this.hovering = null;

            if (this.isVisible()) this.hide();

            return;
        }

        if (!this.isVisible()) this.display();

        this.hovering = entity;

        this.name.html(entity.type === 'player' ? (entity as Player).username : entity.name);

        if (this.hasHealth()) {
            this.health.css({
                display: 'block',
                /* stylelint-disable */
                width: `${
                    Math.ceil(
                        ((entity?.hitPoints as number) / (entity as Character).maxHitPoints) * 100
                    ) - 10
                }%`
            });

            this.details.html(
                `${entity?.hitPoints as number} / ${(entity as Character).maxHitPoints}`
            );
        } else {
            this.health.hide();
            this.details.html('');
        }

        this.onUpdate((entityId: string, hitPoints: number) => {
            const hovering = this.hovering as Character;
            if (
                hovering &&
                hovering.id === entityId &&
                hovering.type !== 'npc' &&
                hovering.type !== 'item'
            )
                if (hitPoints < 1) this.hide();
                else {
                    this.health.css(
                        'width',
                        `${Math.ceil((hitPoints / hovering.maxHitPoints) * 100) - 10}%`
                    );
                    this.details.html(`${hitPoints} / ${hovering.maxHitPoints}`);
                }
        });
    }

    private validEntity(entity: Entity): boolean {
        return entity && entity.id !== this.input.getPlayer().id && entity.type !== 'projectile';
    }

    private hasHealth(): boolean {
        return this.hovering
            ? this.hovering.type === 'mob' || this.hovering.type === 'player'
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
