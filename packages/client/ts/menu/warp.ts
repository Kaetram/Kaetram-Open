import $ from 'jquery';

import Game from '../game';
import Packets from '../network/packets';

export default class Wrap {
    game: Game;
    mapFrame: JQuery;
    button: JQuery;
    close: JQuery;
    warpCount: number;

    constructor(game: Game) {
        this.game = game;

        this.mapFrame = $('#mapFrame');
        this.button = $('#warpButton');
        this.close = $('#closeMapFrame');

        this.warpCount = 0;

        this.load();
    }

    load(): void {
        this.button.click(() => {
            this.open();
        });

        this.close.click(() => {
            this.hide();
        });

        for (let i = 1; i < 7; i++) {
            const warp = this.mapFrame.find(`#warp${i}`);

            if (warp) {
                warp.click((event) => {
                    this.hide();

                    this.game.socket.send(Packets.Warp, [event.currentTarget.id.substring(4)]);
                });
            }

            this.warpCount++;
        }
    }

    open(): void {
        this.game.menu.hideAll();

        this.toggle();

        this.game.socket.send(Packets.Click, ['warp', this.button.hasClass('active')]);
    }

    toggle(): void {
        /**
         * Just so it fades out nicely.
         */

        if (this.isVisible()) this.hide();
        else this.display();
    }

    isVisible(): boolean {
        return this.mapFrame.css('display') === 'block';
    }

    display(): void {
        this.mapFrame.fadeIn('slow');
        this.button.addClass('active');
    }

    hide(): void {
        this.mapFrame.fadeOut('fast');
        this.button.removeClass('active');
    }

    clear(): void {
        for (let i = 0; i < this.warpCount; i++) this.mapFrame.find(`#warp${i}`).off('click');

        if (this.close) this.close.off('click');

        if (this.button) this.button.off('click');
    }
}
