import $ from 'jquery';
import log from '../lib/log';
import MenuController from '../controllers/menu';
import Player from '../entity/character/player/player';
import Game from '../game';

export default class Actions {
    menu: MenuController;
    body: JQuery;
    drop: JQuery<HTMLDivElement>;
    dropInput: JQuery<HTMLInputElement>;
    activeClass: string;
    miscButton: JQuery;
    trade: JQuery;
    follow: JQuery;

    constructor(menu: MenuController) {
        this.menu = menu;

        this.body = $('#actionContainer');
        this.drop = $('#dropDialog');
        this.dropInput = $('#dropCount');

        this.activeClass = null;

        this.miscButton = null;

        this.load();
    }

    load(): void {
        const dropAccept = $('#dropAccept'),
            dropCancel = $('#dropCancel');

        dropAccept.click((event) => {
            if (this.activeClass === 'inventory') this.menu.inventory.clickAction(event);
        });

        dropCancel.click((event) => {
            if (this.activeClass === 'inventory') this.menu.inventory.clickAction(event);
        });
    }

    loadDefaults(activeClass: string, data?: any): void {
        this.reset();
        this.activeClass = activeClass;

        if (data)
            this.body.css({
                left: `${data.mouseX - this.body.width() / 2}px`,
                top: `${data.mouseY}${this.body.height() / 2}px`
            });

        switch (this.activeClass) {
            case 'inventory': {
                this.body.css({
                    bottom: '10%',
                    left: '10%'
                });

                const dropButton = $('<div id="drop" class="actionButton">Drop</div>');

                this.add(dropButton);

                break;
            }

            case 'player': {
                this.add(this.getFollowButton());

                if (data.pvp) this.add(this.getAttackButton());

                break;
            }

            case 'mob': {
                this.add(this.getFollowButton());
                this.add(this.getAttackButton());

                break;
            }

            case 'npc': {
                this.add(this.getFollowButton());
                this.add(this.getTalkButton());

                break;
            }

            case 'object': {
                log.info('[loadDefaults] object.');

                break;
            }
        }
    }

    add(button: JQuery, misc?: boolean): void {
        this.body.find('ul').prepend($('<li></li>').append(button));

        button.click((event) => {
            if (this.activeClass === 'inventory') this.menu.inventory.clickAction(event);
        });

        if (misc) this.miscButton = button;
    }

    removeMisc(): void {
        this.miscButton.remove();
        this.miscButton = null;
    }

    reset(): void {
        const buttons = this.getButtons();

        for (let i = 0; i < buttons.length; i++) $(buttons[i]).remove();
    }

    show(): void {
        this.body.fadeIn('fast');
    }

    hide(): void {
        this.body.fadeOut('slow');
    }

    clear(): void {
        $('#dropAccept').off('click');
        $('#dropCancel').off('click');

        this.trade?.off('click');
        this.follow?.off('click');
    }

    displayDrop(activeClass: string): void {
        this.activeClass = activeClass;

        this.drop.fadeIn('fast');

        this.dropInput.focus();
        this.dropInput.select();
    }

    hideDrop(): void {
        this.drop.fadeOut('slow');

        this.dropInput.blur();
        this.dropInput.val('');
    }

    getAttackButton(): JQuery {
        return $('<div id="attack" class="actionButton">Attack</div>');
    }

    getFollowButton(): JQuery {
        return $('<div id="follow" class="actionButton">Follow</div>');
    }

    getTradeButton(): JQuery {
        return $('<div id="trade" class="actionButton">Trade</div>');
    }

    getTalkButton(): JQuery {
        return $('<div id="talkButton" class="actionButton">Talk</div>');
    }

    getButtons(): JQuery {
        return this.body.find('ul').find('li');
    }

    getGame(): Game {
        return this.menu.game;
    }

    getPlayer(): Player {
        return this.menu.game.player;
    }

    isVisible(): boolean {
        return this.body.css('display') === 'block';
    }
}
