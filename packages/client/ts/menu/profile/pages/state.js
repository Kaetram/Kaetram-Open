import Page from '../page';
import $ from 'jquery';
import _ from 'underscore';
import Packets from '../../../network/packets';

export default class State extends Page {
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
        var self = this;

        if (!self.game.player.armour) return;

        self.name.text(self.player.username);
        self.level.text(self.player.level);
        self.experience.text(self.player.experience);

        self.loadSlots();

        self.loaded = true;

        self.weaponSlot.click(function () {
            self.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'weapon']);
        });

        self.armourSlot.click(function () {
            self.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'armour']);
        });

        self.pendantSlot.click(function () {
            self.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'pendant']);
        });

        self.ringSlot.click(function () {
            self.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'ring']);
        });

        self.bootsSlot.click(function () {
            self.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'boots']);
        });
    }

    loadSlots() {
        var self = this;

        self.weaponSlot.css('background-image', self.getImageFormat(self.player.weapon.string));
        self.armourSlot.css('background-image', self.getImageFormat(self.player.armour.string));
        self.pendantSlot.css('background-image', self.getImageFormat(self.player.pendant.string));
        self.ringSlot.css('background-image', self.getImageFormat(self.player.ring.string));
        self.bootsSlot.css('background-image', self.getImageFormat(self.player.boots.string));

        self.forEachSlot(function (slot) {
            slot.css('background-size', '600%');
        });
    }

    update() {
        var self = this,
            weaponPower = self.player.weapon.power,
            armourPower = self.player.armour.power;

        self.level.text(self.player.level);
        self.experience.text(self.player.experience);

        self.weaponSlotInfo.text(weaponPower ? '+' + weaponPower : '');
        self.armourSlotInfo.text(armourPower ? '+' + armourPower : '');

        self.loadSlots();
    }

    forEachSlot(callback) {
        _.each(this.slots, function (slot) {
            callback(slot);
        });
    }

    getScale() {
        return this.game.renderer.getScale();
    }
}
