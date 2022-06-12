import type Player from '../../src/game/entity/character/player/player';
import type { Plugin } from '.';

export default class HealthFlask implements Plugin {
    private healAmount = 1;
    private manaAmount = 1;

    public onUse(player: Player): void {
        if (this.healAmount) player.healHitPoints(this.healAmount);
        if (this.manaAmount) player.healManaPoints(this.manaAmount);
    }
}
