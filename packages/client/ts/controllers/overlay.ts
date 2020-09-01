import $ from 'jquery';
import Entity from '../entity/entity';
import Player from '../entity/character/player/player';
import Game from '../game';
import InputController from './input';
import Character from '../entity/character/character';

export default class OverlayController {
    hovering: Entity;
    input: InputController;

    attackInfo: JQuery;
    image: JQuery;
    name: JQuery;
    details: JQuery;
    health: JQuery;

    updateCallback: (id: string, data: any) => void;

    constructor(input: InputController) {
        this.input = input;
        this.hovering = null;

        this.attackInfo = $('#attackInfo');

        this.image = this.attackInfo.find('.image div');
        this.name = this.attackInfo.find('.name');
        this.details = this.attackInfo.find('.details');
        this.health = this.attackInfo.find('.health');
    }

    update(entity: Entity): void {
        if (!this.validEntity(entity)) {
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
                width: `${
                    Math.ceil((entity.hitPoints / (entity as Character).maxHitPoints) * 100) - 10
                }%`
            });

            this.details.html(`${entity.hitPoints} / ${(entity as Character).maxHitPoints}`);
        } else {
            this.health.css('display', 'none');
            this.details.html('');
        }

        this.onUpdate((entityId: string, hitPoints: number) => {
            const hovering = this.hovering as Character;
            if (
                hovering &&
                hovering.id === entityId &&
                hovering.type !== 'npc' &&
                hovering.type !== 'item'
            ) {
                if (hitPoints < 1) this.hide();
                else {
                    this.health.css(
                        'width',
                        `${Math.ceil((hitPoints / hovering.maxHitPoints) * 100) - 10}%`
                    );
                    this.details.html(`${hitPoints} / ${hovering.maxHitPoints}`);
                }
            }
        });
    }

    validEntity(entity: Entity): boolean {
        return entity && entity.id !== this.input.getPlayer().id && entity.type !== 'projectile';
    }

    clean(): void {
        this.details.html('');
        this.hovering = null;
    }

    hasHealth(): boolean {
        return this.hovering.type === 'mob' || this.hovering.type === 'player';
    }

    display(): void {
        this.attackInfo.fadeIn('fast');
    }

    hide(): void {
        this.attackInfo.fadeOut('fast');
    }

    isVisible(): boolean {
        return this.attackInfo.css('display') === 'block';
    }

    getGame(): Game {
        return this.input.game;
    }

    onUpdate(callback: (id: string, data: any) => void): void {
        this.updateCallback = callback;
    }
}
