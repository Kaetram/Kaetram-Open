import type { ItemData } from '@kaetram/common/types/item';
import type Player from '@kaetram/server/src/game/entity/character/player/player';
import type { Plugin } from '.';

export default class HealthFlask implements Plugin {
    private healAmount = 0;
    private healPercent = 0;
    private manaAmount = 0;

    public constructor(data: ItemData) {
        this.healAmount = data.healAmount || 0;
        this.manaAmount = data.manaAmount || 0;
        this.healPercent = (data.healPercent || 0) / 100;
    }

    public onUse(player: Player): boolean {
        if (this.manaAmount) {
            if (player.mana.isFull()) {
                player.notify(`You are already at full mana.`);
                return false;
            }

            player.heal(this.manaAmount, 'mana');
        }

        if (this.healAmount || this.healPercent) {
            if (player.hitPoints.isFull()) {
                player.notify(`You are already at full health.`);
                return false;
            }

            if (this.healPercent) {
                player.heal(player.hitPoints.getMaxHitPoints() * this.healPercent, 'hitpoints');
                return true;
            }

            player.heal(this.healAmount, 'hitpoints');
        }

        return true;
    }
}
