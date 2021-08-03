import { Opcodes, Packets } from '@kaetram/common/network';

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

            let ignores = [entity];

            return game.findPath(entity, x, y, ignores);
        });

        entity.onBeforeStep(() => entities.unregisterPosition(entity));

        entity.onStep(() => {
            entities.registerDuality(entity);

            entity.forEachAttacker((attacker) => {
                /**
                 * This is the client-sided logic for representing PVP
                 * fights. It basically adds another layer of movement
                 * so the entity is always following the player.
                 */

                if (entity.type !== 'player') return;

                if (attacker.type !== 'player') return;

                if (!attacker.target) return;

                if (attacker.target.id !== entity.id) return;

                if (attacker.stunned) return;

                attacker.follow(entity);
            });

            if (entity.type === 'mob')
                game.socket.send(Packets.Movement, [
                    Opcodes.Movement.Entity,
                    entity.id,
                    entity.gridX,
                    entity.gridY
                ]);

            if (
                entity.attackRange > 1 &&
                entity.target &&
                entity.getDistance(entity.target) <= entity.attackRange
            )
                entity.stop(false);
        });

        entity.onStopPathing(() => {
            entities.grids.addToRenderingGrid(entity);

            entities.unregisterPosition(entity);
            entities.registerPosition(entity);
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
