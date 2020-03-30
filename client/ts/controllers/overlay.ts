import $ from 'jquery';

export default class Overlay {
    input: any;
    hovering: any;
    attackInfo: JQuery<HTMLElement>;
    image: any;
    name: any;
    details: any;
    health: any;
    updateCallback: any;
    constructor(input) {
        this.input = input;
        this.hovering = null;

        this.attackInfo = $('#attackInfo');

        this.image = this.attackInfo.find('.image div');
        this.name = this.attackInfo.find('.name');
        this.details = this.attackInfo.find('.details');
        this.health = this.attackInfo.find('.health');
    }

    update(entity) {
        if (!this.validEntity(entity)) {
            this.hovering = null;

            if (this.isVisible()) this.hide();

            return;
        }

        if (!this.isVisible()) this.display();

        this.hovering = entity;

        this.name.html(
            entity.type === 'player' ? entity.username : entity.name
        );

        if (this.hasHealth()) {
            this.health.css({
                display: 'block',
                width:
                    Math.ceil((entity.hitPoints / entity.maxHitPoints) * 100) -
                    10 +
                    '%'
            });

            this.details.html(entity.hitPoints + ' / ' + entity.maxHitPoints);
        } else {
            this.health.css('display', 'none');
            this.details.html('');
        }

        this.onUpdate((entityId, hitPoints) => {
            if (
                this.hovering &&
                this.hovering.id === entityId &&
                this.hovering.type !== 'npc' &&
                this.hovering.type !== 'item'
            ) {
                if (hitPoints < 1) this.hide();
                else {
                    this.health.css(
                        'width',
                        Math.ceil(
                            (hitPoints / this.hovering.maxHitPoints) * 100
                        ) -
                            10 +
                            '%'
                    );
                    this.details.html(
                        hitPoints + ' / ' + this.hovering.maxHitPoints
                    );
                }
            }
        });
    }

    validEntity(entity) {
        return (
            entity &&
            entity.id !== this.input.getPlayer().id &&
            entity.type !== 'projectile'
        );
    }

    clean() {
        this.details.html('');
        this.hovering = null;
    }

    hasHealth() {
        return this.hovering.type === 'mob' || this.hovering.type === 'player';
    }

    display() {
        this.attackInfo.fadeIn('fast');
    }

    hide() {
        this.attackInfo.fadeOut('fast');
    }

    isVisible() {
        return this.attackInfo.css('display') === 'block';
    }

    getGame() {
        return this.input.game;
    }

    onUpdate(callback) {
        this.updateCallback = callback;
    }
};
