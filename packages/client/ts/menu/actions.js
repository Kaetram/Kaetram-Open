import $ from 'jquery';
import log from '../lib/log';

export default class Actions {
    constructor(menu) {
        var self = this;

        self.menu = menu;

        self.body = $('#actionContainer');
        self.drop = $('#dropDialog');
        self.dropInput = $('#dropCount');

        self.activeClass = null;

        self.miscButton = null;

        self.load();
    }

    load() {
        var self = this,
            dropAccept = $('#dropAccept'),
            dropCancel = $('#dropCancel');

        dropAccept.click(function (event) {
            if (self.activeClass === 'inventory') self.menu.inventory.clickAction(event);
        });

        dropCancel.click(function (event) {
            if (self.activeClass === 'inventory') self.menu.inventory.clickAction(event);
        });
    }

    loadDefaults(activeClass, data) {
        var self = this;

        self.reset();
        self.activeClass = activeClass;

        if (data)
            self.body.css({
                left: data.mouseX - self.body.width() / 2 + 'px',
                top: data.mouseY + self.body.height() / 2 + 'px'
            });

        switch (self.activeClass) {
            case 'inventory':
                self.body.css({
                    bottom: '10%',
                    left: '10%'
                });

                var dropButton = $('<div id="drop" class="actionButton">Drop</div>');

                self.add(dropButton);

                break;

            case 'player':
                self.add(self.getFollowButton());

                if (data.pvp) self.add(self.getAttackButton());

                break;

            case 'mob':
                self.add(self.getFollowButton());
                self.add(self.getAttackButton());

                break;

            case 'npc':
                self.add(self.getFollowButton());
                self.add(self.getTalkButton());

                break;

            case 'object':
                log.info('[loadDefaults] object.');

                break;
        }
    }

    add(button, misc) {
        var self = this;

        self.body.find('ul').prepend($('<li></li>').append(button));

        button.click(function (event) {
            if (self.activeClass === 'inventory') self.menu.inventory.clickAction(event);
        });

        if (misc) self.miscButton = button;
    }

    removeMisc() {
        var self = this;

        self.miscButton.remove();
        self.miscButton = null;
    }

    reset() {
        var self = this,
            buttons = self.getButtons();

        for (var i = 0; i < buttons.length; i++) $(buttons[i]).remove();
    }

    show() {
        this.body.fadeIn('fast');
    }

    hide() {
        this.body.fadeOut('slow');
    }

    clear() {
        var self = this;

        $('#dropAccept').off('click');
        $('#dropCancel').off('click');

        self.trade.off('click');
        self.follow.off('click');
    }

    displayDrop(activeClass) {
        var self = this;

        self.activeClass = activeClass;

        self.drop.fadeIn('fast');

        self.dropInput.focus();
        self.dropInput.select();
    }

    hideDrop() {
        var self = this;

        self.drop.fadeOut('slow');

        self.dropInput.blur();
        self.dropInput.val('');
    }

    getAttackButton() {
        return $('<div id="attack" class="actionButton">Attack</div>');
    }

    getFollowButton() {
        return $('<div id="follow" class="actionButton">Follow</div>');
    }

    getTradeButton() {
        return $('<div id="trade" class="actionButton">Trade</div>');
    }

    getTalkButton() {
        return $('<div id="talkButton" class="actionButton">Talk</div>');
    }

    getButtons() {
        return this.body.find('ul').find('li');
    }

    getGame() {
        return this.menu.game;
    }

    getPlayer() {
        return this.menu.game.player;
    }

    isVisible() {
        return this.body.css('display') === 'block';
    }
}
