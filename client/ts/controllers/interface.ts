import $ from 'jquery';
import Inventory from '../interface/inventory';
import Profile from '../interface/profile/profile';
import Actions from '../interface/actions';
import Bank from '../interface/bank';
import Enchant from '../interface/enchant';
import Warp from '../interface/warp';
import Shop from '../interface/shop';
import Header from '../interface/header';
import Game from '../game';

export default class Interface {
    notify: JQuery<HTMLElement>;
    confirm: JQuery<HTMLElement>;
    message: JQuery<HTMLElement>;
    fade: JQuery<HTMLElement>;
    done: JQuery<HTMLElement>;
    inventory: Inventory;
    profile: Profile;
    actions: Actions;
    enchant: Enchant;
    shop: Shop;
    header: Header;
    bank: Bank;
    warp: Warp;

    constructor(public game: Game) {
        this.game = game;

        this.notify = $('#notify');
        this.confirm = $('#confirm');
        this.message = $('#message');
        this.fade = $('#notifyFade');
        this.done = $('#notifyDone');

        this.inventory = null;
        this.profile = null;
        this.actions = null;
        this.bank = null;
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

    resize() {
        if (this.inventory) this.inventory.resize();

        if (this.profile) this.profile.resize();

        if (this.bank) this.bank.resize();

        if (this.enchant) this.enchant.resize();

        if (this.shop && this.shop.isVisible()) this.shop.resize();

        if (this.header) this.header.resize();
    }

    loadInventory(size, data) {
        /**
         * This can be called multiple times and can be used
         * to completely refresh the inventory.
         */

        this.inventory = new Inventory(this.game, size);

        this.inventory.load(data);
    }

    loadBank(size, data) {
        /**
         * Similar structure as the inventory, just that it
         * has two containers. The bank and the inventory.
         */

        if (!this.inventory) {
            console.error('Inventory not initialized.');
            return;
        }

        this.bank = new Bank(this.game, this.inventory.container, size);

        this.bank.load(data);

        this.loadEnchant();
    }

    loadProfile() {
        if (!this.profile) this.profile = new Profile(this.game);
    }

    loadActions() {
        if (!this.actions) this.actions = new Actions(this);
    }

    loadEnchant() {
        if (!this.enchant) this.enchant = new Enchant(this.game, this);
    }

    loadWarp() {
        if (!this.warp) this.warp = new Warp(this.game, this);
    }

    loadShop() {
        if (!this.shop) this.shop = new Shop(this.game, this);
    }

    loadHeader() {
        if (!this.header) this.header = new Header(this.game, this);
    }

    loadNotifications() {
        const ok = $('#ok');
        const cancel = $('#cancel');
        const done = $('#done');

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
            console.info(this.confirm);

            this.hideConfirm();
        });
    }

    stop() {
        if (this.inventory) this.inventory.clear();

        if (this.actions) this.actions.clear();

        if (this.profile) this.profile.clean();

        if (this.game.input) this.game.input.chatHandler.clear();

        if (this.bank) this.bank.clear();

        if (this.enchant) this.enchant.clear();

        if (this.warp) this.warp.clear();

        if (this.shop) this.shop.clear();
    }

    hideAll() {
        if (this.inventory && this.inventory.isVisible()) this.inventory.hide();

        if (this.actions && this.actions.isVisible()) this.actions.hide();

        if (
            this.profile &&
            (this.profile.isVisible() || this.profile.settings.isVisible())
        ) {
            this.profile.hide();
        }

        if (
            this.game.input &&
            this.game.input.chatHandler &&
            this.game.input.chatHandler.input.is(':visible')
        ) {
            this.game.input.chatHandler.hideInput();
        }

        if (this.bank && this.bank.isVisible()) this.bank.hide();

        if (this.enchant && this.enchant.isVisible()) this.enchant.hide();

        if (this.warp && this.warp.isVisible()) this.warp.hide();

        if (this.shop && this.shop.isVisible()) this.shop.hide();
    }

    addInventory(info) {
        this.bank.addInventory(info);
    }

    removeInventory(info) {
        this.bank.removeInventory(info);
    }

    displayNotify(message) {
        if (this.isNotifyVisible()) return;

        this.notify.css('display', 'block');
        this.fade.css('display', 'block');
        this.message.css('display', 'block');

        this.message.text(message);
    }

    displayConfirm(message) {
        if (this.isConfirmVisible()) return;

        this.confirm.css('display', 'block');
        this.confirm.text(message);
    }

    hideNotify() {
        this.fade.css('display', 'none');
        this.notify.css('display', 'none');
        this.message.css('display', 'none');
    }

    hideConfirm() {
        this.confirm.css('display', 'none');
    }

    getQuestPage() {
        return this.profile.quests;
    }

    isNotifyVisible() {
        return this.notify.css('display') === 'block';
    }

    isConfirmVisible() {
        return this.confirm.css('display') === 'block';
    }
}
