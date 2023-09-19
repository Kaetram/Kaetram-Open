import Skill from './skill';

import Item from '../../../objects/item';

import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import ResourceText from '@kaetram/common/text/en/resource';
import { Modules } from '@kaetram/common/network';
import { AnimationPacket } from '@kaetram/common/network/impl';

import type Player from '../player';
import type Resource from '../../../objects/resource/resource';
import type { ResourceInfo } from '@kaetram/common/types/resource';

type ExhaustCallback = (player: Player, resource?: Resource) => void;

export default class ResourceSkill extends Skill {
    private loop?: NodeJS.Timeout | undefined;

    private exhaustCallback?: ExhaustCallback;

    /**
     * Used to determine if the resources goes to its depleted state after a successful
     * harvest, or if there are multiple harvests per resource (fishing spots).
     */

    public randomDepletion = false;

    public constructor(type: Modules.Skills) {
        super(type);
    }

    /**
     * The interaction logic for the resource. Essentially makes sure that the player has
     * the correct requirements. If a loop doesn't exist, then we start one.
     * @param player The player that is interacting with the resource.
     * @param resource The resource instance that we are attempting to interact with.
     * @param hasWeapon Whether the player is wielding the correct weapon (passed by superclass).
     * @param weaponLevel The resource capability level of the weapon (lumberjacking for trees, mining for rocks, etc)
     */

    public interact(player: Player, resource: Resource, weaponLevel = 0): void {
        if (resource.isDepleted())
            return log.debug(
                `${player.username} attempted to interact with an exhausted resource.`
            );

        // Could not find resource interaction data for the resource.
        if (!resource.data)
            return log.warning(
                `${player.username} attempted to interact with a resource with invalid data: ${resource.type}`
            );

        // Level required for this resource is too high for the yplayer.
        if (resource.data.levelRequirement > this.level)
            return player.notify(
                ResourceText.INVALID_LEVEL(this.type, resource.data.levelRequirement)
            );

        // Unable to interact with the resource if the player hasn't completed the required achievement.
        if (
            resource.data.reqAchievement &&
            !player.achievements.get(resource.data.reqAchievement)?.isFinished()
        )
            return player.notify(ResourceText.UNABLE_TO_INTERACT(this.type));

        // Unable to interact with the resource if the player hasn't completed the required quest.
        if (resource.data.reqQuest && !player.quests.get(resource.data.reqQuest)?.isFinished())
            return player.notify(ResourceText.UNABLE_TO_INTERACT(this.type));

        if (!this.canHold(player)) return player.notify('misc:NO_SPACE');

        /**
         * Stops the existing loop if the player is attempting to interact with the resource
         * by continually clicking on it. This also allows the player to click between
         * resources.
         */
        if (this.loop) this.stop();

        this.loop = setInterval(() => {
            // Stops the loop when the resource is depleted or the player cannot hold the resource.
            if (resource.isDepleted() || !this.canHold(player)) return this.stop();

            // Send the animation packet to the region player is in.
            player.sendToRegion(
                new AnimationPacket({
                    instance: player.instance,
                    resourceInstance: resource.instance,
                    action: Modules.Actions.Attack
                })
            );

            // Use probability to check if we can exhaust the resource.
            if (this.canExhaustResource(weaponLevel, resource.data)) {
                // Add the logs to the inventory.
                player.inventory.add(this.getItem(resource.data.item));

                // Add experience to our skill.
                this.addExperience(resource.data.experience);

                // Increment the statistics for the player.
                player.statistics.handleSkill(this.type);

                // If resource has an achievement, attempt to award it if it hasn't been awarded yet.
                if (resource.data.achievement)
                    player.achievements.get(resource.data.achievement)?.finish();

                // If the resource has a quest then we will call the resource callback.
                if (resource.data.quest)
                    player.quests
                        .get(resource.data.quest)
                        ?.resourceCallback?.(this.type, resource.key);

                // Deplete the resource and send the signal to the region
                if (this.shouldDeplete()) resource.deplete();

                // Call the exhaust callback after we have successfully exhausted the resource.
                this.exhaustCallback?.(player, resource);
            }
        }, Modules.Constants.SKILL_LOOP);
    }

