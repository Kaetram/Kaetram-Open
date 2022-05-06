import type Player from '../../src/game/entity/character/player/player';
import type { Plugin } from '.';

export default class HealthFlask implements Plugin {
    private id: number;
    private healAmount = 1;
    private manaAmount = 1;

    public constructor(id: number) {
        this.id = id;

        // this.healAmount = customData?.healAmount || 0;
        // this.manaAmount = customData?.manaAmount || 0;
    }

    public onUse(player: Player): void {
        if (this.healAmount) player.healHitPoints(this.healAmount);

        if (this.manaAmount) player.healManaPoints(this.manaAmount);
    }
}
