import Character from './character/character';

import { Opcodes, Packets } from '@kaetram/common/network';

import type EntitiesController from '../controllers/entities';
import type Game from '../game';

export default class EntityHandler {
    private game!: Game;
    private entities!: EntitiesController;

    public constructor(private entity: Character) {}

    public load(game: Game): void {
        this.setGame(game);

        if ((!this.entity || !game) && !(this.entity instanceof Character)) return;

        this.entity.onRequestPath((x, y) => {
            if (this.entity.gridX === x && this.entity.gridY === y) return [];

            return game.findPath(this.entity, x, y);
        });

        this.entity.onBeforeStep(() => this.entities.unregisterPosition(this.entity));

        this.entity.onStep(() => {
            this.entities.registerPosition(this.entity);

            this.entity.forEachAttacker((attacker: Character) => {
                if (!attacker.target) return;

                if (attacker.target.instance !== this.entity.instance)
                    return this.entity.removeAttacker(attacker);

                if (!attacker.canAttackTarget()) attacker.follow(this.entity);
            });

            this.entity.forEachFollower((follower: Character) => {
                if (!follower.target || follower.target.instance !== this.entity.instance)
                    return this.entity.removeFollower(follower);

                follower.follow(this.entity);
            });

            this.sendMovement();

            if (
                this.entity.hasTarget() &&
                this.entity.getDistance(this.entity.target!) <= this.entity.attackRange
            )
                this.entity.stop(true);
        });

        this.entity.onFallback((x: number, y: number) => {
            game.teleport(this.entity, x, y);
        });

        //this.entity.onStopPathing();

        this.entity.ready = true;
    }

    public setGame(game: Game): void {
        this.game ||= game;

        this.setEntities(this.game.entities);
    }

    private setEntities(entities: EntitiesController): void {
        this.entities ||= entities;
    }

    /**
     * Sends a movement update to the server. Yes this is exploitable and we are
     * aware of that. The pathfinding system will be moved to the server-side and a
     * tick-based system will be implemented for entity movement. However, that will
     * be done as the last update in the alpha stages and once NodeJS 14 is deprecated.
     */

    private sendMovement(): void {
        let { entity, game } = this;

        if (!entity.isMob()) return;

        if (!entity.hasTarget() && !entity.hasAttackers()) return;

        game.socket.send(Packets.Movement, {
            opcode: Opcodes.Movement.Entity,
            targetInstance: entity.instance,
            requestX: entity.gridX,
            requestY: entity.gridY
        });
    }
}
