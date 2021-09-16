import Items from '../../src/util/items';

import type Player from '../../src/game/entity/character/player/player';
import type { Plugin } from '.';

export default class HealthFlask implements Plugin {
    private id: number;
    private healAmount: number;
    private manaAmount: number;

    public constructor(id: number) {
        this.id = id;

        let customData = Items.getCustomData(this.id);

        this.healAmount = customData?.healAmount || 0;
        this.manaAmount = customData?.manaAmount || 0;
    }

    public onUse(player: Player): void {
        if (this.healAmount) player.healHitPoints(this.healAmount);

        if (this.manaAmount) player.healManaPoints(this.manaAmount);
    }
}
