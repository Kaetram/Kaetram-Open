/* global _, Modules */

import $ from 'jquery';
import Packets from '../network/packets';

export default class Warp {
    game: any;
    interface: any;
    mapFrame: JQuery<HTMLElement>;
    button: JQuery<HTMLElement>;
    close: JQuery<HTMLElement>;
    warpCount: number;
    constructor(game, intrface) {
        this.game = game;
        this.interface = intrface;

        this.mapFrame = $('#mapFrame');
        this.button = $('#warpButton');
        this.close = $('#closeMapFrame');

        this.warpCount = 0;

        this.load();
    }

    load() {
        this.button.click(() => {
            this.open();
        });

        this.close.click(() => {
            this.hide();
        });

        for (let i = 1; i < 7; i++) {
            const warp = this.mapFrame.find('#warp' + i);

            if (warp) {
                warp.click((event) => {
                    this.hide();

                    this.game.socket.send(Packets.Warp, [
                        event.currentTarget.id.substring(4)
                    ]);
                });
            }

            this.warpCount++;
        }
    }

    open() {
        this.game.interface.hideAll();

        this.toggle();

        this.game.socket.send(Packets.Click, [
            'warp',
            this.button.hasClass('active')
        ]);
    }

    toggle() {
        /**
         * Just so it fades out nicely.
         */

        if (this.isVisible()) this.hide();
        else this.display();
    }

    isVisible() {
        return this.mapFrame.css('display') === 'block';
    }

    display() {
        this.mapFrame.fadeIn('slow');
        this.button.addClass('active');
    }

    hide() {
        this.mapFrame.fadeOut('fast');
        this.button.removeClass('active');
    }

    clear() {
        for (let i = 0; i < this.warpCount; i++)
            this.mapFrame.find('#warp' + i).unbind('click');

        if (this.close) this.close.unbind('click');

        if (this.button) this.button.unbind('click');
    }
};
