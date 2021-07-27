import * as Modules from '@kaetram/common/src/modules';

import Trees from '../../../../../../../data/professions/trees';
import Messages from '../../../../../../network/messages';
import Formulas from '../../../../../../util/formulas';
import Utils from '../../../../../../util/utils';
import Player from '../../player';
import Profession from './profession';

export default class Lumberjacking extends Profession {
    tick: number;

    cuttingInterval: NodeJS.Timeout;
    started: boolean;

    treeId: Modules.Trees; // TODO

    queuedTrees: Record<string, never>;

    constructor(id: number, player: Player) {
        super(id, player, 'Lumberjacking');

        this.tick = 1000;

        this.cuttingInterval = null;
        this.started = false;
    }

    start(): void {
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
                        this.world.destroyTree(this.targetId, Modules.Trees[this.treeId] as never);
                }
            } catch {
                //
            }
        }, this.tick);

        this.started = true;
    }

    stop(): void {
        if (!this.started) return;

        this.treeId = null;
        this.targetId = null;

        clearInterval(this.cuttingInterval);
        this.cuttingInterval = null;

        this.started = false;
    }

    // TODO
    handle(id: string, treeId: Modules.Trees): void {
        if (!this.player.hasLumberjackingWeapon()) {
            this.player.notify('You do not have an axe to cut this tree with.');
            return;
        }

        this.treeId = treeId;
        this.targetId = id;

        if (this.level < Trees.Levels[this.treeId]) {
            this.player.notify(
                `You must be at least level ${Trees.Levels[this.treeId]} to cut this tree!`
            );
            return;
        }

        this.start();
    }

    getTreeDestroyChance(): boolean {
        return Utils.randomInt(0, Trees.Chances[this.treeId]) === 2;
    }

    getQueueCount(): number {
        return Object.keys(this.queuedTrees).length;
    }
}
