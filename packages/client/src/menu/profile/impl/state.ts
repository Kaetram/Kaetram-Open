import Menu from '../../menu';
import Player from '../../../entity/character/player/player';

import Util from '../../../utils/util';
import { Modules } from '@kaetram/common/network';

type SelectCallback = (type: Modules.Equipment) => void;

export default class State extends Menu {
    // General player information.
    private name: HTMLElement = document.querySelector('#profile-name')!;
    private level: HTMLElement = document.querySelector('#profile-level')!;
    private experience: HTMLElement = document.querySelector('#profile-experience')!;

    // Equipment information
    private weapon: HTMLElement = document.querySelector('#weapon-slot')!;
    private weaponInfo: HTMLElement = document.querySelector('#weapon-slot-info')!;
    private armour: HTMLElement = document.querySelector('#armour-slot')!;
    private armourInfo: HTMLElement = document.querySelector('#armour-slot-info')!;

    private pendant: HTMLElement = document.querySelector('#pendant-slot')!;
    private ring: HTMLElement = document.querySelector('#ring-slot')!;
    private boots: HTMLElement = document.querySelector('#boots-slot')!;

    private selectCallback?: SelectCallback;

    public constructor() {
        super('#state-page');

        this.weapon.addEventListener('click', () =>
            this.selectCallback?.(Modules.Equipment.Weapon)
        );
        this.armour.addEventListener('click', () =>
            this.selectCallback?.(Modules.Equipment.Armour)
        );
        this.pendant.addEventListener('click', () =>
            this.selectCallback?.(Modules.Equipment.Pendant)
        );
        this.ring.addEventListener('click', () => this.selectCallback?.(Modules.Equipment.Ring));
        this.boots.addEventListener('click', () => this.selectCallback?.(Modules.Equipment.Boots));
    }

    /**
     * Synchronizes the player data into its respective slots. Takes
     * the player's name, level, experience, and equipment and updates
     * the user interface accordingly.
     * @param player Player object we are synching to.
     */

    public override synchronize(player: Player): void {
        // Synchronize the player's general information
        this.name.textContent = player.name;
        this.level.textContent = `Level ${player.level}`;
        this.experience.textContent = `${player.experience}`;

        // Synchronize equipment data
        this.weapon.style.backgroundImage = Util.getImageURL(player.getWeapon().key);
        this.armour.style.backgroundImage = Util.getImageURL(player.getArmour().key);
        this.pendant.style.backgroundImage = Util.getImageURL(player.getPendant().key);
        this.ring.style.backgroundImage = Util.getImageURL(player.getRing().key);
        this.boots.style.backgroundImage = Util.getImageURL(player.getBoots().key);
    }

    /**
     * Callback for when we click on an equipment slot.
     * @param callback Contains the slot type we are selecting.
     */

    public onSelect(callback: SelectCallback): void {
        this.selectCallback = callback;
    }
}
