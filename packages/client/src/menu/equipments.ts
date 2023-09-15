import Menu from './menu';

import log from '../lib/log';
import Util from '../utils/util';

import { Modules } from '@kaetram/common/network';

import type { Bonuses, Stats } from '@kaetram/common/types/item';
import type SpritesController from '../controllers/sprites';
import type Player from '../entity/character/player/player';
import type Equipment from '../entity/character/player/equipment';
import type Game from '../game';

type UnequipCallback = (type: Modules.Equipment) => void;
type ImageOrientation = 'down' | 'right' | 'up' | 'left';

export default class Equipments extends Menu {
    public override identifier: number = Modules.Interfaces.Equipments;

    private player: Player;
    private sprites: SpritesController;

    // Player image canvas
    private playerCanvas: HTMLCanvasElement = document.querySelector(
        '#equipments-player-image-canvas'
    )!;

    private equipmentSlots: HTMLElement = document.querySelector('#equipment-slots')!;

    // Equipment slots elements
    private helmet: HTMLElement = this.equipmentSlots.querySelector(
        '.equipment-slot-helmet > .equipment-slot-image'
    )!;
    private pendant: HTMLElement = this.equipmentSlots.querySelector(
        '.equipment-slot-pendant > .equipment-slot-image'
    )!;
    private arrows: HTMLElement = this.equipmentSlots.querySelector(
        '.equipment-slot-arrows > .equipment-slot-image'
    )!;
    private chestplate: HTMLElement = this.equipmentSlots.querySelector(
        '.equipment-slot-chestplate > .equipment-slot-image'
    )!;
    private weapon: HTMLElement = this.equipmentSlots.querySelector(
        '.equipment-slot-weapon > .equipment-slot-image'
    )!;
    private shield: HTMLElement = this.equipmentSlots.querySelector(
        '.equipment-slot-shield > .equipment-slot-image'
    )!;
    private ring: HTMLElement = this.equipmentSlots.querySelector(
        '.equipment-slot-ring > .equipment-slot-image'
    )!;
    private weaponSkin: HTMLElement = this.equipmentSlots.querySelector(
        '.equipment-slot-weapon-skin > .equipment-slot-image'
    )!;
    private armourSkin: HTMLElement = this.equipmentSlots.querySelector(
        '.equipment-slot-armour-skin > .equipment-slot-image'
    )!;
    private legplates: HTMLElement = this.equipmentSlots.querySelector(
        '.equipment-slot-legplates > .equipment-slot-image'
    )!;
    private cape: HTMLElement = this.equipmentSlots.querySelector(
        '.equipment-slot-cape > .equipment-slot-image'
    )!;
    private boots: HTMLElement = this.equipmentSlots.querySelector(
        '.equipment-slot-boots > .equipment-slot-image'
    )!;

    // Counts
    private arrowsCount: HTMLElement = document.querySelector('.equipment-slot-arrows-count')!;

    // Navigation elements
    private previous: HTMLElement = document.querySelector(
        '#equipments-player-image-navigator > .previous'
    )!;
    private next: HTMLElement = document.querySelector(
        '#equipments-player-image-navigator > .next'
    )!;

    // Stats elements
    private attackStats: HTMLElement = document.querySelector('#attack-stats')!;
    private defenseStats: HTMLElement = document.querySelector('#defense-stats')!;
    private bonuses: HTMLElement = document.querySelector('#bonuses')!;

    // Class properties
    private imageOrientation: Modules.Orientation = Modules.Orientation.Down;

    private unequipCallback?: UnequipCallback;

