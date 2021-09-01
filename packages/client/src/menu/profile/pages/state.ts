import $ from 'jquery';
import _ from 'lodash';

import { Opcodes, Packets } from '@kaetram/common/network';

import Page from '../page';

import type Game from '../../../game';

export default class State extends Page {
    private player;

    private name = $('#profileName');
    private level = $('#profileLevel');
    private experience = $('#profileExperience');

    private weaponSlot = $('#weaponSlot');
    private armourSlot = $('#armourSlot');
    private pendantSlot = $('#pendantSlot');
    private ringSlot = $('#ringSlot');
    private bootsSlot = $('#bootsSlot');

    private weaponSlotInfo = $('#weaponSlotInfo');
    private armourSlotInfo = $('#armourSlotInfo');

    private slots = [
        this.weaponSlot,
        this.armourSlot,
        this.pendantSlot,
        this.ringSlot,
        this.bootsSlot
    ];

    // public loaded = false;

    public constructor(private game: Game) {
        super('#statePage');

        this.player = game.player;

        this.load();
    }

    public override resize(): void {
        this.loadSlots();
    }

    public override load(): void {
        if (!this.game.player.armour) return;

        this.name.text(this.player.username);
        this.level.text(this.player.level);
        this.experience.text(this.player.experience);

        this.loadSlots();

        this.loaded = true;

        this.weaponSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [Opcodes.Equipment.Unequip, 'weapon'])
        );

        this.armourSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [Opcodes.Equipment.Unequip, 'armour'])
        );

        this.pendantSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [Opcodes.Equipment.Unequip, 'pendant'])
        );

        this.ringSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [Opcodes.Equipment.Unequip, 'ring'])
        );

        this.bootsSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [Opcodes.Equipment.Unequip, 'boots'])
        );
    }

    private loadSlots(): void {
        this.weaponSlot.css('background-image', this.getImageFormat(this.player.weapon.string));
        this.armourSlot.css('background-image', this.getImageFormat(this.player.armour.string));
        this.pendantSlot.css('background-image', this.getImageFormat(this.player.pendant.string));
        this.ringSlot.css('background-image', this.getImageFormat(this.player.ring.string));
        this.bootsSlot.css('background-image', this.getImageFormat(this.player.boots.string));

        this.forEachSlot((slot) => slot.css('background-size', '600%'));
    }

    public update(): void {
        let weaponPower = this.player.weapon.power,
            armourPower = this.player.armour.power;

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
