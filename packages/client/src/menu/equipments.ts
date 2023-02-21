import Menu from './menu';

import Util from '../utils/util';

import { Modules } from '@kaetram/common/network';

import type { Bonuses, Stats } from '@kaetram/common/types/item';
import type SpritesController from '../controllers/sprites';
import type Player from '../entity/character/player/player';

type UnequipCallback = (type: Modules.Equipment) => void;

export default class Equipments extends Menu {
    // Player image elements
    private playerArmour: HTMLElement = document.querySelector('#player-image-armour')!;
    private playerWeapon: HTMLElement = document.querySelector('#player-image-weapon')!;

    // Equipment slots elements
    private weapon: HTMLElement = document.querySelector('.equip-weapon-slot')!;
    private weaponSkin: HTMLElement = document.querySelector('.equip-weapon-skin-slot')!;
    private armour: HTMLElement = document.querySelector('.equip-armour-slot')!;
    private armourSkin: HTMLElement = document.querySelector('.equip-armour-skin-slot')!;
    private pendant: HTMLElement = document.querySelector('.equip-pendant-slot')!;
    private ring: HTMLElement = document.querySelector('.equip-ring-slot')!;
    private boots: HTMLElement = document.querySelector('.equip-boots-slot')!;
    private arrow: HTMLElement = document.querySelector('.equip-arrows-slot')!;

    // Counts
    private arrowsCount: HTMLElement = document.querySelector('#arrows-count')!;

    // Navigation elements
    private previous: HTMLElement = document.querySelector('#player-image-navigator > .previous')!;
    private next: HTMLElement = document.querySelector('#player-image-navigator > .next')!;

    // Stats elements
    private attackStats: HTMLElement = document.querySelector('#attack-stats')!;
    private defenseStats: HTMLElement = document.querySelector('#defense-stats')!;
    private bonuses: HTMLElement = document.querySelector('#bonuses')!;

    // Class properties
    private imageOrientation: Modules.Orientation = Modules.Orientation.Down;

    private unequipCallback?: UnequipCallback;

    public constructor(private player: Player, private sprites: SpritesController) {
        super('#equipments', '#close-equipments', '#equipment-button');

        // Navigation event listeners.
        this.previous.addEventListener('click', () => this.handleNavigation('previous'));
        this.next.addEventListener('click', () => this.handleNavigation('next'));

        // Equipment slot event listeners -- definitely not stolen from the state page :)
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
     * Synchronizes the equipment screen with the player's equipment data.
     */

    public override synchronize(): void {
        this.loadStats();
        this.loadPlayerImage();

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

        // Synchronize arrow count
        let arrowCount = this.player.getArrows().count;

        this.arrowsCount.innerHTML = arrowCount < 1 ? '' : `+${arrowCount}`;
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
            case 'previous': {
                index = index === 0 ? orientations.length - 1 : index - 1;
                break;
            }

            case 'next': {
                index = index === orientations.length - 1 ? 0 : index + 1;
                break;
            }
        }

        this.imageOrientation = orientations[index];

        this.loadPlayerImage();
    }

    /**
     * Adds up all the attack, defense, and bonuses from all the equipments and displays them.
     */

    private loadStats(): void {
        let attackStats: Stats = Util.getEmptyStats(),
            defenseStats: Stats = Util.getEmptyStats(),
            bonuses: Bonuses = Util.getEmptyBonuses();

        // iterate through all the equipments and add up the stats.
        for (let equipment of Object.values(this.player.equipments)) {
            if (!equipment.exists()) continue;

            attackStats.crush += equipment.attackStats.crush;
            attackStats.slash += equipment.attackStats.slash;
            attackStats.stab += equipment.attackStats.stab;
            attackStats.archery += equipment.attackStats.archery;
            attackStats.magic += equipment.attackStats.magic;

            defenseStats.crush += equipment.defenseStats.crush;
            defenseStats.slash += equipment.defenseStats.slash;
            defenseStats.stab += equipment.defenseStats.stab;
            defenseStats.archery += equipment.defenseStats.archery;
            defenseStats.magic += equipment.defenseStats.magic;

            bonuses.accuracy += equipment.bonuses.accuracy;
            bonuses.strength += equipment.bonuses.strength;
            bonuses.archery += equipment.bonuses.archery;
            bonuses.magic += equipment.bonuses.magic;
        }

        let stats = ['Crush', 'Slash', 'Stab', 'Archery', 'Magic'],
            statBonuses = ['Accuracy', 'Strength', 'Archery', 'Magic'];

        for (let stat of stats) {
            let lStat = stat.toLowerCase(),
                attackElement = this.attackStats.querySelector(`.${lStat.toLowerCase()}`)!,
                defenseElement = this.defenseStats.querySelector(`.${lStat.toLowerCase()}`)!,
                attackStat = attackStats[lStat as keyof Stats],
                defenseStat = defenseStats[lStat as keyof Stats];

            attackElement.textContent = `${stat}: ${attackStat > 0 ? '+' : ''}${attackStat}`;
            defenseElement.textContent = `${stat}: ${defenseStat > 0 ? '+' : ''}${defenseStat}`;
        }

        for (let bonus of statBonuses) {
            let lBonus = bonus.toLowerCase(),
                bonusElement = this.bonuses.querySelector(`.${lBonus.toLowerCase()}`)!,
                bonusStat = bonuses[lBonus as keyof Bonuses];

            bonusElement.textContent = `${bonus}: ${bonusStat > 0 ? '+' : ''}${bonusStat}`;
        }
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

        if (!armourSprite) return;

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

        // Flip the player image if we are rendering the right orientation.
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
            case Modules.Orientation.Right: {
                return 1;
            }

            case Modules.Orientation.Up: {
                return 4;
            }

            case Modules.Orientation.Down: {
                return 7;
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
}
