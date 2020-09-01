import Packets from '../network/packets';
import Game from '../game';
import EntitiesController from '../controllers/entities';
import Player from './character/player/player';
import Entity from './entity';

export default class EntityHandler {
    entity: Player;
    game: Game;
    entities: EntitiesController;

    constructor(entity: Entity) {
        this.entity = entity as Player;
        this.game = null;
        this.entities = null;
    }

    load(): void {
        if (!this.entity || !this.game) return;

        if (this.isCharacter()) {
            this.entity.onRequestPath((x, y) => {
                let ignores = [];

                if (this.entity.gridX === x && this.entity.gridY === y) return ignores;

                ignores = [this.entity];

                return this.game.findPath(this.entity, x, y, ignores);
            });

            this.entity.onBeforeStep(() => {
                this.entities.unregisterPosition(this.entity);
            });

            this.entity.onStep(() => {
                this.entities.registerDuality(this.entity);

                this.entity.forEachAttacker((attacker) => {
                    /**
                     * This is the client-sided logic for representing PVP
                     * fights. It basically adds another layer of movement
                     * so the entity is always following the player.
                     */

                    if (this.entity.type !== 'player') return;

                    if (attacker.type !== 'player') return;

                    if (!attacker.hasTarget()) return;

                    if (attacker.target.id !== this.entity.id) return;

                    if (attacker.stunned) return;

                    attacker.follow(this.entity);
                });

                if (this.entity.type === 'mob')
                    this.game.socket.send(Packets.Movement, [
                        Packets.MovementOpcode.Entity,
                        this.entity.id,
                        this.entity.gridX,
                        this.entity.gridY
                    ]);

                if (
                    this.entity.attackRange > 1 &&
                    this.entity.hasTarget() &&
                    this.entity.getDistance(this.entity.target) <= this.entity.attackRange
                )
                    this.entity.stop(false);
            });

            this.entity.onStopPathing(() => {
                this.entities.grids.addToRenderingGrid(
                    this.entity,
                    this.entity.gridX,
                    this.entity.gridY
                );

                this.entities.unregisterPosition(this.entity);
                this.entities.registerPosition(this.entity);
            });
        }
    }

    isCharacter(): boolean {
        return (
            this.entity.type &&
            (this.entity.type === 'player' ||
                this.entity.type === 'mob' ||
                this.entity.type === 'npc')
        );
    }

    setGame(game: Game): void {
        this.game ||= game;

        this.setEntities(this.game.entities);
    }

    setEntities(entities: EntitiesController): void {
        this.entities ||= entities;
    }
}
