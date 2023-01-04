import $ from 'jquery';

import type Character from '../entity/character/character';
import type Entity from '../entity/entity';
import type InputController from './input';

export default class HUDController {
    private hovering!: Entity | undefined;

    private attackInfo = $('#attack-info');

    private name = this.attackInfo.find('.name');
    private details = this.attackInfo.find('.details');
    private health = this.attackInfo.find('.health');

    public updateCallback?: (id: string, data: number) => void;

    public constructor(private input: InputController) {
        this.onUpdate(this.handleUpdate.bind(this));
    }

    /**
     * Sets the hovering entity to the entity passed. If no
     * entity is defined, then we hide the HUD and clear
     * the hovering entity. If an entity has a health
     * bar (player or mob) then we display the health bar.
     */

    public update(entity: Entity | undefined): void {
        let { name, health, details } = this;

        // Clear the entity and HUD if the entity is undefined.
        if (!entity || !this.validEntity(entity)) {
            this.hovering = undefined;
            return this.hide();
        }

        // Display if it isn't visible.
        if (!this.isVisible()) this.display();

        // Sets the hovering entity.
        this.hovering = entity;

        // Updates the entity name.
        name.html(entity.name);

        // Check if the entity and set the health bar if it has health.
        if (this.hasHealth()) this.setHealth((entity as Character).hitPoints);
        else {
            health.hide();
            details.html('');
        }
    }

    /**
     * Checks whether the hovering entity exists and that it
     * has a health bar. If the instance doesn't match the
     * current hovering entity, then we don't proceed.
     * @param instance The instance of the entity we're updating.
     * @param hitPoints Updates the health bar of the hovering entity.
     */

    private handleUpdate(instance: string, hitPoints: number): void {
        if (!this.hasHealth()) return;
        if (this.hovering!.instance !== instance) return;

        if (hitPoints < 1) this.hide();
        else this.setHealth(hitPoints);
    }

    /**
     * Updates the health bar and the detail info of the HUD.
     * @param hitPoints The new hitpoints we are updating to.
     */

    private setHealth(hitPoints: number): void {
        if (!this.hasHealth()) return;

        this.health.show();

        let { maxHitPoints } = this.hovering as Character;

        this.health.css('width', `${Math.ceil((hitPoints / maxHitPoints) * 100) - 10}%`);
        this.details.html(`${hitPoints} / ${maxHitPoints}`);
    }

    /**
     * Checks whether the entity is valid by ensuring it is not the main
     * player character or a projectile.
     * @param entity The entity we are checking.
     * @returns If the entity is not undefined, its instance isn't the same
     * as the main player, and that it is not a projectile.
     */

    private validEntity(entity: Entity): boolean {
        return entity.instance !== this.input.player.instance && !entity.isProjectile();
    }

    /**
     * Checks whether the hovering entity exists. If it does
     * then it checks if it is a player or a mob entity.
     * @returns Checks if the hovering entity is a player or mob.
     */

    private hasHealth(): boolean {
        if (!this.hovering) return false;

        return this.hovering.isMob() || this.hovering.isPlayer();
    }

    /**
     * Displays the HUD.
     */

    private display(): void {
        this.attackInfo.fadeIn('fast');
    }

    /**
     * Hides the HUD.
     */

    private hide(): void {
        this.attackInfo.fadeOut('fast');
    }

    /**
     * Checks whether or not the attackInfo is visible.
     * @returns Whether the `display` property is set to `block`.
     */

    private isVisible(): boolean {
        return this.attackInfo.css('display') === 'block';
    }

    /**
     * Update to the HUD to update the health bar.
     * @param callback The instance of the entity and the new data.
     */

    private onUpdate(callback: (instance: string, data: number) => void): void {
        this.updateCallback = callback;
    }
}
