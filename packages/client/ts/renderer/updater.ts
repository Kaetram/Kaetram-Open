import Character from '../entity/character/character';
import Modules from '../utils/modules';
import Game from '../game';
import Renderer from './renderer';
import Map from '../map/map';
import InputController from '../controllers/input';
import SpritesController from '../controllers/sprites';
import Player from '../entity/character/player/player';
import Projectile from '../entity/objects/projectile';

export default class Updater {
    game: Game;
    map: Map;
    player: any;
    renderer: Renderer;
    input: InputController;
    sprites: SpritesController;
    timeDifferential: number;
    lastUpdate: Date;

    constructor(game: Game) {
        this.game = game;
        this.map = game.map;
        this.player = game.player;
        this.renderer = game.renderer;
        this.input = game.input;
        this.sprites = null;
    }

    update(): void {
        this.timeDifferential = (new Date().getTime() - this.lastUpdate?.getTime()) / 1000;

        this.updateEntities();
        this.input.updateCursor();
        this.updateKeyboard();
        this.updateAnimations();
        this.updateInfos();
        this.updateBubbles();

        this.lastUpdate = new Date();
    }

    updateEntities() {
        this.game.entities.forEachEntity((entity) => {
            if (!entity) return;

            if (entity.spriteLoaded) {
                this.updateFading(entity);

                const animation = entity.currentAnimation;

                if (animation) animation.update(this.game.time);

                if (entity instanceof Character) {
                    if (entity.movement && entity.movement.inProgress)
                        entity.movement.step(this.game.time);

                    if (entity.hasPath() && !entity.movement.inProgress) {
                        switch (entity.orientation) {
                            case Modules.Orientation.Left:
                            case Modules.Orientation.Right: {
                                const isLeft = entity.orientation === Modules.Orientation.Left;

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
                                const isUp = entity.orientation === Modules.Orientation.Up;

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
                    }
                } else if (entity.type === 'projectile') {
                    const projectile = entity as Projectile;
                    const mDistance = projectile.speed * this.timeDifferential;
                    const dx = projectile.destX - entity.x;
                    const dy = projectile.destY - entity.y;
                    const tDistance = Math.sqrt(dx * dx + dy * dy);
                    let amount = mDistance / tDistance;

                    if (amount > 1) amount = 1;

                    entity.x += dx * amount;
                    entity.y += dy * amount;

                    if (tDistance < 5) projectile.impact();
                }
            }
        });
    }

    updateFading(entity) {
        if (!entity || !entity.fading) return;

        const duration = 1000,
            time = this.game.time,
            dt = time - entity.fadingTime;

        if (dt > duration) {
            entity.isFading = false;
            entity.fadingAlpha = 1;
        } else entity.fadingAlpha = dt / duration;
    }

    updateKeyboard() {
        const player = this.game.player,
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

    updateAnimations() {
        const target = this.input.targetAnimation;

        if (target && this.input.selectedCellVisible) target.update(this.game.time);

        if (!this.sprites) return;

        const sparks = this.sprites.sparksAnimation;

        if (sparks) sparks.update(this.game.time);
    }

    updateInfos() {
        if (this.game.info) this.game.info.update(this.game.time);
    }

    updateBubbles() {
        if (this.game.bubble) this.game.bubble.update(this.game.time);

        if (this.game.pointer) this.game.pointer.update();
    }

    setSprites(sprites) {
        this.sprites = sprites;
    }
}