    public constructor(private game: Game) {
        super('#equipments', '#close-equipments', '#equipment-button');

        this.player = game.player;
        this.sprites = game.sprites;

        // Navigation event listeners.
        this.previous.addEventListener('click', () => this.handleNavigation('previous'));
        this.next.addEventListener('click', () => this.handleNavigation('next'));

        // Equipment slot event listeners -- definitely not stolen from the state page :)
        this.helmet.addEventListener(
            'click',
            () => this.unequipCallback?.(Modules.Equipment.Helmet)
        );
        this.pendant.addEventListener(
            'click',
            () => this.unequipCallback?.(Modules.Equipment.Pendant)
        );
        this.arrows.addEventListener(
            'click',
            () => this.unequipCallback?.(Modules.Equipment.Arrows)
        );
        this.chestplate.addEventListener(
            'click',
            () => this.unequipCallback?.(Modules.Equipment.Chestplate)
        );
        this.weapon.addEventListener(
            'click',
            () => this.unequipCallback?.(Modules.Equipment.Weapon)
        );
        this.shield.addEventListener(
            'click',
            () => this.unequipCallback?.(Modules.Equipment.Shield)
        );
        this.ring.addEventListener('click', () => this.unequipCallback?.(Modules.Equipment.Ring));
        this.weaponSkin.addEventListener(
            'click',
            () => this.unequipCallback?.(Modules.Equipment.WeaponSkin)
        );
        this.armourSkin.addEventListener(
            'click',
            () => this.unequipCallback?.(Modules.Equipment.ArmourSkin)
        );
        this.legplates.addEventListener(
            'click',
            () => this.unequipCallback?.(Modules.Equipment.Legplates)
        );
        this.cape.addEventListener('click', () => this.unequipCallback?.(Modules.Equipment.Cape));
        this.boots.addEventListener('click', () => this.unequipCallback?.(Modules.Equipment.Boots));
    }

    /**
     * Override for the menu `show()` function to synchronize
     * the equipment screen with the player's equipment data.
     */

    public override show(): void {
        super.show();

        this.synchronize();
    }

    /**
     * Synchronizes the equipment screen with the player's equipment data.
     */

