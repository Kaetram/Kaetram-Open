import { Packets, Opcodes } from '@kaetram/common/network';

import Character from './character/character';

import type EntitiesController from '../controllers/entities';
import type Game from '../game';

export default class EntityHandler {
    private game!: Game;
    private entities!: EntitiesController;

    public constructor(private entity: Character) {}

    public load(): void {
        let { entity, game, entities } = this;

        if ((!entity || !game) && !(entity instanceof Character)) return;

        entity.onRequestPath((x, y) => {
            if (entity.gridX === x && entity.gridY === y) return [];

            return game.findPath(entity, x, y);
        });

        entity.onBeforeStep(() => entities.unregisterPosition(entity));

        entity.onStep(() => {
            entities.registerPosition(entity);

            entity.forEachAttacker((attacker: Character) => {
                if (!attacker.target) return;

                if (attacker.target.instance !== entity.instance)
                    return entity.removeAttacker(attacker);

                attacker.follow(entity);
            });

            if (entity.isMob() && (entity.hasAttackers() || entity.hasTarget()))
                game.socket.send(Packets.Movement, {
                    opcode: Opcodes.Movement.Entity,
                    targetInstance: entity.instance,
                    requestX: entity.gridX,
                    requestY: entity.gridY
                });

            if (entity.hasTarget() && entity.getDistance(entity.target!) <= entity.attackRange)
                entity.stop(true);
        });
    }

    public setGame(game: Game): void {
        this.game ||= game;

        this.setEntities(this.game.entities);
    }

    private setEntities(entities: EntitiesController): void {
        this.entities ||= entities;
    }
}
