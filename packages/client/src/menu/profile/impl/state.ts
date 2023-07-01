import Util from '../../../utils/util';
import Menu from '../../menu';
import { attachTooltip } from '../../../utils/tooltip';

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
    private helmet: HTMLElement = document.querySelector('#helmet-slot > div')!;
    private pendant: HTMLElement = document.querySelector('#pendant-slot > div')!;
    private arrows: HTMLElement = document.querySelector('#arrows-slot > div')!;
    private chestplate: HTMLElement = document.querySelector('#chestplate-slot > div')!;
    private weapon: HTMLElement = document.querySelector('#weapon-slot > div')!;
    private shield: HTMLElement = document.querySelector('#shield-slot > div')!;
    private ring: HTMLElement = document.querySelector('#ring-slot > div')!;
    private weaponSkin: HTMLElement = document.querySelector('#weapon-skin-slot > div')!;
    private armourSkin: HTMLElement = document.querySelector('#armour-skin-slot > div')!;
    private legplates: HTMLElement = document.querySelector('#legplates-slot > div')!;
    private cape: HTMLElement = document.querySelector('#cape-slot > div')!;
    private boots: HTMLElement = document.querySelector('#boots-slot > div')!;

    private unequipCallback?: UnequipCallback;
    private styleCallback?: StyleCallback;

    public constructor(private player: Player) {
        super('#state-page');

        this.helmet.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.Helmet)
        );
        this.pendant.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.Pendant)
        );
        this.arrows.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.Arrows)
        );
        this.chestplate.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.Chestplate)
        );
        this.weapon.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.Weapon)
        );
        this.shield.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.Shield)
        );
        this.ring.addEventListener('click', () => this.unequipCallback?.(Modules.Equipment.Ring));
        this.weaponSkin.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.WeaponSkin)
        );
        this.armourSkin.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.ArmourSkin)
        );
        this.legplates.addEventListener('click', () =>
            this.unequipCallback?.(Modules.Equipment.Legplates)
        );
        this.cape.addEventListener('click', () => this.unequipCallback?.(Modules.Equipment.Cape));
        this.boots.addEventListener('click', () => this.unequipCallback?.(Modules.Equipment.Boots));
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
        this.helmet.style.backgroundImage =
            Util.getImageURL(this.player.getHelmet().key) ||
            this.getDefaultEquipmentIcon(Modules.Equipment.Helmet);
        this.pendant.style.backgroundImage = Util.getImageURL(this.player.getPendant().key);
        this.arrows.style.backgroundImage = Util.getImageURL(this.player.getArrows().key);
        this.chestplate.style.backgroundImage = Util.getImageURL(this.player.getChestplate().key);
        this.weapon.style.backgroundImage = Util.getImageURL(this.player.getWeapon().key);
        this.shield.style.backgroundImage = Util.getImageURL(this.player.getShield().key);
        this.ring.style.backgroundImage = Util.getImageURL(this.player.getRing().key);
        this.weaponSkin.style.backgroundImage = Util.getImageURL(this.player.getWeaponSkin().key);
        this.armourSkin.style.backgroundImage = Util.getImageURL(this.player.getArmourSkin().key);
        this.legplates.style.backgroundImage = Util.getImageURL(this.player.getLegplate().key);
        this.cape.style.backgroundImage = Util.getImageURL(this.player.getCape().key);
        this.boots.style.backgroundImage = Util.getImageURL(this.player.getBoots().key);

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

        attachTooltip(element, this.getTooltip(style));

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

    private getTooltip(style: Modules.AttackStyle): string {
        switch (style) {
            case Modules.AttackStyle.Stab: {
                return 'Stab (Accuracy EXP)';
            }

            case Modules.AttackStyle.Slash: {
                return 'Slash (Strength EXP)';
            }

            case Modules.AttackStyle.Defensive: {
                return 'Defensive (Defense EXP)';
            }

            case Modules.AttackStyle.Crush: {
                return 'Crush (Accuracy + Strength EXP)';
            }

            case Modules.AttackStyle.Shared: {
                return 'Shared (Accuracy + Strength + Defense EXP)';
            }

            case Modules.AttackStyle.Hack: {
                return 'Hack (Strength + Defense EXP)';
            }

            case Modules.AttackStyle.Chop: {
                return 'Chop (Accuracy + Defense EXP)';
            }

            case Modules.AttackStyle.Accurate: {
                return 'Accurate (Increased Accuracy)';
            }

            case Modules.AttackStyle.Fast: {
                return 'Fast (Increased Speed)';
            }

            case Modules.AttackStyle.Focused: {
                return 'Focused (Increased Damage)';
            }

            case Modules.AttackStyle.LongRange: {
                return 'Long Range';
            }
        }

        return 'Report as bug if you see this :)';
    }

    /**
     * Grabs the placeholder icon for when the equipment slow is unequipped.
     * @param type The type of equipment we are getting the icon for.
     * @returns A string of the URL for the icon.
     */

    private getDefaultEquipmentIcon(type: Modules.Equipment): string {
        switch (type) {
            case Modules.Equipment.Helmet: {
                return 'url("img/interface/equipment/helmet.png")';
            }

            default: {
                return '';
            }
        }
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
