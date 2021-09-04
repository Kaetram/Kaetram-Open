import type Player from './player';

export default class Warp {
    private map;

    public lastWarp = 0;
    private warpTimeout = 30_000;

    public constructor(private player: Player) {
        this.map = player.map;
    }

    public warp(id: number): void {
        if (!this.isCooldown()) {
            this.player.notify(`You must wait another ${this.getDuration()} to warp.`);
            return;
        }

        let data = this.map.getWarpById(id);

        if (!data) return;

        if (!this.player.finishedTutorial()) {
            this.player.notify('You cannot warp while in the tutorial.');
            return;
        }

        if (!this.hasRequirement(data.level!)) {
            this.player.notify(`You must be at least level ${data.level} to warp here!`);
            return;
        }

        this.player.teleport(data.x, data.y, false, true);

        this.player.notify(`You have been warped to ${data.name}`);

        this.lastWarp = Date.now();
    }

    public setLastWarp(lastWarp: number): void {
        if (isNaN(lastWarp)) {
            this.lastWarp = 0;
            this.player.save();
        } else this.lastWarp = lastWarp;
    }

    private isCooldown(): boolean {
        return this.getDifference() > this.warpTimeout || this.player.rights > 1;
    }

    private hasRequirement(levelRequirement: number): boolean {
        return this.player.level >= levelRequirement || this.player.rights > 1;
    }

    private getDuration(): string {
        let difference = this.warpTimeout - this.getDifference();

        if (!difference) return '5 minutes';

        return difference > 60_000
            ? `${Math.ceil(difference / 60_000)} minutes`
            : `${Math.floor(difference / 1000)} seconds`;
    }

    private getDifference(): number {
        return Date.now() - this.lastWarp;
    }
}
