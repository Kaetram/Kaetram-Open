/* global log, _ */

import $ from 'jquery';
import Page from '../page';
import Packets from '../../../network/packets';

export default class State extends Page {
    clear() {
        throw new Error('Method not implemented.');
    }

    game: any;
    player: any;
    name: JQuery<HTMLElement>;
    level: JQuery<HTMLElement>;
    experience: JQuery<HTMLElement>;
    weaponSlot: JQuery<HTMLElement>;
    armourSlot: JQuery<HTMLElement>;
    pendantSlot: JQuery<HTMLElement>;
    ringSlot: JQuery<HTMLElement>;
    bootsSlot: JQuery<HTMLElement>;
    weaponSlotInfo: JQuery<HTMLElement>;
    armourSlotInfo: JQuery<HTMLElement>;
    slots: any[];
    constructor(game) {
        super('#statePage');

        this.game = game;
        this.player = game.player;

        this.name = $('#profileName');
        this.level = $('#profileLevel');
        this.experience = $('#profileExperience');

        this.weaponSlot = $('#weaponSlot');
        this.armourSlot = $('#armourSlot');
        this.pendantSlot = $('#pendantSlot');
        this.ringSlot = $('#ringSlot');
        this.bootsSlot = $('#bootsSlot');

        this.weaponSlotInfo = $('#weaponSlotInfo');
        this.armourSlotInfo = $('#armourSlotInfo');

        this.slots = [
            this.weaponSlot,
            this.armourSlot,
            this.pendantSlot,
            this.ringSlot,
            this.bootsSlot
        ];

        this.loaded = false;

        this.load();
    }

    resize() {
        this.loadSlots();
    }

    load() {
        if (!this.game.player.armour) return;

        this.name.text(this.player.username);
        this.level.text(this.player.level);
        this.experience.text(this.player.experience);

        this.loadSlots();

        this.loaded = true;

        this.weaponSlot.click(() => {
            this.game.socket.send(Packets.Equipment, [
                Packets.EquipmentOpcode.Unequip,
                'weapon'
            ]);
        });

        this.armourSlot.click(() => {
            this.game.socket.send(Packets.Equipment, [
                Packets.EquipmentOpcode.Unequip,
                'armour'
            ]);
        });

        this.pendantSlot.click(() => {
            this.game.socket.send(Packets.Equipment, [
                Packets.EquipmentOpcode.Unequip,
                'pendant'
            ]);
        });

        this.ringSlot.click(() => {
            this.game.socket.send(Packets.Equipment, [
                Packets.EquipmentOpcode.Unequip,
                'ring'
            ]);
        });

        this.bootsSlot.click(() => {
            this.game.socket.send(Packets.Equipment, [
                Packets.EquipmentOpcode.Unequip,
                'boots'
            ]);
        });
    }

    loadSlots() {
        this.weaponSlot.css(
            'background-image',
            this.getImageFormat(this.getScale(), this.player.weapon.string)
        );
        this.armourSlot.css(
            'background-image',
            this.getImageFormat(this.getScale(), this.player.armour.string)
        );
        this.pendantSlot.css(
            'background-image',
            this.getImageFormat(this.getScale(), this.player.pendant.string)
        );
        this.ringSlot.css(
            'background-image',
            this.getImageFormat(this.getScale(), this.player.ring.string)
        );
        this.bootsSlot.css(
            'background-image',
            this.getImageFormat(this.getScale(), this.player.boots.string)
        );

        this.forEachSlot(function(slot) {
            slot.css('background-size', '600%');
        });
    }

    update() {
        this.level.text(this.player.level);
        this.experience.text(this.player.experience);

        if (this.player.weapon.power)
            this.weaponSlotInfo.text('+' + this.player.weapon.power);

        if (this.player.armour.power)
            this.armourSlotInfo.text('+' + this.player.armour.power);

        this.loadSlots();
    }

    forEachSlot(callback) {
        _.each(this.slots, function(slot) {
            callback(slot);
        });
    }

    getScale() {
        return this.game.renderer.getScale();
    }
};
