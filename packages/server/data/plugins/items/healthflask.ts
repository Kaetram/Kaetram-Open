import { ItemData } from '@kaetram/common/types/item';
import type { Plugin } from '.';

import type Player from '@kaetram/server/src/game/entity/character/player/player';

export default class HealthFlask implements Plugin {
    private healAmount = 1;
    private healPercent = 0;
    private manaAmount = 1;

    public constructor(data: ItemData) {
        this.healAmount = data.healAmount || 1;
        this.manaAmount = data.manaAmount || 1;
        this.healPercent = (data.healPercent || 0) / 100;
    }

    public onUse(player: Player): void {
        if (this.healPercent)
            return player.heal(player.hitPoints.getMaxHitPoints() * this.healPercent, 'hitpoints');

        if (this.healAmount) player.heal(this.healAmount, 'hitpoints');
        if (this.manaAmount) player.heal(this.manaAmount, 'hitpoints');
    }
}
