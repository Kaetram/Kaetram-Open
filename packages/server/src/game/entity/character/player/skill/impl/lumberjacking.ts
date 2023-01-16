import Trees from '../../../../../../../data/trees.json';
import { Animation } from '../../../../../../network/packets';
import Item from '../../../../objects/item';
import Skill from '../skill';

import { Modules } from '@kaetram/common/network';
import LumberjackingEn from '@kaetram/common/text/en/lumberjacking';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import type { TreeData, TreeInfo } from '@kaetram/common/types/trees';
import type Resource from '../../../../../globals/impl/resource';
import type Player from '../../player';

export default class Lumberjacking extends Skill {
    private treeData: TreeData = Trees;
    private loop?: NodeJS.Timeout | undefined;

    public constructor() {
        super(Modules.Skills.Lumberjacking);
    }

    /**
     * The cutting logic for the tree. We check if the user has
     * the correct equipment, and start a loop if it doesn't exist
     * already.
     * @param player The player that is cutting the tree.
     * @param tree The tree instance that we are attempting to cut.
     */

    public cut(player: Player, tree: Resource): void {
        if (tree.isDepleted())
            return log.debug(`${player.username} attempted to cut already cut tree.`);

        let weapon = player.equipment.getWeapon();

        // Player's weapon is not a valid lumberjacking weapon.
        if (!weapon.isLumberjacking()) return player.notify(LumberjackingEn.INVALID_WEAPON);

        let treeInfo = this.treeData[tree.type];

        // Could not find tree cutting data for the tree.
        if (!treeInfo)
            return log.warning(`${player.username} attempted to cut tree with invalid tree data.`);

        // Level required for this tree is too high for the player.
        if (treeInfo.levelRequirement > this.level)
            return player.notify(LumberjackingEn.INVALID_LEVEL(treeInfo.levelRequirement));

        // Unable to cut the tree if the player hasn't completed the required achievement.
        if (
            treeInfo.reqAchievement &&
            !player.achievements.get(treeInfo.reqAchievement)?.isFinished()
        )
            return player.notify(LumberjackingEn.UNABLE_TO_CUT);

        // Unable to cut the tree if the player hasn't completed the required quest.
        if (treeInfo.reqQuest && !player.quests.get(treeInfo.reqQuest)?.isFinished())
            return player.notify(LumberjackingEn.UNABLE_TO_CUT);

        if (!player.inventory.hasSpace()) return player.notify(LumberjackingEn.INVENTORY_FULL);

        /**
         * Stop the current loop when we are beginning to cut a tree. This will
         * continually reset the loop if the player keeps spam clicking the tree.
         */
        if (this.loop) this.stop();

        this.loop = setInterval(() => {
            // Stops loop if we detect that the tree was cut globally (perhaps by someone else).
            if (tree.isDepleted()) return this.stop();

            // Send the animation packet to the region player is in.
            player.sendToRegion(
                new Animation({ instance: player.instance, action: Modules.Actions.Attack })
            );

            // Use probability to check if we can cut the tree.
            if (this.canCutTree(weapon.lumberjacking, treeInfo)) {
                // Add the logs to the inventory.
                player.inventory.add(this.getLogs(treeInfo.item));

                // Add experience to our skill.
                this.addExperience(treeInfo.experience);

                // If tree has an achievement, attempt to award it if it hasn't been awarded yet.
                if (treeInfo.achievement) player.achievements.get(treeInfo.achievement)?.finish();

                // If a tree has a quest, we check if the quest can make a callback.
                if (treeInfo.quest) player.quests.get(treeInfo.quest)?.treeCallback?.(tree.type);

                // Cut the tree from the region.
                tree.deplete();
            }
        }, Modules.Constants.SKILL_LOOP);
    }

    /**
     * Override of the superclass stop. Implements
     * stopping of the tree cutting loop.
     */

    public override stop(): void {
        if (!this.loop) return;

        clearTimeout(this.loop);

        this.loop = undefined;
    }

    /**
     * Creates a item instance based on the key of the logs.
     * @param key The item key we are creating.
     * @returns The newly created item instance.
     */

    private getLogs(key: string): Item {
        return new Item(key, -1, -1);
    }

    /**
     * A randomized function which when returns true will cut the tree. The probability
     * of cutting the tree is dependant on the weapon level, lumberjacking level, and the
     * difficulty of the tree.
     *
     * Literally do not ask me how I came up with this. I don't know how I wrote it back
     * in 2019, but here it is. It works, that's what matters. It feels 'random enough.'
     * @param level The player's weapon lumberjacking level.
     * @param info The information about the tree to be cut.
     * @returns Whether a random number generated based on player's levels equals the difficulty of the tree.
     */

    private canCutTree(level: number, info: TreeInfo): boolean {
        // Subtract the product of the weapon's level and lumberjacking level from the tree's difficulty.
        let probability = info.difficulty - level * this.level;

        // Prevent probability from going too low.
        if (probability < 2) probability = 2;

        return Utils.randomInt(0, probability) === 2;
    }
}
