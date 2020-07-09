import $ from 'jquery';

export default class OverlayController {
    constructor(input) {
        var self = this;

        self.input = input;
        self.hovering = null;

        self.attackInfo = $('#attackInfo');

        self.image = self.attackInfo.find('.image div');
        self.name = self.attackInfo.find('.name');
        self.details = self.attackInfo.find('.details');
        self.health = self.attackInfo.find('.health');
    }

    update(entity) {
        var self = this;

        if (!self.validEntity(entity)) {
            self.hovering = null;

            if (self.isVisible()) self.hide();

            return;
        }

        if (!self.isVisible()) self.display();

        self.hovering = entity;

        self.name.html(entity.type === 'player' ? entity.username : entity.name);

        if (self.hasHealth()) {
            self.health.css({
                display: 'block',
                width: Math.ceil((entity.hitPoints / entity.maxHitPoints) * 100) - 10 + '%',
            });

            self.details.html(entity.hitPoints + ' / ' + entity.maxHitPoints);
        } else {
            self.health.css('display', 'none');
            self.details.html('');
        }

        self.onUpdate(function (entityId, hitPoints) {
            if (
                self.hovering &&
                self.hovering.id === entityId &&
                self.hovering.type !== 'npc' &&
                self.hovering.type !== 'item'
            ) {
                if (hitPoints < 1) self.hide();
                else {
                    self.health.css(
                        'width',
                        Math.ceil((hitPoints / self.hovering.maxHitPoints) * 100) - 10 + '%'
                    );
                    self.details.html(hitPoints + ' / ' + self.hovering.maxHitPoints);
                }
            }
        });
    }

    validEntity(entity) {
        return entity && entity.id !== this.input.getPlayer().id && entity.type !== 'projectile';
    }

    clean() {
        var self = this;

        self.details.html('');
        self.hovering = null;
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
}
