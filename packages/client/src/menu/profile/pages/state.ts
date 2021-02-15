import $ from 'jquery';
import _ from 'lodash';

import Player from '../../../entity/character/player/player';
import Game from '../../../game';
import Packets from '@kaetram/common/src/packets';
import Page from '../page';

export default class State extends Page {
    game: Game;
    player: Player;
    name: JQuery;
    level: JQuery;
    experience: JQuery;
    weaponSlot: JQuery;
    armourSlot: JQuery;
    pendantSlot: JQuery;
    ringSlot: JQuery;
    bootsSlot: JQuery;
    weaponSlotInfo: JQuery;
    armourSlotInfo: JQuery;
    slots: JQuery[];

    constructor(game: Game) {
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

    resize(): void {
        this.loadSlots();
    }

    load(): void {
        if (!this.game.player.armour) return;

        this.name.text(this.player.username);
        this.level.text(this.player.level);
        this.experience.text(this.player.experience);

        this.loadSlots();

        this.loaded = true;

        this.weaponSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'weapon'])
        );

        this.armourSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'armour'])
        );

        this.pendantSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'pendant'])
        );

        this.ringSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'ring'])
        );

        this.bootsSlot.on('click', () =>
            this.game.socket.send(Packets.Equipment, [Packets.EquipmentOpcode.Unequip, 'boots'])
        );
    }

    async loadSlots(): Promise<void> {
        this.weaponSlot.css(
            'background-image',
            await this.getImageFormat(this.player.weapon.string)
        );
        this.armourSlot.css(
            'background-image',
            await this.getImageFormat(this.player.armour.string)
        );
        this.pendantSlot.css(
            'background-image',
            await this.getImageFormat(this.player.pendant.string)
        );
        this.ringSlot.css('background-image', await this.getImageFormat(this.player.ring.string));
        this.bootsSlot.css('background-image', await this.getImageFormat(this.player.boots.string));

        this.forEachSlot((slot) => slot.css('background-size', '600%'));
    }

    update(): void {
        const weaponPower = this.player.weapon.power,
            armourPower = this.player.armour.power;

        this.level.text(this.player.level);
        this.experience.text(this.player.experience);

        this.weaponSlotInfo.text(weaponPower ? `+${weaponPower}` : '');
        this.armourSlotInfo.text(armourPower ? `+${armourPower}` : '');

        this.loadSlots();
    }

    forEachSlot(callback: (slot: JQuery) => void): void {
        _.each(this.slots, (slot) => callback(slot));
    }

    getScale(): number {
        return this.game.renderer.getScale();
    }
}
