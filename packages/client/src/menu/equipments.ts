import Menu from './menu';

import SpritesController from '../controllers/sprites';

import Player from '../entity/character/player/player';

import Util from '../utils/util';

import { Modules } from '@kaetram/common/network';
export default class Equipments extends Menu {
    // Player image elements
    private playerArmour: HTMLElement = document.querySelector('#player-image-armour')!;
    private playerWeapon: HTMLElement = document.querySelector('#player-image-weapon')!;

    // Equipment slots elements
    private weapon: HTMLElement = document.querySelector('#equipment-container > .weapon-slot')!;
    private armour: HTMLElement = document.querySelector('#equipment-container > .armour-slot')!;
    private pendant: HTMLElement = document.querySelector('#equipment-container > .pendant-slot')!;
    private ring: HTMLElement = document.querySelector('#equipment-container > .ring-slot')!;
    private boots: HTMLElement = document.querySelector('#equipment-container > .boots-slot')!;

    // Navigation elements
    private previous: HTMLElement = document.querySelector('#player-image-navigator > .previous')!;
    private next: HTMLElement = document.querySelector('#player-image-navigator > .next')!;

    // Class properties
    private imageOrientation: Modules.Orientation = Modules.Orientation.Left;

    public constructor(private player: Player, private sprites: SpritesController) {
        super('#equipments', '#close-equipments', '#equipment-button');

        // Navigation event listeners.
        this.previous.addEventListener('click', () => this.handleNavigation('previous'));
        this.next.addEventListener('click', () => this.handleNavigation('next'));
    }

    /**
     * Synchronizes the equipment screen with the player's equipment data.
     */

    public override synchronize(): void {
        this.loadPlayerImage();

        // Synchronize equipment data
        this.weapon.style.backgroundImage = Util.getImageURL(this.player.getWeapon().key);
        // Cloth armour shouldn't be displayed in the UI.
        this.armour.style.backgroundImage = Util.getImageURL(
            this.player.getArmour().key === 'clotharmor' ? '' : this.player.getArmour().key
        );
        this.pendant.style.backgroundImage = Util.getImageURL(this.player.getPendant().key);
        this.ring.style.backgroundImage = Util.getImageURL(this.player.getRing().key);
        this.boots.style.backgroundImage = Util.getImageURL(this.player.getBoots().key);
    }

    /**
     * Reload the image every time we resize the screen.
     */

    public override resize(): void {
        this.loadPlayerImage();
    }

    /**
     * Handles the navigation arrows. We just change the orientation and then update the player image.
     */

    private handleNavigation(direction: 'next' | 'previous'): void {
        let orientations = [
                Modules.Orientation.Left,
                Modules.Orientation.Up,
                Modules.Orientation.Right,
                Modules.Orientation.Down
            ],
            index = orientations.indexOf(this.imageOrientation);

        switch (direction) {
            case 'previous':
                index = index === 0 ? orientations.length - 1 : index - 1;
                break;

            case 'next':
                index = index === orientations.length - 1 ? 0 : index + 1;
                break;
        }

        this.imageOrientation = orientations[index];

        this.loadPlayerImage();
    }

    /**
     * Prepares the player image that is displayed in the equipment screen. We pick both the
     * armour and the weapon and overlay them on top of each other.
     */

    private loadPlayerImage(): void {
        let armourUrl = `url("/img/sprites/${this.player.getArmour().key}.png")`,
            armourSprite = this.player.sprite,
            isFlipped = this.imageOrientation === Modules.Orientation.Left,
            index = this.getOrientationIndex();

        // Set the player armour sprite.
        this.playerArmour.style.backgroundImage = armourUrl;
        this.playerArmour.style.backgroundPosition = `0 -${index * armourSprite.height}px`;

        /**
         * If the player has a weapon we do some fancy math, otherwise we remove the weapon
         * element's background image.
         */

        if (this.player.hasWeapon()) {
            let weaponUrl = `url("/img/sprites/${this.player.getWeapon().key}.png")`,
                weaponSprite = this.sprites.get(this.player.getWeapon().key),
                offsetX = Math.floor(weaponSprite.offsetX / 2),
                offsetY = Math.floor(weaponSprite.offsetY / 2);

            // Since weapons have varying widths and heights, we update every time we load the image.
            this.playerWeapon.style.width = `${weaponSprite.width}px`;
            this.playerWeapon.style.height = `${weaponSprite.height}px`;

            // Offset by the sprite x and y offsets
            this.playerWeapon.style.marginLeft = `${offsetX}px`;
            this.playerWeapon.style.marginTop = `${offsetY}px`;

            // Set the background image and position.
            this.playerWeapon.style.backgroundImage = weaponUrl;
            this.playerWeapon.style.backgroundPosition = `0 -${index * weaponSprite.height}px`;
        } else this.playerWeapon.style.backgroundImage = 'none';

        // Flip both armour and weapon if we are rendering the right orientation.
        this.playerArmour.style.transform = `scaleX(${isFlipped ? -1 : 1})`;
        this.playerWeapon.style.transform = `scaleX(${isFlipped ? -1 : 1})`;
    }

    /**
     * Orientation grabs the y frame index of the sprite in its sprite sheet. The left and right
     * orientations are the same since we just flip the sprite.
     * @returns A number representing the y frame index of the sprite in its sprite sheet.
     */

    private getOrientationIndex(): number {
        switch (this.imageOrientation) {
            case Modules.Orientation.Left:
            case Modules.Orientation.Right:
                return 1;

            case Modules.Orientation.Up:
                return 4;

            case Modules.Orientation.Down:
                return 7;
        }
    }
}
