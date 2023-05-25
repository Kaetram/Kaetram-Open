import { Modules } from '@kaetram/common/network';

import type Player from '@kaetram/server/src/game/entity/character/player/player';
import type { Plugin } from '.';
import type { ItemData } from '@kaetram/common/types/item';

export default class EffectPotion implements Plugin {
    private effect = '';
    private duration = 60_000;

    public constructor(data: ItemData) {
        this.effect = data.effect || this.effect;
        this.duration = data.duration || this.duration;
    }

    public onUse(player: Player): boolean {
        player.status.addWithTimeout(this.getEffect(), this.duration, () => {
            player.notify(`The effect of the ${this.effect} potion has worn off.`);
        });

        player.notify(`You drink the ${this.effect} potion.`);

        return true;
    }

    /**
     * Returns the effect based on the item's effect property.
     */

    private getEffect(): Modules.Effects {
        switch (this.effect) {
            case 'accuracy': {
                return Modules.Effects.AccuracyPotion;
            }

            case 'strength': {
                return Modules.Effects.StrengthPotion;
            }

            case 'defense': {
                return Modules.Effects.DefensePotion;
            }

            default: {
                return Modules.Effects.StrengthPotion;
            }
        }
    }
}