    public override synchronize(): void {
        this.loadStats();
        this.updatePlayerImage();

        // Synchronize equipment data
        this.helmet.style.backgroundImage =
            Util.getImageURL(this.player.getHelmet().key) ||
            Util.getEquipmentPlaceholderURL(Modules.Equipment.Helmet);
        this.pendant.style.backgroundImage =
            Util.getImageURL(this.player.getPendant().key) ||
            Util.getEquipmentPlaceholderURL(Modules.Equipment.Pendant);
        this.arrows.style.backgroundImage =
            Util.getImageURL(this.player.getArrows().key) ||
            Util.getEquipmentPlaceholderURL(Modules.Equipment.Arrows);
        this.chestplate.style.backgroundImage =
            Util.getImageURL(this.player.getChestplate().key) ||
            Util.getEquipmentPlaceholderURL(Modules.Equipment.Chestplate);
        this.weapon.style.backgroundImage =
            Util.getImageURL(this.player.getWeapon().key) ||
            Util.getEquipmentPlaceholderURL(Modules.Equipment.Weapon);
        this.shield.style.backgroundImage =
            Util.getImageURL(this.player.getShield().key) ||
            Util.getEquipmentPlaceholderURL(Modules.Equipment.Shield);
        this.ring.style.backgroundImage =
            Util.getImageURL(this.player.getRing().key) ||
            Util.getEquipmentPlaceholderURL(Modules.Equipment.Ring);
        this.weaponSkin.style.backgroundImage =
            Util.getImageURL(this.player.getWeaponSkin().key) ||
            Util.getEquipmentPlaceholderURL(Modules.Equipment.WeaponSkin);
        this.armourSkin.style.backgroundImage =
            Util.getImageURL(this.player.getArmourSkin().key) ||
            Util.getEquipmentPlaceholderURL(Modules.Equipment.ArmourSkin);
        this.legplates.style.backgroundImage =
            Util.getImageURL(this.player.getLegplate().key) ||
            Util.getEquipmentPlaceholderURL(Modules.Equipment.Legplates);
        this.cape.style.backgroundImage =
            Util.getImageURL(this.player.getCape().key) ||
            Util.getEquipmentPlaceholderURL(Modules.Equipment.Cape);
        this.boots.style.backgroundImage =
            Util.getImageURL(this.player.getBoots().key) ||
            Util.getEquipmentPlaceholderURL(Modules.Equipment.Boots);

        // Synchronize arrow count
        let arrowCount = this.player.getArrows().count;

        this.arrowsCount.innerHTML = arrowCount < 1 ? '' : `+${arrowCount}`;
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

        this.updatePlayerImage(
            Modules.Orientation[this.imageOrientation].toString().toLowerCase() as ImageOrientation
        );
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
     * The character image is a 2D canvas that is using the player's base
     * alongside all of the equipment and customizations their sprite has.
     * We build the character image by drawing the base sprite and then
     * drawing the equipment and customizations on top of it.
     */

    public updatePlayerImage(frame: ImageOrientation = 'down'): void {
        let context = this.playerCanvas.getContext('2d')!,
            flip = frame === 'left',
            { sprite } = this.player;

        // Ensure we have a valid sprite and context before drawing anything.
        if (!context || !sprite || sprite.key === 'death') return;

        if (flip) frame = 'right';

        // Grab the frame based on the specified parameter
        let idleFrame = sprite.animations[`idle_${frame}`];

        if (!idleFrame) return log.error(`Could not find idle frame for ${frame}.`);

        let frameY = idleFrame.row * sprite.height, // Grab the row of the frame specified.
            canvasWidth = this.playerCanvas.width,
            canvasHeight = this.playerCanvas.height;

        // Remove image smoothing to make the image look pixelated.
        context.imageSmoothingQuality = 'low';
        context.imageSmoothingEnabled = false;

        // Clear the canvas before drawing the new image.
        context.clearRect(0, 0, this.playerCanvas.width, this.playerCanvas.height);

        // Restore to original and save that data so we can undo the flip.
        context.restore();
        context.save();

        // Flip the canvas if we are facing left.
        if (flip) {
            context.translate(canvasWidth, 0);
            context.scale(-1, 1);
        }

        // Scale proportionally to the ratio between canvas width and its height.
        let ratio = canvasHeight / canvasWidth;

        // // Translate the sprite to the middle.
        context.save();
        context.scale(ratio, 1);
        context.translate(canvasWidth / 2, 0);

        // Draw the base sprite and then the equipment on top of it.
        context.drawImage(
            sprite.image,
            0,
            frameY,
            sprite.width,
            sprite.height,
            0,
            0,
            canvasWidth,
            canvasHeight
        );

        // Draw the equipment on top of the base sprite.
        this.player.forEachEquipment((equipment: Equipment) => {
            // Grab the sprite based on the equipment key.
            let equipmentSprite = this.game.sprites.get(equipment.key);

            // Skip if we don't have a valid sprite.
            if (!equipmentSprite) return;

            if (!equipmentSprite.loaded) equipmentSprite.load();

            let scalingWidth = 1,
                scalingHeight = 1,
                mismatchSize =
                    equipmentSprite.width !== sprite.width ||
                    equipmentSprite.height !== sprite.height;

            if (mismatchSize) {
                frameY = idleFrame.row * equipmentSprite.height;
                scalingWidth = equipmentSprite.width / sprite.width;
                scalingHeight = equipmentSprite.height / sprite.height;

                let dx = equipmentSprite.offsetX * 4 - 8,
                    dy = equipmentSprite.offsetY - 8;

                if (equipmentSprite.width === 64) dx -= 48;
                if (equipmentSprite.height === 64) dy -= 28;

                context.save();
                context.translate(dx, dy);
            }

            // Draw using the same frames as the base sprite.
            context.drawImage(
                equipmentSprite.image,
                0,
                frameY,
                equipmentSprite.width,
                equipmentSprite.height,
                0,
                0,
                canvasWidth * scalingWidth,
                canvasHeight * scalingHeight
            );

            if (mismatchSize) context.restore();
        }, true);

        context.restore();
    }

    /**
     * Callback for when we click on an equipment slot.
     * @param callback Contains the slot type we are selecting.
     */

    public onUnequip(callback: UnequipCallback): void {
        this.unequipCallback = callback;
    }
}
