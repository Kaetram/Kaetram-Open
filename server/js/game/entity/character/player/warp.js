/* global module */

const Modules = require('../../../../util/modules'),
    Utils = require('../../../../util/utils');

class Warp {
    constructor(player) {
        const self = this;

        self.player = player;

        self.lastWarp = 0;
        self.warpTimeout = 30000;
    }

    warp(id) {
        const self = this;

        if (!self.isCooldown()) {
            self.player.notify('You must wait another ' + self.getDuration() + ' to warp.');
            return;
        }

        const data = Modules.Warps[id];

        if (!data)
            return;

        const name = data[0],
            x = data[3] ? data[1] + Utils.randomInt(0, 1) : data[1],
            y = data[3] ? data[2] + Utils.randomInt(0, 1) : data[2],
            levelRequirement = data[4];

        log.info('Player Rights: ' + self.player.rights);

        if (self.hasRequirement()) {
            self.player.notify('You must be at least level ' + levelRequirement + ' to warp here!');
            return;
        }

        self.player.teleport(x, y, false, true);

        self.player.notify('You have been warped to ' + name);

        self.lastWarp = new Date().getTime();
    }

    setLastWarp(lastWarp) {
        const self = this;

        if (isNaN(lastWarp)) {
            self.lastWarp = 0;
            self.player.save();
        } else
            self.lastWarp = lastWarp;
    }

    isCooldown() {
        return this.getDifference() > this.warpTimeout || this.player.rights > 1;
    }

    hasRequirement(levelRequirement) {
        return this.player.level < levelRequirement || !this.player.rights > 1;
    }

    getDuration() {
        const self = this,
            difference = this.warpTimeout - self.getDifference();

        if (!difference)
            return '5 minutes';

        return difference > 60000 ? Math.ceil(difference / 60000) + ' minutes' : Math.floor(difference / 1000) + ' seconds';
    }

    getDifference() {
        return new Date().getTime() - this.lastWarp;
    }
}

module.exports = Warp;
