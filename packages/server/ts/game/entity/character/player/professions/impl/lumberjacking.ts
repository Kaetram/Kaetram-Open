import _ from 'underscore';
import Profession from './profession';
import Messages from '../../../../../../network/messages';
import Modules from '../../../../../../util/modules';
import Formulas from '../../../../../../util/formulas';
import Utils from '../../../../../../util/utils';
import Trees from '../../../../../../../data/professions/trees';
import Player from '../../player';

class Lumberjacking extends Profession {
    tick: number;

    cuttingInterval: any;
    started: boolean;

    treeId: any; // TODO

    queuedTrees: any;

    constructor(id: number, player: Player) {
        super(id, player, 'Lumberjacking');

        this.tick = 1000;

        this.cuttingInterval = null;
        this.started = false;
    }

    start() {
        if (this.started) return;

        this.cuttingInterval = setInterval(() => {
            try {
                if (!this.player || !this.isTarget() || this.world.isTreeCut(this.targetId)) {
                    this.stop();
                    return;
                }

                if (!this.treeId || !this.targetId) return;

                if (!this.player.inventory.canHold(Trees.Logs[this.treeId], 1)) {
                    this.player.notify('You do not have enough space in your inventory!');
                    this.stop();
                    return;
                }

                this.sync();
                this.player.sendToRegion(
                    new Messages.Animation(this.player.instance, {
                        action: Modules.Actions.Attack
                    })
                );

                let probability = Formulas.getTreeChance(this.player, this.treeId);

                if (Utils.randomInt(0, probability) === 2) {
                    this.addExperience(Trees.Experience[this.treeId]);

                    this.player.inventory.add({
                        id: Trees.Logs[this.treeId],
                        count: 1
                    });

                    if (this.getTreeDestroyChance())
                        this.world.destroyTree(this.targetId, Modules.Trees[this.treeId]);
                }
            } catch (e) {}
        }, this.tick);

        this.started = true;
    }

    stop() {
        if (!this.started) return;

        this.treeId = null;
        this.targetId = null;

        clearInterval(this.cuttingInterval);
        this.cuttingInterval = null;

        this.started = false;
    }

    // TODO
    handle(id: any, treeId: any) {
        if (!this.player.hasLumberjackingWeapon()) {
            this.player.notify('You do not have an axe to cut this tree with.');
            return;
        }

        this.treeId = treeId;
        this.targetId = id;

        this.world.destroyTree(this.targetId, Modules.Trees[this.treeId]);

        if (this.level < Trees.Levels[this.treeId]) {
            this.player.notify(
                `You must be at least level ${Trees.Levels[this.treeId]} to cut this tree!`
            );
            return;
        }

        this.start();
    }

    getTreeDestroyChance() {
        return Utils.randomInt(0, Trees.Chances[this.treeId]) === 2;
    }

    getQueueCount() {
        return Object.keys(this.queuedTrees).length;
    }
}

export default Lumberjacking;
