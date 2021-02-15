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
    private notify = $('#notify');
    private confirm = $('#confirm');
    private message = $('#message');
    private fade = $('#notifyFade');
    private done = $('#notifyDone');

    private notification = $('#notification');
    private title = $('#notificationTextTitle'); // notification title
    private description = $('#notificationTextDescription'); // notification description

    private notificationTimeout!: number | null;

    public inventory!: Inventory | null;
    public profile!: Profile | null;
    public bank!: Bank | null;
    public actions!: Actions | null;
    public enchant!: Enchant | null;
    public shop!: Shop | null;
    private header!: Header | null;
    public warp!: Warp | null;

    public constructor(public game: Game) {
        this.loadNotifications();
        this.loadActions();
        this.loadWarp();
        this.loadShop();

        this.done.on('click', () => this.hideNotify());
    }

    public resize(): void {
        this.inventory?.resize();

        this.profile?.resize();

        this.bank?.resize();

        this.enchant?.resize();

        if (this.shop?.isVisible()) this.shop.resize();

        this.header?.resize();

        this.resizeNotification();
    }

    /**
     * This can be called multiple times and can be used
     * to completely refresh the inventory.
     */
    public loadInventory(size: number, data: Equipment[]): void {
        this.inventory = new Inventory(this.game, size);

        this.inventory.load(data);
    }

    /**
     * Similar structure as the inventory, just that it
     * has two containers. The bank and the inventory.
     */
    public loadBank(size: number, data: Slot[]): void {
        if (!this.inventory) {
            log.error('Inventory not initialized.');

            return;
        }

        this.bank = new Bank(this.game, this.inventory.container, size);

        this.bank.load(data);

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
        const ok = $('#ok'),
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
        this.inventory?.clear();

        this.actions?.clear();

        this.profile?.clean();

        this.game.input?.chatHandler.clear();

        this.bank?.clear();

        this.enchant?.clear();

        this.warp?.clear();

        this.shop?.clear();
    }

    public hideAll(): void {
        if (this.inventory?.isVisible()) this.inventory.hide();

        if (this.actions?.isVisible()) this.actions.hide();

        if (this.profile?.isVisible() || this.profile?.settings.isVisible()) this.profile.hide();

        if (this.game.input?.chatHandler?.input.is(':visible'))
            this.game.input.chatHandler.hideInput();

        if (this.bank?.isVisible()) this.bank.hide();

        if (this.enchant?.isVisible()) this.enchant.hide();

        if (this.warp?.isVisible()) this.warp.hide();

        if (this.shop?.isVisible()) this.shop.hide();
    }

    public addInventory(info: Slot): void {
        this.bank?.addInventory(info);
    }

    public removeInventory(info: Slot): void {
        this.bank?.removeInventory(info);
    }

    private resizeNotification(): void {
        if (this.isNotificationVisible())
            this.notification.css(
                'top',
                `${window.innerHeight - (this.notification.height() as number)}px`
            );
    }

    public showNotification(title: string, message: string, colour: string): void {
        const top = window.innerHeight - (this.notification.height() as number);

        if (this.isNotificationVisible()) {
            this.hideNotification();

            window.setTimeout(() => this.showNotification(title, message, colour), 700);

            return;
        }

        this.title.css('color', colour);

        this.title.text(title);
        this.description.text(message);

        this.notification.addClass('active');
        this.notification.css('top', `${top}px`);

        if (this.notificationTimeout) return;

        this.notificationTimeout = window.setTimeout(() => this.hideNotification(), 4000);
    }

    private hideNotification(): void {
        if (!this.isNotificationVisible()) return;

        clearTimeout(this.notificationTimeout as number);
        this.notificationTimeout = null;

        this.notification.removeClass('active');
        this.notification.css('top', '100%');
    }

    public displayNotify(message: string): void {
        if (this.isNotifyVisible()) return;

        this.notify.show();
        this.fade.show();
        this.message.show();

        this.message.text(message);
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

    public getQuestPage(): Quest | undefined {
        return this.profile?.quests;
    }

    public getProfessionPage(): Professions | undefined {
        return this.profile?.professions;
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
