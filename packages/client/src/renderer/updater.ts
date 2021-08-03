import { Modules } from '@kaetram/common/network';

import Character from '../entity/character/character';
import Projectile from '../entity/objects/projectile';

import type SpritesController from '../controllers/sprites';
import type Entity from '../entity/entity';
import type Game from '../game';

export default class Updater {
    private input;

    private sprites: SpritesController | null = null;

    private timeDifferential!: number;
    private lastUpdate!: Date;

    public constructor(private game: Game) {
        this.input = game.input;
    }

    public update(): void {
        this.timeDifferential = (Date.now() - this.lastUpdate?.getTime()) / 1000;

        this.updateEntities();
        this.input.updateCursor();
        this.updateKeyboard();
        this.updateAnimations();
        this.updateInfos();
        this.updateBubbles();

        this.lastUpdate = new Date();
    }

    private updateEntities(): void {
        this.game.entities.forEachEntity((entity) => {
            if (!entity) return;

            if (entity.spriteLoaded) {
                this.updateFading(entity);

                let animation = entity.currentAnimation;

                animation?.update(this.game.time);

                if (entity instanceof Character) {
                    if (entity.movement?.inProgress) entity.movement.step(this.game.time);

                    if (entity.hasPath() && !entity.movement.inProgress)
                        switch (entity.orientation) {
                            case Modules.Orientation.Left:
                            case Modules.Orientation.Right: {
                                let isLeft = entity.orientation === Modules.Orientation.Left;

                                entity.movement.start(
                                    this.game.time,
                                    (x) => {
                                        entity.x = x;
                                        entity.moved();
                                    },
                                    () => {
                                        entity.x = entity.movement.endValue;
                                        entity.moved();
                                        entity.nextStep();
                                    },
                                    entity.x + (isLeft ? -1 : 1),
                                    entity.x + (isLeft ? -16 : 16),
                                    entity.movementSpeed
                                );

                                break;
                            }

                            case Modules.Orientation.Up:
                            case Modules.Orientation.Down: {
                                let isUp = entity.orientation === Modules.Orientation.Up;

                                entity.movement.start(
                                    this.game.time,
                                    (y) => {
                                        entity.y = y;
                                        entity.moved();
                                    },
                                    () => {
                                        entity.y = entity.movement.endValue;
                                        entity.moved();
                                        entity.nextStep();
                                    },
                                    entity.y + (isUp ? -1 : 1),
                                    entity.y + (isUp ? -16 : 16),
                                    entity.movementSpeed
                                );

                                break;
                            }
                        }
                } else if (entity instanceof Projectile) {
                    let projectile = entity,
                        mDistance = projectile.speed * this.timeDifferential,
                        dx = projectile.target.x - entity.x,
                        dy = projectile.target.y - entity.y,
                        tDistance = Math.sqrt(dx * dx + dy * dy),
                        amount = mDistance / tDistance;

                    projectile.updateAngle();

                    if (amount > 1) amount = 1;

                    entity.x += dx * amount;
                    entity.y += dy * amount;

                    if (tDistance < 5) projectile.impact();
                }
            }
        });
    }

    private updateFading(entity: Entity): void {
        if (!entity || !entity.fading) return;

        let { time } = this.game,
            dt = time - entity.fadingTime;

        if (dt > entity.fadingDuration) {
            entity.fading = false;
            entity.fadingAlpha = 1;
        } else entity.fadingAlpha = dt / entity.fadingDuration;
    }

    private updateKeyboard(): void {
        let { player } = this.game,
            position = {
                x: player.gridX,
                y: player.gridY
            };

        if (player.frozen) return;

        if (player.moveUp) position.y--;
        else if (player.moveDown) position.y++;
        else if (player.moveRight) position.x++;
        else if (player.moveLeft) position.x--;

        if (player.hasKeyboardMovement()) this.input.keyMove(position);
    }

    private updateAnimations(): void {
        let target = this.input.targetAnimation;

        if (target && this.input.selectedCellVisible) target.update(this.game.time);

        if (!this.sprites) return;

        let sparks = this.sprites.sparksAnimation;

        sparks?.update(this.game.time);
    }

    private updateInfos(): void {
        this.game.info.update(this.game.time);
    }

    private updateBubbles(): void {
        this.game.bubble?.update(this.game.time);

        this.game.pointer?.update();
    }

    public setSprites(sprites: SpritesController): void {
        this.sprites = sprites;
    }
}
