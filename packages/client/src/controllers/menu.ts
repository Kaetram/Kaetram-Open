import $ from 'jquery';

import Equipment from '../entity/character/player/equipment/equipment';
import Game from '../game';
import log from '../lib/log';
import Actions from '../menu/actions';
import Bank from '../menu/bank';
import Slot from '../menu/container/slot';
import Enchant from '../menu/enchant';
import Header from '../menu/header';
import Inventory from '../menu/inventory';
import Professions from '../menu/profile/pages/professions';
import Quest from '../menu/profile/pages/quest';
import Profile from '../menu/profile/profile';
import Shop from '../menu/shop';
import Warp from '../menu/warp';

export default class MenuController {
    game: Game;
    notify: JQuery<HTMLDivElement>;
    confirm: JQuery<HTMLDivElement>;
    message: JQuery<HTMLDivElement>;
    fade: JQuery<HTMLDivElement>;
    done: JQuery<HTMLDivElement>;
    notification: JQuery<HTMLDivElement>;
    title: JQuery<HTMLDivElement>;
    description: JQuery<HTMLDivElement>;
    notificationTimeout: number;
    inventory: Inventory;
    profile: Profile;
    bank: Bank;
    actions: Actions;
    enchant: Enchant;
    shop: Shop;
    header: Header;
    warp: Warp;

    constructor(game: Game) {
        this.game = game;

        this.notify = $('#notify');
        this.confirm = $('#confirm');
        this.message = $('#message');
        this.fade = $('#notifyFade');
        this.done = $('#notifyDone');

        this.notification = $('#notification');
        this.title = $('#notificationTextTitle'); // notification title
        this.description = $('#notificationTextDescription'); // notification description
        this.notificationTimeout = null;

        this.inventory = null;
        this.profile = null;
        this.bank = null;
        this.actions = null;
        this.enchant = null;
        this.shop = null;
        this.header = null;

        this.loadNotifications();
        this.loadActions();
        this.loadWarp();
        this.loadShop();

        this.done.click(() => {
            this.hideNotify();
        });
    }

    resize(): void {
        if (this.inventory) this.inventory.resize();

        if (this.profile) this.profile.resize();

        if (this.bank) this.bank.resize();

        if (this.enchant) this.enchant.resize();

        if (this.shop && this.shop.isVisible()) this.shop.resize();

        if (this.header) this.header.resize();

        this.resizeNotification();
    }

    loadInventory(size: number, data: Equipment[]): void {
        /**
         * This can be called multiple times and can be used
         * to completely refresh the inventory.
         */

        this.inventory = new Inventory(this.game, size);

        this.inventory.load(data);
    }

    loadBank(size: number, data: Slot[]): void {
        /**
         * Similar structure as the inventory, just that it
         * has two containers. The bank and the inventory.
         */

        if (!this.inventory) {
            log.error('Inventory not initialized.');
            return;
        }

        this.bank = new Bank(this.game, this.inventory.container, size);

        this.bank.load(data);

        this.loadEnchant();
    }

    loadProfile(): void {
        this.profile ||= new Profile(this.game);
    }

    loadActions(): void {
        this.actions ||= new Actions(this);
    }

    loadEnchant(): void {
        this.enchant ||= new Enchant(this.game, this);
    }

    loadWarp(): void {
        this.warp ||= new Warp(this.game);
    }

    loadShop(): void {
        this.shop ||= new Shop(this.game, this);
    }

    loadHeader(): void {
        this.header ||= new Header(this.game /* , this */);
    }

    loadNotifications(): void {
        const ok = $('#ok'),
            cancel = $('#cancel'),
            done = $('#done');

        /**
         * Simple warning dialogue
         */

        ok.click(() => {
            this.hideNotify();
        });

        /**
         * Callbacks responsible for
         * Confirmation dialogues
         */

        cancel.click(() => {
            this.hideConfirm();
        });

        done.click(() => {
            log.info(this.confirm[0].className);

            this.hideConfirm();
        });
    }

    stop(): void {
        if (this.inventory) this.inventory.clear();

        if (this.actions) this.actions.clear();

        if (this.profile) this.profile.clean();

        if (this.game.input) this.game.input.chatHandler.clear();

        if (this.bank) this.bank.clear();

        if (this.enchant) this.enchant.clear();

        if (this.warp) this.warp.clear();

        if (this.shop) this.shop.clear();
    }

    hideAll(): void {
        if (this.inventory && this.inventory.isVisible()) this.inventory.hide();

        if (this.actions && this.actions.isVisible()) this.actions.hide();

        if (this.profile && (this.profile.isVisible() || this.profile.settings.isVisible()))
            this.profile.hide();

        if (
            this.game.input &&
            this.game.input.chatHandler &&
            this.game.input.chatHandler.input.is(':visible')
        )
            this.game.input.chatHandler.hideInput();

        if (this.bank && this.bank.isVisible()) this.bank.hide();

        if (this.enchant && this.enchant.isVisible()) this.enchant.hide();

        if (this.warp && this.warp.isVisible()) this.warp.hide();

        if (this.shop && this.shop.isVisible()) this.shop.hide();
    }

    addInventory(info: Slot): void {
        this.bank.addInventory(info);
    }

    removeInventory(info: Slot): void {
        this.bank.removeInventory(info);
    }

    resizeNotification(): void {
        if (this.isNotificationVisible())
            this.notification.css('top', `${window.innerHeight - this.notification.height()}px`);
    }

    showNotification(title: string, message: string, colour: string): void {
        const top = window.innerHeight - this.notification.height();

        if (this.isNotificationVisible()) {
            this.hideNotification();

            window.setTimeout(() => {
                this.showNotification(title, message, colour);
            }, 700);

            return;
        }

        this.title.css('color', colour);

        this.title.text(title);
        this.description.text(message);

        this.notification.addClass('active');
        this.notification.css('top', `${top}px`);

        if (this.notificationTimeout) return;

        this.notificationTimeout = window.setTimeout(() => {
            this.hideNotification();
        }, 4000);
    }

    hideNotification(): void {
        if (!this.isNotificationVisible()) return;

        clearTimeout(this.notificationTimeout);
        this.notificationTimeout = null;

        this.notification.removeClass('active');
        this.notification.css('top', '100%');
    }

    displayNotify(message: string): void {
        if (this.isNotifyVisible()) return;

        this.notify.css('display', 'block');
        this.fade.css('display', 'block');
        this.message.css('display', 'block');

        this.message.text(message);
    }

    displayConfirm(message: string): void {
        if (this.isConfirmVisible()) return;

        this.confirm.css('display', 'block');
        this.confirm.text(message);
    }

    hideNotify(): void {
        this.fade.css('display', 'none');
        this.notify.css('display', 'none');
        this.message.css('display', 'none');
    }

    hideConfirm(): void {
        this.confirm.css('display', 'none');
    }

    getQuestPage(): Quest {
        return this.profile.quests;
    }

    getProfessionPage(): Professions {
        return this.profile.professions;
    }

    isNotifyVisible(): boolean {
        return this.notify.css('display') === 'block';
    }

    isConfirmVisible(): boolean {
        return this.confirm.css('display') === 'block';
    }

    isNotificationVisible(): boolean {
        return this.notification.hasClass('active');
    }
}
