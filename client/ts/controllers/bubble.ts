import $ from 'jquery';
import _ from 'underscore';

import Game from '../game';
import Blob from '../renderer/bubbles/blob';

export default class Bubble {
    bubbles: { [key: string]: Blob };
    container: JQuery<HTMLElement>;

    constructor(public game: Game) {
        this.game = game;
        this.bubbles = {};

        this.container = $('#bubbles');
    }

    /**
     * This creates the blob that will be used to display text.
     *
     * @param id - An identifier for the bubble we are creating.
     * @param message - A string of the text we are displaying.
     * @param duration - How long the bubble will display for.
     * @param isObject - (optional) Boolean value used to determine object.
     * @param info - (optional) Used in conjunction with `isObject` to specify object data.
     */
    create(id, message: string, duration?: number, isObject?: boolean, info?) {
        if (this.bubbles[id]) {
            this.bubbles[id].reset(this.game.time);
            $(`#${id} p`).html(message);
        } else {
            const element = $(
                `<div id='${id}'class='bubble'><p>${message}</p><div class='bubbleTip'></div></div>`
            );

            $(element).appendTo(this.container);

            this.bubbles[id] = new Blob(id, element, duration, isObject, info);

            return this.bubbles[id];
        }
    }

    setTo(info) {
        const bubble = this.get(info.id);

        if (!bubble || !info) return;

        const scale = this.game.renderer.getScale();
        const tileSize = 16 * scale;
        const x = (info.x - this.game.getCamera().x) * scale;
        const width = parseInt(bubble.element.css('width')) + 24;
        const offset = width / 2 - tileSize / 2;
        const offsetY = -20;
        const y =
            (info.y - this.game.getCamera().y) * scale - tileSize * 2 - offsetY;

        bubble.element.css(
            'left',
            `${x - offset + (2 + this.game.renderer.scale)}px`
        );
        bubble.element.css('top', `${y}px`);
    }

    update(time) {
        _.each(this.bubbles, (bubble) => {
            const entity = this.game.entities.get(bubble.id);

            if (entity) this.setTo(entity);

            if (bubble.type === 'object') this.setTo(bubble.info);

            if (bubble.isOver(time)) {
                bubble.destroy();
                delete this.bubbles[bubble.id];
            }
        });
    }

    get(id) {
        if (id in this.bubbles) return this.bubbles[id];

        return null;
    }

    clean() {
        _.each(this.bubbles, (bubble) => {
            bubble.destroy();
        });

        this.bubbles = {};
    }

    destroy(id) {
        const bubble = this.get(id);

        if (!bubble) return;

        bubble.destroy();
        delete this.bubbles[id];
    }
}