    /**
     * Handles the random item logic that can be applied to all resources. A resource can have
     * a list of random items specified in the configuration file that will be added to the
     * player's inventory (or dropped if they don't have space) upon exhausting the resource.
     * For example, cutting down a tree has a chance of dropping a fruit.
     * @param player The player who has exhausted the resource.
     * @param resourceInfo Contains the information about the resource such as the random items.
     */

    protected handleRandomItems(player: Player, resourceInfo: ResourceInfo): void {
        // If the resource doesn't have any random items then we can just return.
        if (!resourceInfo?.randomItems) return;

        // Grab a random item from the list of random items and calculate the probability.
        let randomItem =
                resourceInfo.randomItems[Utils.randomInt(0, resourceInfo.randomItems.length - 1)],
            chance = Utils.randomInt(0, Modules.Constants.DROP_PROBABILITY) < randomItem?.chance;

        // Probability didn't work out so stop here.
        if (!chance) return;

        // Use the superclass `getItem` function to create the item instance since weekend events don't apply.
        let item = this.getItem(randomItem.key, player.username);

        // If the player has space in their inventory add the item there, otherwise drop it on the ground.
        if (this.canHold(player)) player.inventory.add(item);
        else {
            // Set the item's position to the player's position.
            item.x = player.x;
            item.y = player.y;

            player.world.entities.addItem(item);
        }
    }

    /**
     * Stops the resource interaction loop. Called when the player
     * successfully depletes the resource or when the resource is depleted
     * by someone else.
     */

    public override stop(): void {
        if (!this.loop) return;

        clearTimeout(this.loop);

        this.loop = undefined;
    }

    /**
     * Creates an item instance of the item that the resource rewards.
     * @param key The item key we are creating.
     * @param count The amount of the item we are creating.
     * @param owner Optional parameter to make an item belong to a player.
     * @returns The newly created item instance.
     */

    protected getItem(key: string, owner = ''): Item {
        return new Item(key, -1, -1, false, 1, {}, owner);
    }

    /**
     * Function to check whether or not we can hold the resource. We use this
     * because of subclass implementations where double rewards are active.
     * @param player The player that is attempting to hold the resource.
     * @returns Whether or not the player has space in their inventory.
     */

    protected canHold(player: Player): boolean {
        return player.inventory.hasSpace();
    }

    /**
     * A randomized function which when returns true will deplete the resource. The probability
     * of successfully depleting the resource is dependant on the weapon level, lumberjacking level,
     * and the difficulty of the resource.
     *
     * Literally do not ask me how I came up with this. I don't know how I wrote it back
     * in 2019, but here it is. It works, that's what matters. It feels 'random enough.'
     * @param level The player's weapon lumberjacking level.
     * @param info The information about the resource we are attempting to exhaust.
     * @returns Whether a random number generated based on player's levels equals the difficulty of the resource.
     */

    protected canExhaustResource(level: number, info: ResourceInfo): boolean {
        // Subtract the product of the weapon's level and resource level from the resource's difficulty.
        let probability = info.difficulty - level * this.level;

        // Prevent probability from going too low.
        if (probability < 2) probability = 2;

        return Utils.randomInt(0, probability) === 2;
    }

    /**
     * Some resources have multiple harvests before they become exhausted.
     * We use a 1/10 chance to determine if the resource should be exhausted.
     * @returns Whether or not we should deplete the resource.
     */

    private shouldDeplete(): boolean {
        // If the resource is not random, then we will always deplete it.
        if (!this.randomDepletion) return true;

        // 1 in 10 chance.
        return Utils.randomInt(0, 10) === 4;
    }

    /**
     * Callback for when the resource has been exhausted. This can be
     * used by subclasses to apply additional logic after obtaining a resource.
     */

    protected onExhaust(callback: ExhaustCallback): void {
        this.exhaustCallback = callback;
    }
}
