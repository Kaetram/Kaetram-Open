import Player from './player';

import log from '@kaetram/common/util/log';

import { ProcessedArea } from '@kaetram/common/types/map.d';
import { Modules } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

export default class Warp {
    private warps: ProcessedArea[] = [];

    public lastWarp = 0; // The last time we warped to.
    private warpTimeout = 30_000; // 30 seconds between using the warps.

    public constructor(private player: Player) {
        this.warps = this.player.map.warps;
    }

    /**
     * Warps based on the id specified. Checks if the player has the
     * requirements (proper level, cooldown passed) and if the warp exists.
     * @param id The id of the warp we are trying to warp to.
     */

    public warp(id: number): void {
        if (!this.warps) return;

        if (!this.player.quests.isTutorialFinished())
            return this.player.notify(`You must finish the tutorial before warping.`);

        if (!this.isCooldown())
            return this.player.notify(`You must wait another ${this.getDuration()} to warp.`);

        let warp = this.getWarp(id);

        if (!warp) return log.error(`Could not find warp with id ${id}.`);

        if (!this.hasRequirement(warp.level!))
            return this.player.notify(`You must be at least level ${warp.level} to warp here!`);

        // Perform warping.
        this.player.teleport(warp.x, warp.y, true);
        this.player.notify(`You have been warped to ${Utils.formatName(warp.name)}!`);

        this.setLastWarp();
    }

    /**
     * Updates the lastWarp time variable. Primarily used to reload
     * the last warped time after logging out and back in.
     * @param lastWarp The date in milliseconds of the last warp. Defaults to now.
     */

    public setLastWarp(lastWarp: number = Date.now()): void {
        this.lastWarp = isNaN(lastWarp) ? 0 : lastWarp;
    }

    /**
     * Checks if the time difference between now and the last warp
     * is greater than the `warpTimeout` property. Skips the check
     * if the player is an administrator.
     * @returns Whether or there is currently a cooldown.
     */

    private isCooldown(): boolean {
        return this.getDifference() > this.warpTimeout || this.player.rights > 1;
    }

    /**
     * Checks if the player meets the requirement for using the warp.
     * Requirements are automatically skipped if the player is an admin.
     * @param level The level required to use the warp.
     * @returns Whether or not the player meets the requirement.
     */

    private hasRequirement(level: number): boolean {
        return this.player.level >= level || this.player.rights > 1;
    }

    /**
     * Tries to find a warp in the list of warps by its id. First converts
     * the id based on the warp enum in Modules, then uses the name there
     * to find the warp in the list.
     * @param id The id of the warp we are trying to find.
     * @returns The processed area object of the warp if found, undefined otherwise.
     */

    private getWarp(id: number): ProcessedArea | undefined {
        let warpName = Modules.Warps[id].toLowerCase();

        return this.warps.find((warp) => warp.name === warpName);
    }

    /**
     * Converts the time difference between now and the last warp
     * into human readable format indicating how much longer one must
     * wait to be able to use the warp again.
     * @returns A string containing time remaining before being able to warp.
     */

    private getDuration(): string {
        let difference = this.warpTimeout - this.getDifference();

        if (!difference) return '5 minutes';

        return difference > 60_000
            ? `${Math.ceil(difference / 60_000)} minutes`
            : `${Math.floor(difference / 1000)} seconds`;
    }

    /**
     * Grabs the time difference between the last warp and now.
     * @returns The time difference in milliseconds of current time minus last warp.
     */

    private getDifference(): number {
        return Date.now() - this.lastWarp;
    }
}
