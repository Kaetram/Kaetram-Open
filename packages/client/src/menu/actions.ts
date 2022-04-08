import $ from 'jquery';

import log from '../lib/log';

import type MenuController from '../controllers/menu';

interface ActionsData {
    mouseX: number;
    mouseY: number;
    pvp: boolean;
}

export default class Actions {
    private body = $('#action-container');

    private drop = $('#drop-dialog');
    private dropInput = $('#drop-count');

    private activeClass: string | null = null;
    private miscButton: JQuery | null = null;

    private trade!: JQuery;
    private follow!: JQuery;

    public constructor(private menu: MenuController) {
        this.load();
    }

    private load(): void {
        let dropAccept = $('#drop-accept'),
            dropCancel = $('#drop-cancel');

        dropAccept.on('click', (event) => {
            if (this.activeClass === 'inventory') this.menu.inventory.clickAction(event);
        });

        dropCancel.on('click', (event) => {
            if (this.activeClass === 'inventory') this.menu.inventory.clickAction(event);
        });
    }

    public loadDefaults(activeClass: string, data?: ActionsData): void {
        this.reset();
        this.activeClass = activeClass;

        if (data)
            this.body.css({
                left: `${data.mouseX - this.body.width()! / 2}px`,
                top: `${data.mouseY}${this.body.height()! / 2}px`
            });

        switch (this.activeClass) {
            case 'inventory': {
                this.body.css({
                    bottom: '10%',
                    left: '10%'
                });

                let dropButton = $('<div id="drop" class="action-button">Drop</div>');

                this.add(dropButton);

                break;
            }

            case 'player': {
                this.add(this.getFollowButton());

                if (data!.pvp) this.add(this.getAttackButton());

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

    public add(button: JQuery, misc = false): void {
        this.body.find('ul').prepend($('<li></li>').append(button));

        button.on('click', (event) => {
            if (this.activeClass === 'inventory') this.menu.inventory.clickAction(event);
        });

        if (misc) this.miscButton = button;
    }

    public removeMisc(): void {
        this.miscButton?.remove();
        this.miscButton = null;
    }

    private reset(): void {
        let buttons = this.getButtons();

        for (let i = 0; i < buttons.length; i++) $(buttons[i]).remove();
    }

    public show(): void {
        this.body.fadeIn('fast');
    }

    public hide(): void {
        this.body.fadeOut('slow');
    }

    public clear(): void {
        $('#drop-accept').off('click');
        $('#drop-cancel').off('click');

        this.trade?.off('click');
        this.follow?.off('click');
    }

    public displayDrop(activeClass: string): void {
        this.activeClass = activeClass;

        this.drop.fadeIn('fast');

        this.dropInput.focus();
        this.dropInput.select();
    }

    public hideDrop(): void {
        this.drop.fadeOut('slow');

        this.dropInput.blur();
        this.dropInput.val('');
    }

    private getAttackButton(): JQuery {
        return $('<div id="attack" class="action-button">Attack</div>');
    }

    private getFollowButton(): JQuery {
        return $('<div id="follow" class="action-button">Follow</div>');
    }

    // getTradeButton(): JQuery {
    //     return $('<div id="trade" class="action-button">Trade</div>');
    // }

    private getTalkButton(): JQuery {
        return $('<div id="talkButton" class="action-button">Talk</div>');
    }

    private getButtons(): JQuery {
        return this.body.find('ul').find('li');
    }

    // getGame(): Game {
    //     return this.menu.game;
    // }

    // getPlayer(): Player {
    //     return this.menu.game.player;
    // }

    public isVisible(): boolean {
        return this.body.css('display') === 'block';
    }
}
