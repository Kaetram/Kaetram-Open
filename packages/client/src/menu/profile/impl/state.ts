import Util from '../../../utils/util';
import Menu from '../../menu';

import { Modules } from '@kaetram/common/network';

import type Player from '../../../entity/character/player/player';

type UnequipCallback = (type: Modules.Equipment) => void;
type StyleCallback = (style: Modules.AttackStyle) => void;

export default class State extends Menu {
    // General player information.
    private level: HTMLElement = document.querySelector('#profile-level')!;
    private experience: HTMLElement = document.querySelector('#profile-experience')!;

    // Attack style element
    private attackStyleList: HTMLUListElement = document.querySelector('#attack-style-list')!;

    // Equipment information
    private weapon: HTMLElement = document.querySelector('#state-page > .weapon-slot')!;
    private weaponSkin: HTMLElement = document.querySelector('#state-page > .weapon-skin-slot')!;
    private armour: HTMLElement = document.querySelector('#state-page > .armour-slot')!;
    private armourSkin: HTMLElement = document.querySelector('#state-page > .armour-skin-slot')!;
    private pendant: HTMLElement = document.querySelector('#state-page > .pendant-slot')!;
    private ring: HTMLElement = document.querySelector('#state-page > .ring-slot')!;
    private boots: HTMLElement = document.querySelector('#state-page > .boots-slot')!;
    private arrow: HTMLElement = document.querySelector('#state-page > .arrows-slot')!;

    private unequipCallback?: UnequipCallback;
    private styleCallback?: StyleCallback;

    public constructor(private player: Player) {
        super('#state-page');

        this.weapon.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.Weapon)
        );
        this.weaponSkin.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.WeaponSkin)
        );
        this.armour.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.Armour)
        );
        this.armourSkin.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.ArmourSkin)
        );
        this.pendant.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.Pendant)
        );
        this.ring.addEventListener('click', () => this.unequipCallback?.(Modules.Equipment.Ring));
        this.boots.addEventListener('click', () => this.unequipCallback?.(Modules.Equipment.Boots));
        this.arrow.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.Arrows)
        );
    }

    /**
     * Synchronizes the player data into its respective slots. Takes
     * the player's name, level, experience, and equipment and updates
     * the user interface accordingly.
     */

    public override synchronize(): void {
        // Synchronize the player's general information
        this.level.textContent = `Level ${this.player.level}`;
        this.experience.textContent = `${this.player.getTotalExperience()}`;

        // Synchronize equipment data
        this.weapon.style.backgroundImage = Util.getImageURL(this.player.getWeapon().key);
        this.weaponSkin.style.backgroundImage = Util.getImageURL(this.player.getWeaponSkin().key);
        // Cloth armour shouldn't be displayed in the UI.
        this.armour.style.backgroundImage = Util.getImageURL(
            this.player.getArmour().key === 'clotharmor' ? '' : this.player.getArmour().key
        );
        this.armourSkin.style.backgroundImage = Util.getImageURL(this.player.getArmourSkin().key);
        this.pendant.style.backgroundImage = Util.getImageURL(this.player.getPendant().key);
        this.ring.style.backgroundImage = Util.getImageURL(this.player.getRing().key);
        this.boots.style.backgroundImage = Util.getImageURL(this.player.getBoots().key);
        this.arrow.style.backgroundImage = Util.getImageURL(this.player.getArrows().key);

        // Synchronize the attack styles
        this.loadAttackStyles();
    }

    /**
     * Iterates through all the attack styles currently present on the player's weapon
     * and creates the HTML element for each one of them. The element is then appended
     * onto the attack style list.
     */

    private loadAttackStyles(): void {
        // Clear the attack style list.
        this.attackStyleList.innerHTML = '';

        // Iterate through all the attack styles and create the HTML element for each one.
        for (let style of this.player.getWeapon().attackStyles)
            this.attackStyleList.append(this.createStyle(style));
    }

    /**
     * Creates an attack style list element that is appended onto the
     * attack style list. Each attack style has a different image and
     * that is determined based on the style parameter provided.
     * @param style The attack style we are creating.
     * @returns A list element that contains the attack style image.
     */

    private createStyle(style: Modules.AttackStyle): HTMLLIElement {
        let element = document.createElement('li'),
            image = document.createElement('div');

        // Append the default box onto the list element.
        element.classList.add('attack-style-box');

        // Add the attack style image.
        image.classList.add(
            'attack-style',
            `attack-style-${Modules.AttackStyle[style].toLowerCase()}`
        );

        // If the style is the same as the player's current style, we add the active class.
        if (style === this.player.getWeapon().attackStyle) element.classList.add('active');

        // Append the image onto the list element.
        element.append(image);

        // Add the click event listener to the element.
        element.addEventListener('click', () => this.styleCallback?.(style));

        return element;
    }

    /**
     * Callback for when we click on an equipment slot.
     * @param callback Contains the slot type we are selecting.
     */

    public onUnequip(callback: UnequipCallback): void {
        this.unequipCallback = callback;
    }

    /**
     * Callback for when we click on an attack style.
     * @param callback Contains the attack style we are selecting.
     */

    public onStyle(callback: StyleCallback): void {
        this.styleCallback = callback;
    }
}
