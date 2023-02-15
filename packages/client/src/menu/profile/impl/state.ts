import Util from '../../../utils/util';
import Menu from '../../menu';

import { Modules } from '@kaetram/common/network';

import type Player from '../../../entity/character/player/player';

type SelectCallback = (type: Modules.Equipment) => void;

export default class State extends Menu {
    // General player information.
    private name: HTMLElement = document.querySelector('#profile-name')!;
    private level: HTMLElement = document.querySelector('#profile-level')!;
    private experience: HTMLElement = document.querySelector('#profile-experience')!;

    // Equipment information
    private weapon: HTMLElement = document.querySelector('#state-page > .weapon-slot')!;
    private armour: HTMLElement = document.querySelector('#state-page > .armour-slot')!;
    private pendant: HTMLElement = document.querySelector('#state-page > .pendant-slot')!;
    private ring: HTMLElement = document.querySelector('#state-page > .ring-slot')!;
    private boots: HTMLElement = document.querySelector('#state-page > .boots-slot')!;
    private arrow: HTMLElement = document.querySelector('#state-page > .arrows-slot')!;

    private selectCallback?: SelectCallback;

    public constructor(private player: Player) {
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
        this.arrow.addEventListener('click', () => this.selectCallback?.(Modules.Equipment.Arrows));
    }

    /**
     * Synchronizes the player data into its respective slots. Takes
     * the player's name, level, experience, and equipment and updates
     * the user interface accordingly.
     */

    public override synchronize(): void {
        // Synchronize the player's general information
        this.name.textContent = this.player.name;
        this.level.textContent = `Level ${this.player.level}`;
        this.experience.textContent = `${this.player.getTotalExperience()}`;

        // Synchronize equipment data
        this.weapon.style.backgroundImage = Util.getImageURL(this.player.getWeapon().key);
        // Cloth armour shouldn't be displayed in the UI.
        this.armour.style.backgroundImage = Util.getImageURL(
            this.player.getArmour().key === 'clotharmor' ? '' : this.player.getArmour().key
        );
        this.pendant.style.backgroundImage = Util.getImageURL(this.player.getPendant().key);
        this.ring.style.backgroundImage = Util.getImageURL(this.player.getRing().key);
        this.boots.style.backgroundImage = Util.getImageURL(this.player.getBoots().key);
        this.arrow.style.backgroundImage = Util.getImageURL(this.player.getArrows().key);
    }

    /**
     * Callback for when we click on an equipment slot.
     * @param callback Contains the slot type we are selecting.
     */

    public onSelect(callback: SelectCallback): void {
        this.selectCallback = callback;
    }
}
