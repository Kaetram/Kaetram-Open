import $ from 'jquery';

import log from '../lib/log';
import Actions from '../menu/actions';
import Bank from '../menu/bank';
import Enchant from '../menu/enchant';
import Header from '../menu/header';
import Inventory from '../menu/inventory';
import Profile from '../menu/profile/profile';
import Shop from '../menu/shop';
import Warp from '../menu/warp';

import type Game from '../game';
import type Slot from '../menu/container/slot';
import type Professions from '../menu/profile/pages/professions';
import type Quest from '../menu/profile/pages/quest';

export default class MenuController {
    private notify = $('#notify');
    private confirm = $('#confirm');
    private message = $('#message');
    private fade = $('#notifyFade');
    private done = $('#notifyDone');

    private notification = $('#notification');
    /** Notification title */
    private title = $('#notificationTextTitle');
    /** Notification description */
    private description = $('#notificationTextDescription');

    private notificationTimeout!: number | null;

    public inventory!: Inventory;
    public profile!: Profile;
    public bank!: Bank;
    public actions!: Actions;
    public enchant!: Enchant;
    public shop!: Shop;
    private header!: Header;
    public warp!: Warp;

    public constructor(public game: Game) {
        this.loadNotifications();
        this.loadActions();
        this.loadWarp();
        this.loadShop();

        this.done.on('click', () => this.hideNotify());
    }

    public resize(): void {
        let { inventory, profile, bank, enchant, shop, header } = this;

        inventory?.resize();

        profile?.resize();

        bank?.resize();

        enchant?.resize();

        if (shop?.isVisible()) shop.resize();

        header?.resize();

        this.resizeNotification();
    }

    /**
     * This can be called multiple times and can be used
     * to completely refresh the inventory.
     */
    public loadInventory(size: number, data: Slot[]): void {
        this.inventory = new Inventory(this.game, size, data);
    }

    /**
     * Similar structure as the inventory, just that it
     * has two containers. The bank and the inventory.
     */
    public loadBank(size: number, data: Slot[]): void {
        let { inventory, game } = this;

        if (!inventory) {
            log.error('Inventory not initialized.');

            return;
        }

        this.bank = new Bank(game, inventory.container, size, data);

        this.loadEnchant();
    }

    public loadProfile(): void {
        this.profile ||= new Profile(this.game);
    }

    private loadActions(): void {
        this.actions ||= new Actions(this);
    }

    private loadEnchant(): void {
        this.enchant ||= new Enchant(this.game, this);
    }

    private loadWarp(): void {
        this.warp ||= new Warp(this.game);
    }

    private loadShop(): void {
        this.shop ||= new Shop(this.game, this);
    }

    public loadHeader(): void {
        this.header ||= new Header(this.game);
    }

    private loadNotifications(): void {
        let ok = $('#ok'),
            cancel = $('#cancel'),
            done = $('#done');

        /**
         * Simple warning dialogue
         */

        ok.on('click', () => this.hideNotify());

        /**
         * Callbacks responsible for
         * Confirmation dialogues
         */

        cancel.on('click', () => this.hideConfirm());

        done.on('click', () => {
            log.info(this.confirm[0].className);

            this.hideConfirm();
        });
    }

    public stop(): void {
        let { inventory, actions, profile, game, bank, enchant, warp, shop } = this;

        inventory?.clear();

        actions?.clear();

        profile?.clean();

        game.input.chatHandler.clear();

        bank?.clear();

        enchant?.clear();

        warp?.clear();

        shop?.clear();
    }

    public hideAll(): void {
        let { inventory, actions, profile, game, bank, enchant, warp, shop } = this;

        if (inventory?.isVisible()) inventory.hide();

        if (actions?.isVisible()) actions.hide();

        if (profile?.isVisible() || profile.settings.isVisible()) profile.hide();

        if (game.input.chatHandler.input.is(':visible')) game.input.chatHandler.hideInput();

        if (bank?.isVisible()) bank.hide();

        if (enchant?.isVisible()) enchant.hide();

        if (warp?.isVisible()) warp.hide();

        if (shop?.isVisible()) shop.hide();
    }

    public addInventory(info: Slot): void {
        this.bank.addInventory(info);
    }

    public removeInventory(info: Slot): void {
        this.bank.removeInventory(info);
    }

    private resizeNotification(): void {
        let { notification } = this;

        if (this.isNotificationVisible())
            notification.css('top', `${window.innerHeight - notification.height()!}px`);
    }

    public showNotification(titleText: string, message: string, colour: string): void {
        let { notification, description, title, notificationTimeout } = this,
            top = window.innerHeight - notification.height()!;

        if (this.isNotificationVisible()) {
            this.hideNotification();

            window.setTimeout(() => this.showNotification(titleText, message, colour), 700);

            return;
        }

        title.css('color', colour);

        title.text(titleText);
        description.text(message);

        notification.addClass('active');
        notification.css('top', `${top}px`);

        if (notificationTimeout) return;

        this.notificationTimeout = window.setTimeout(() => this.hideNotification(), 4000);
    }

    private hideNotification(): void {
        if (!this.isNotificationVisible()) return;

        let { notificationTimeout, notification } = this;

        clearTimeout(notificationTimeout!);
        this.notificationTimeout = null;

        notification.removeClass('active');
        notification.css('top', '100%');
    }

    public displayNotify(text: string): void {
        if (this.isNotifyVisible()) return;

        let { notify, fade, message } = this;

        notify.show();
        fade.show();
        message.show();

        message.text(text);
    }

    public displayConfirm(message: string): void {
        if (this.isConfirmVisible()) return;

        this.confirm.show();
        this.confirm.text(message);
    }

    private hideNotify(): void {
        this.fade.hide();
        this.notify.hide();
        this.message.hide();
    }

    private hideConfirm(): void {
        this.confirm.hide();
    }

    public getQuestPage(): Quest {
        return this.profile.quests;
    }

    public getProfessionPage(): Professions {
        return this.profile.professions;
    }

    private isNotifyVisible(): boolean {
        return this.notify.css('display') === 'block';
    }

    private isConfirmVisible(): boolean {
        return this.confirm.css('display') === 'block';
    }

    private isNotificationVisible(): boolean {
        return this.notification.hasClass('active');
    }
}
