import Modules from '../../../../util/modules';
import Utils from '../../../../util/utils';
import Player from './player';

/**
 *
 */
class Warp {
    public warpTimeout: any;

    public player: Player;

    public lastWarp: any;

    constructor(player) {
        this.player = player;

        this.lastWarp = 0;
        this.warpTimeout = 30000;
    }

    warp(id) {
        if (!this.isCooldown()) {
            this.player.notify(
                `You must wait another ${this.getDuration()} to warp.`
            );

            return;
        }

        const data = Modules.Warps[id];

        if (!data) return;

        const name = data[0];
        const x = data[3] ? data[1] + Utils.randomInt(0, 1) : data[1];
        const y = data[3] ? data[2] + Utils.randomInt(0, 1) : data[2];
        const levelRequirement = data[4];

        console.info(`Player Rights: ${this.player.rights}`);

        if (!this.player.finishedTutorial()) {
            this.player.notify('You cannot warp while in this event.');

            return;
        }

        if (this.hasRequirement()) {
            this.player.notify(
                `You must be at least level ${levelRequirement} to warp here!`
            );

            return;
        }

        this.player.teleport(x, y, false, true);

        this.player.notify(`You have been warped to ${name}`);

        this.lastWarp = new Date().getTime();
    }

    setLastWarp(lastWarp) {
        if (isNaN(lastWarp)) {
            this.lastWarp = 0;
            this.player.save();
        } else this.lastWarp = lastWarp;
    }

    isCooldown() {
        return (
            this.getDifference() > this.warpTimeout || this.player.rights > 1
        );
    }

    hasRequirement(levelRequirement?) {
        return (
            this.player.level < levelRequirement || !(this.player.rights > 1)
        );
    }

    getDuration() {
        const difference = this.warpTimeout - this.getDifference();

        if (!difference) return '5 minutes';

        return difference > 60000
            ? `${Math.ceil(difference / 60000)} minutes`
            : `${Math.floor(difference / 1000)} seconds`;
    }

    getDifference() {
        return new Date().getTime() - this.lastWarp;
    }
}

export default Warp;
