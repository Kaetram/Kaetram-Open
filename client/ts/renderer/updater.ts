import Player from '../entity/character/player/player';

import Character from '../entity/character/character';
import Map from '../map/map';
import Modules from '../utils/modules';
import Input from '../controllers/input';
import Sprites from '../controllers/sprites';
import Renderer from './renderer';
import Game from '../game';

export default class Updater {
    map: Map;
    player: Player;
    renderer: Renderer;
    input: Input;
    sprites: Sprites;
    timeDifferential: number;
    lastUpdate: number;

    constructor(public game: Game) {
        this.game = game;
        this.map = game.map;
        this.player = game.player;
        this.renderer = game.renderer;
        this.input = game.input;
        this.sprites = null;
    }

    update() {
        this.timeDifferential = (new Date().getTime() - this.lastUpdate) / 1000;

        this.updateEntities();
        this.input.updateCursor();
        this.updateKeyboard();
        this.updateAnimations();
        this.updateInfos();
        this.updateBubbles();

        this.lastUpdate = new Date().getTime();
    }

    updateEntities() {
        this.game.entities.forEachEntity((entity) => {
            if (!entity) return;

            if (entity.spriteLoaded) {
                this.updateFading(entity);

                const animation = entity.currentAnimation;

                if (animation) animation.update(this.game.time);

                if (entity instanceof Character) {
                    if (entity.movement && entity.movement.inProgress) {
                        entity.movement.step(this.game.time);
                    }

                    if (entity.hasPath() && !entity.movement.inProgress) {
                        const tick = Math.round(266 / entity.movementSpeed);

                        switch (entity.orientation) {
                            case Modules.Orientation.Left:
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
                                    entity.x - tick,
                                    entity.x - 16,
                                    entity.movementSpeed
                                );

                                break;

                            case Modules.Orientation.Right:
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
                                    entity.x + tick,
                                    entity.x + 16,
                                    entity.movementSpeed
                                );

                                break;

                            case Modules.Orientation.Up:
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
                                    entity.y - tick,
                                    entity.y - 16,
                                    entity.movementSpeed
                                );

                                break;

                            case Modules.Orientation.Down:
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
                                    entity.y + tick,
                                    entity.y + 16,
                                    entity.movementSpeed
                                );

                                break;
                        }
                    }
                } else if (entity.type === 'projectile') {
                    const mDistance = entity.speed * this.timeDifferential;
                    const dx = entity.destX - entity.x;
                    const dy = entity.destY - entity.y;
                    const tDistance = Math.sqrt(dx * dx + dy * dy);
                    let amount = mDistance / tDistance;

                    if (amount > 1) amount = 1;

                    entity.x += dx * amount;
                    entity.y += dy * amount;

                    if (tDistance < 5) entity.impact();
                }
            }
        });
    }

    updateFading(entity) {
        if (!entity || !entity.fading) return;

        const duration = 1000;
        const { time } = this.game;
        const dt = time - entity.fadingTime;

        if (dt > duration) {
            entity.isFading = false;
            entity.fadingAlpha = 1;
        } else entity.fadingAlpha = dt / duration;
    }

    updateKeyboard() {
        const { player } = this.game;
        const position = {
            x: player.gridX,
            y: player.gridY,
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

        if (target && this.input.selectedCellVisible) {
            target.update(this.game.time);
        }

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
