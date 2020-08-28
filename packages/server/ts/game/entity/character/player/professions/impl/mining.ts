import _ from 'lodash';
import Profession from './profession';
import Packets from '../../../../../../network/packets';
import Messages from '../../../../../../network/messages';
import Modules from '../../../../../../util/modules';
import Formulas from '../../../../../../util/formulas';
import Utils from '../../../../../../util/utils';
import Rocks from '../../../../../../../data/professions/rocks';
import Player from '../../player';

class Mining extends Profession {
    tick: number;

    miningInterval: any;
    started: boolean;

    rockId: any;

    constructor(id: number, player: Player) {
        super(id, player, 'Mining');

        this.tick = 1000;

        this.miningInterval = null;
        this.started = false;
    }

    start() {
        if (this.started) return;

        this.miningInterval = setInterval(() => {
            try {
            } catch (e) {}
        }, this.tick);

        this.started = true;
    }

    stop() {
        if (!this.started) return;

        this.rockId = null;
        this.targetId = null;

        clearInterval(this.miningInterval);
        this.miningInterval = null;

        this.started = false;
    }

    // TODO
    handle(id: any, rockId: any) {
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

    getRockDestroyChance() {
        return Utils.randomInt(0, Rocks.Chances[this.rockId]) === 2;
    }
}

export default Mining;
