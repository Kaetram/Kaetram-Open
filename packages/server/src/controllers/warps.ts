import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

import type World from '../game/world';
import type Player from '../game/entity/character/player/player';
import type { ProcessedArea } from '@kaetram/common/types/map';

export default class Warp {
    private warps: ProcessedArea[] = [];

    public lastWarp = 0; // The last time we warped to.
    private warpTimeout = 300_000; // 300 seconds between using the warps.

    public constructor(private world: World) {
        this.warps = this.world.map.warps;

        log.info(`Loaded ${this.warps.length} warp${this.warps.length === 1 ? '' : 's'}.`);
    }

    /**
     * Warps based on the id specified. Checks if the player has the
     * requirements (proper level, achievement, quests, cooldown passed) and if the warp exists.
     * @param player The player to warp.
     * @param id The id of the warp we are trying to warp to.
     */

    public warp(player: Player, id: number): void {
        if (!this.warps) return;

        // Prevent players from warping when they are jailed.
        if (player.isJailed())
            return player.notify(`warps:CANNOT_WARP_JAIL;time=${player.getJailDuration()}`);

        // Prevent warping outside the tutorial.
        if (!player.quests.isTutorialFinished()) return player.notify('warps:CANNOT_WARP_TUTORIAL');

        // Prevent warping while in combat.
        if (player.inCombat()) return player.notify('warps:CANNOT_WARP_COMBAT');

        // Prevent teleporting too often.
        if (!this.isCooldown(player))
            return player.notify(`warps:CANNOT_WARP_COOLDOWN;time=${this.getDuration(player)}`);

        let warp = this.getWarp(id);

        // No warp found.
        if (!warp) return log.warning(`Could not find warp with id ${id}.`);

        // The `hasRequirement()` function will send notifications to the player.
        if (!this.hasRequirement(player, warp)) return;

        // Perform warping.
        this.teleport(player, warp);
        player.setLastWarp();
    }

    /**
     * Finds a random position within the warp area and teleports there.
     * @param warp The warp area we are trying to warp to.
     */

    private teleport(player: Player, warp: ProcessedArea): void {
        let x = Utils.randomInt(warp.x, warp.x + warp.width - 1),
            y = Utils.randomInt(warp.y, warp.y + warp.height - 1);

        player.teleport(x, y, true);
        player.notify(`warps:WARPED_TO;name=${Utils.formatName(warp.name)}`);
    }

    /**
     * Iterates through all of the warps and checks if the player has unlocked
     * a new warp upon levelling up.
     * @param level The new level the player has reached.
     */

    public unlockedWarp(level: number): boolean {
        return this.warps.some((warp) => warp.level === level);
    }

    /**
     * Checks if the time difference between now and the last warp
     * is greater than the `warpTimeout` property. Skips the check
     * if the player is an administrator.
     * @returns Whether or there is currently a cooldown.
     */

    private isCooldown(player: Player): boolean {
        return this.getDifference(player) > this.warpTimeout || player.isAdmin();
    }

    /**
     * Checks the requirements of the warp and if the player fullfills them. A warp
     * may require the player to complete a quest, achievement, or have a specific
     * level before being unlocked.
     * @param warp The warp we are checking.
     * @returns Whether or not the player has the requirements to warp.
     */

    private hasRequirement(player: Player, warp: ProcessedArea): boolean {
        // Check if the warp has a level requirement.
        if (warp.level && player.level < warp.level) {
            player.notify(`warps:CANNOT_WARP_LEVEL;level=${warp.level}`);
            return false;
        }

        // Check if the warp has a quest requirement.
        if (warp.quest && !player.quests.get(warp.quest)?.isFinished()) {
            let quest = player.quests.get(warp.quest);

            if (!quest?.isFinished()) {
                player.notify(
                    `warps:CANNOT_WARP_QUEST;questName=${quest.name};name=${Utils.formatName(
                        warp.name
                    )}`
                );
                return false;
            }
        }

        // Check if the warp has an achievement requirement.
        if (warp.achievement && !player.achievements.get(warp.achievement)?.isFinished()) {
            player.notify('warps:CANNOT_WARP_ACHIEVEMENT');
            return false;
        }

        return true;
    }

    /**
     * Tries to find a warp in the list of warps by its id. First converts
     * the id based on the warp enum in Modules, then uses the name there
     * to find the warp in the list.
     * @param id The id of the warp we are trying to find.
     * @returns The processed area object of the warp if found, undefined otherwise.
     */

    private getWarp(id: number): ProcessedArea | undefined {
        let warpName = Modules.Warps[id]?.toLowerCase();

        return this.warps.find((warp) => warp.name === warpName);
    }

    /**
     * Looks through our list of warps and grabs those that contain an achievement.
     * @param achievement The key of the achievement we're looking for.
     * @returns The warp area or undefined if not found.
     */

    public getWarpByAchievement(achievement: string): ProcessedArea | undefined {
        return this.warps.find((warp) => warp.achievement === achievement);
    }

    /**
     * Converts the time difference between now and the last warp
     * into human readable format indicating how much longer one must
     * wait to be able to use the warp again.
     * @returns A string containing time remaining before being able to warp.
     */

    private getDuration(player: Player): string {
        let difference = this.warpTimeout - this.getDifference(player);

        if (!difference) return '5 minutes';

        return difference > 60_000
            ? `${Math.ceil(difference / 60_000)} minutes`
            : `${Math.floor(difference / 1000)} seconds`;
    }

    /**
     * Grabs the time difference between the last warp and now.
     * @returns The time difference in milliseconds of current time minus last warp.
     */

    private getDifference(player: Player): number {
        return Date.now() - player.lastWarp;
    }
}
