import $ from 'jquery';

export default class Wrap {
    constructor(game) {
        this.game = game;

        this.mapFrame = $('#mapFrame');
        this.button = $('#warpButton');
        this.close = $('#closeMapFrame');

        this.warpCount = 0;

        this.load();
    }

    load() {
        var self = this;

        self.button.click(function () {
            self.open();
        });

        self.close.click(function () {
            self.hide();
        });

        for (var i = 1; i < 7; i++) {
            var warp = self.mapFrame.find('#warp' + i);

            if (warp) {
                warp.click(function (event) {
                    self.hide();

                    self.game.socket.send(Packets.Warp, [
                        event.currentTarget.id.substring(4),
                    ]);
                });
            }

            self.warpCount++;
        }
    }

    open() {
        var self = this;

        self.game.interface.hideAll();

        self.toggle();

        self.game.socket.send(Packets.Click, [
            'warp',
            self.button.hasClass('active'),
        ]);
    }

    toggle() {
        var self = this;

        /**
         * Just so it fades out nicely.
         */

        if (self.isVisible()) self.hide();
        else self.display();
    }

    isVisible() {
        return this.mapFrame.css('display') === 'block';
    }

    display() {
        var self = this;

        self.mapFrame.fadeIn('slow');
        self.button.addClass('active');
    }

    hide() {
        var self = this;

        self.mapFrame.fadeOut('fast');
        self.button.removeClass('active');
    }

    clear() {
        var self = this;

        for (var i = 0; i < self.warpCount; i++)
            self.mapFrame.find('#warp' + i).unbind('click');

        if (self.close) self.close.unbind('click');

        if (self.button) self.button.unbind('click');
    }
}
