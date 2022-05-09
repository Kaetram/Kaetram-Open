import $ from 'jquery';
import _ from 'lodash';

import { Modules, Opcodes, Packets } from '@kaetram/common/network';

import Page from '../page';

import type Game from '../../../game';

import Utils from '../../../utils/util';

export default class State extends Page {
    private player;

    private name = $('#profile-name');
    private level = $('#profile-level');
    private experience = $('#profile-experience');

    private weaponSlot = $('#weapon-slot');
    private armourSlot = $('#armour-slot');
    private pendantSlot = $('#pendant-slot');
    private ringSlot = $('#ring-slot');
    private bootsSlot = $('#boots-slot');

    private weaponSlotInfo = $('#weapon-slot-info');
    private armourSlotInfo = $('#armour-slot-info');

    private slots = [
        this.weaponSlot,
        this.armourSlot,
        this.pendantSlot,
        this.ringSlot,
        this.bootsSlot
    ];

    // public loaded = false;

    public constructor(private game: Game) {
        super('#state-page');

        this.player = game.player;

        this.load();
    }

    public override resize(): void {
        this.loadSlots();
    }

    public override load(): void {
        this.name.text(this.player.name);
        this.level.text(this.player.level);
        this.experience.text(this.player.experience);

        this.loadSlots();

        this.loaded = true;

        this.weaponSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [
                Opcodes.Equipment.Unequip,
                Modules.Equipment.Weapon
            ])
        );

        this.armourSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [
                Opcodes.Equipment.Unequip,
                Modules.Equipment.Armour
            ])
        );

        this.pendantSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [
                Opcodes.Equipment.Unequip,
                Modules.Equipment.Pendant
            ])
        );

        this.ringSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [
                Opcodes.Equipment.Unequip,
                Modules.Equipment.Ring
            ])
        );

        this.bootsSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [
                Opcodes.Equipment.Unequip,
                Modules.Equipment.Boots
            ])
        );
    }

    private loadSlots(): void {
        this.armourSlot.css('background-image', Utils.getImageURL(this.player.getArmour().key));
        this.bootsSlot.css('background-image', Utils.getImageURL(this.player.getBoots().key));
        this.pendantSlot.css('background-image', Utils.getImageURL(this.player.getPendant().key));
        this.ringSlot.css('background-image', Utils.getImageURL(this.player.getRing().key));
        this.weaponSlot.css('background-image', Utils.getImageURL(this.player.getWeapon().key));

        this.forEachSlot((slot) => slot.css('background-size', '600%'));
    }

    public update(): void {
        let weaponPower = this.player.getWeapon().power,
            armourPower = this.player.getArmour().power;

        this.level.text(this.player.level);
        this.experience.text(this.player.experience);

        this.weaponSlotInfo.text(weaponPower ? `+${weaponPower}` : '');
        this.armourSlotInfo.text(armourPower ? `+${armourPower}` : '');

        this.loadSlots();
    }

    private forEachSlot(callback: (slot: JQuery) => void): void {
        _.each(this.slots, callback);
    }

    // getScale(): number {
    //     return this.game.renderer.getScale();
    // }
}
