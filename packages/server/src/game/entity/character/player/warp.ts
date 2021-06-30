/* global module */

import Modules from '../../../../util/modules';
import Utils from '../../../../util/utils';
import Player from './player';
import Map from '../../../../map/map';

class Warp {
    private player: Player;
    private map: Map;

    public lastWarp: number;
    private warpTimeout: number;

    constructor(player: Player) {
        this.player = player;
        this.map = player.map;

        this.lastWarp = 0;
        this.warpTimeout = 30000;
    }

    warp(id: number): void {
        if (!this.isCooldown()) {
            this.player.notify('You must wait another ' + this.getDuration() + ' to warp.');
            return;
        }

        let data = this.map.getWarpById(id);

        if (!data) return;

        if (!this.player.finishedTutorial()) {
            this.player.notify('You cannot warp while in the tutorial.');
            return;
        }

        if (!this.hasRequirement(data.level)) {
            this.player.notify(`You must be at least level ${data.level} to warp here!`);
            return;
        }

        this.player.teleport(data.x, data.y, false, true);

        this.player.notify(`You have been warped to ${data.name}`);

        this.lastWarp = Date.now();
    }

    setLastWarp(lastWarp: number): void {
        if (isNaN(lastWarp)) {
            this.lastWarp = 0;
            this.player.save();
        } else this.lastWarp = lastWarp;
    }

    isCooldown(): boolean {
        return this.getDifference() > this.warpTimeout || this.player.rights > 1;
    }

    hasRequirement(levelRequirement: number): boolean {
        return this.player.level >= levelRequirement || this.player.rights > 1;
    }

    getDuration(): string {
        let difference = this.warpTimeout - this.getDifference();

        if (!difference) return '5 minutes';

        return difference > 60000
            ? Math.ceil(difference / 60000) + ' minutes'
            : Math.floor(difference / 1000) + ' seconds';
    }

    getDifference(): number {
        return Date.now() - this.lastWarp;
    }
}

export default Warp;
