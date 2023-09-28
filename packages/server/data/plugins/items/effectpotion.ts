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
                return Modules.Effects.AccuracyBuff;
            }

            case 'strength': {
                return Modules.Effects.StrengthBuff;
            }

            case 'defense': {
                return Modules.Effects.DefenseBuff;
            }

            case 'magic': {
                return Modules.Effects.MagicBuff;
            }

            case 'archery': {
                return Modules.Effects.ArcheryBuff;
            }

            case 'accuracysuper': {
                return Modules.Effects.AccuracySuperBuff;
            }

            case 'strengthsuper': {
                return Modules.Effects.StrengthSuperBuff;
            }

            case 'defensesuper': {
                return Modules.Effects.DefenseSuperBuff;
            }

            case 'magicsuper': {
                return Modules.Effects.MagicSuperBuff;
            }

            case 'archerysuper': {
                return Modules.Effects.ArcherySuperBuff;
            }

            default: {
                return Modules.Effects.StrengthBuff;
            }
        }
    }
}
