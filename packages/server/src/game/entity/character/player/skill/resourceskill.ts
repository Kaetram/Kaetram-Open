import Skill from './skill';

import Item from '../../../objects/item';
import { Animation } from '../../../../../network/packets';

import log from '@kaetram/common/util/log';
import ResourceEn from '@kaetram/common/text/en/resource';
import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

import type Player from '../player';
import type Resource from '../../../../globals/impl/resource';
import type { ResourceData, ResourceInfo } from '@kaetram/common/types/resource';

export default class ResourceSkill extends Skill {
    private loop?: NodeJS.Timeout | undefined;

    public constructor(type: Modules.Skills, private data: ResourceData) {
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

        let resourceInfo = this.data[resource.type];

        // Could not find resource interaction data for the resource.
        if (!resourceInfo)
            return log.warning(
                `${player.username} attempted to interact with a resource with invalid data.`
            );

        // Level required for this resource is too high for the yplayer.
        if (resourceInfo.levelRequirement > this.level)
            return player.notify(
                ResourceEn.INVALID_LEVEL(this.type, resourceInfo.levelRequirement)
            );

        // Unable to interact with the resource if the player hasn't completed the required achievement.
        if (
            resourceInfo.reqAchievement &&
            !player.achievements.get(resourceInfo.reqAchievement)?.isFinished()
        )
            return player.notify(ResourceEn.UNABLE_TO_INTERACT(this.type));

        // Unable to interact with the resource if the player hasn't completed the required quest.
        if (resourceInfo.reqQuest && !player.quests.get(resourceInfo.reqQuest)?.isFinished())
            return player.notify(ResourceEn.UNABLE_TO_INTERACT(this.type));

        if (!player.inventory.hasSpace()) return player.notify(ResourceEn.INVENTORY_FULL);

        /**
         * Stops the existing loop if the player is attempting to interact with the resource
         * by continually clicking on it. This also allows the player to click between
         * resources.
         */
        if (this.loop) this.stop();

        this.loop = setInterval(() => {
            // Stops the loop if the resource has been depleted by someone else (globally).
            if (resource.isDepleted()) return this.stop();

            // Send the animation packet to the region player is in.
            player.sendToRegion(
                new Animation({ instance: player.instance, action: Modules.Actions.Attack })
            );

            // Use probability to check if we can exhaust the resource.
            if (this.canExhaustResource(weaponLevel, resourceInfo)) {
                // Add the logs to the inventory.
                player.inventory.add(this.getItem(resourceInfo.item));

                // Add experience to our skill.
                this.addExperience(resourceInfo.experience);

                // If resource has an achievement, attempt to award it if it hasn't been awarded yet.
                if (resourceInfo.achievement)
                    player.achievements.get(resourceInfo.achievement)?.finish();

                // If the resource has a quest then we will call the resource callback.
                if (resourceInfo.quest)
                    player.quests
                        .get(resourceInfo.quest)
                        ?.resourceCallback?.(this.type, resource.type);

                // Deplete the resource and send the signla to the region
                resource.deplete();
            }
        }, Modules.Constants.SKILL_LOOP);
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
     * @returns The newly created item instance.
     */

    private getItem(key: string): Item {
        return new Item(key, -1, -1, false, 1);
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

    private canExhaustResource(level: number, info: ResourceInfo): boolean {
        // Subtract the product of the weapon's level and resource level from the resource's difficulty.
        let probability = info.difficulty - level * this.level;

        // Prevent probability from going too low.
        if (probability < 2) probability = 2;

        return Utils.randomInt(0, probability) === 2;
    }
}
