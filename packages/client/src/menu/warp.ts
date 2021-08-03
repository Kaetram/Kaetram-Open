import $ from 'jquery';

import { Packets } from '@kaetram/common/network';

import type Game from '../game';

export default class Wrap {
    private mapFrame = $('#mapFrame');
    private button = $('#warpButton');
    private close = $('#closeMapFrame');

    private warpCount = 0;

    public constructor(private game: Game) {
        this.load();
    }

    private load(): void {
        this.button.on('click', () => this.open());

        this.close.on('click', () => this.hide());

        for (let i = 1; i < 7; i++) {
            let warp = this.mapFrame.find(`#warp${i}`);

            if (warp)
                warp.on('click', (event) => {
                    this.hide();

                    this.game.socket.send(Packets.Warp, [event.currentTarget.id.slice(4)]);
                });

            this.warpCount++;
        }
    }

    public open(): void {
        this.game.menu.hideAll();

        this.toggle();

        this.game.socket.send(Packets.Click, ['warp', this.button.hasClass('active')]);
    }

    private toggle(): void {
        /**
         * Just so it fades out nicely.
         */

        if (this.isVisible()) this.hide();
        else this.display();
    }

    public isVisible(): boolean {
        return this.mapFrame.css('display') === 'block';
    }

    private display(): void {
        this.mapFrame.fadeIn('slow');
        this.button.addClass('active');
    }

    public hide(): void {
        this.mapFrame.fadeOut('fast');
        this.button.removeClass('active');
    }

    public clear(): void {
        for (let i = 0; i < this.warpCount; i++) this.mapFrame.find(`#warp${i}`).off('click');

        this.close?.off('click');

        this.button?.off('click');
    }
}
