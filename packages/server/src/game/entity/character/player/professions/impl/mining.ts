import Utils from '@kaetram/common/util/utils';

import Rocks from '../../../../../../../data/professions/rocks';
import Profession from './profession';

import type { Rock } from '@kaetram/common/types/map';
import type Player from '../../player';

export default class Mining extends Profession {
    private miningInterval: NodeJS.Timeout | null = null;
    private started = false;

    private rockId!: Rock;

    public constructor(id: number, player: Player) {
        super(id, player, 'Mining');
    }

    private start(): void {
        if (this.started) return;

        this.miningInterval = setInterval(() => {
            //
        }, this.tick);

        this.started = true;
    }

    public override stop(): void {
        if (!this.started) return;

        this.rockId = null!;
        this.targetId = null;

        if (this.miningInterval) clearInterval(this.miningInterval);
        this.miningInterval = null;

        this.started = false;
    }

    // TODO
    private handle(id: string, rockId: Rock): void {
        if (!this.player.hasMiningWeapon()) {
            this.player.notify('You do not have a pickaxe to mine this rock with.');
            return;
        }

        this.rockId = rockId;
        this.targetId = id;

        if (this.level < Rocks.Levels[this.rockId]) {
            this.player.notify(
                `You must be at least level ${Rocks.Levels[this.rockId]} to mine this rock.`
            );
            return;
        }

        this.start();
    }

    private getRockDestroyChance(): boolean {
        return Utils.randomInt(0, Rocks.Chances[this.rockId]) === 2;
    }
}
