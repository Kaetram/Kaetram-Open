import $ from 'jquery';
import _ from 'lodash';

import Entity from '../entity/entity';
import Game from '../game';
import Camera from '../renderer/camera';
import Pointer from '../renderer/pointers/pointer';
import Modules from '../utils/modules';

export default class PointerController {
    game: Game;
    pointers: { [key: string]: Pointer };
    scale: number;
    container: JQuery<HTMLElement>;
    camera: Camera;

    constructor(game: Game) {
        this.game = game;
        this.pointers = {};

        this.scale = this.getScale();

        this.container = $('#bubbles');
    }

    create(id: string, type: number, name?: string): void {
        if (id in this.pointers) return;

        switch (type) {
            case Modules.Pointers.Button:
                this.pointers[id] = new Pointer(id, $(`#${name}`), type);

                break;

            default: {
                const element = $(`<div id="${id}" class="pointer"></div>`);

                this.setSize(element);

                this.container.append(element);

                this.pointers[id] = new Pointer(id, element, type);

                break;
            }
        }
    }

    resize(): void {
        _.each(this.pointers, (pointer) => {
            switch (pointer.type) {
                case Modules.Pointers.Relative: {
                    const scale = this.getScale(),
                        x = pointer.x,
                        y = pointer.y,
                        offsetX = 0,
                        offsetY = 0;

                    pointer.element.css('left', `${x * scale - offsetX}px`);
                    pointer.element.css('top', `${y * scale - offsetY}px`);

                    break;
                }
            }
        });
    }

    async setSize(element: JQuery): Promise<void> {
        element.css({
            width: '64px',
            height: '64px',
            margin: 'inherit',
            'margin-top': '-18px',
            top: '30px',
            background: `url("${(await import(`${'../../img/sprites/pointer.png'}`)).default}")`
        });
    }

    clean(): void {
        _.each(this.pointers, (pointer) => {
            pointer.destroy();
        });

        this.pointers = {};
    }

    destroy(pointer: Pointer): void {
        delete this.pointers[pointer.id];
        pointer.destroy();
    }

    set(pointer: Pointer, posX: number, posY: number): void {
        this.updateCamera();

        const tileSize = 48, //16 * this.scale
            x = (posX - this.camera.x) * this.scale,
            width = parseInt(pointer.element.css('width') + 24),
            offset = width / 2 - tileSize / 2;

        const y = (posY - this.camera.y) * this.scale - tileSize;
        const outX = x / this.game.renderer.canvasWidth,
            outY = y / this.game.renderer.canvasHeight;

        if (outX >= 1.5) {
            // right
            pointer.element.css('left', '');
            pointer.element.css('right', '0');
            pointer.element.css('top', '50%');
            pointer.element.css('bottom', '');

            pointer.element.css('transform', 'rotate(-90deg)');
        } else if (outY >= 1.5) {
            // bottom

            pointer.element.css('left', '50%');
            pointer.element.css('right', '');
            pointer.element.css('top', '');
            pointer.element.css('bottom', '0');

            pointer.element.css('transform', '');
        } else if (outX <= 0) {
            // left

            pointer.element.css('left', '0');
            pointer.element.css('right', '');
            pointer.element.css('top', '50%');
            pointer.element.css('bottom', '');

            pointer.element.css('transform', 'rotate(90deg)');
        } else if (outY <= 0) {
            // top

            pointer.element.css('left', '');
            pointer.element.css('right', '50%');
            pointer.element.css('top', '0');
            pointer.element.css('bottom', '');

            pointer.element.css('transform', 'rotate(180deg)');
        } else {
            pointer.element.css('left', `${x - offset}px`);
            pointer.element.css('right', '');
            pointer.element.css('top', `${y}px`);
            pointer.element.css('bottom', '');

            pointer.element.css('transform', '');
        }
    }

    setToEntity(entity: Entity): void {
        const pointer = this.get(entity.id);

        if (!pointer) return;

        this.set(pointer, entity.x, entity.y);
    }

    setToPosition(id: string, x: number, y: number): void {
        const pointer = this.get(id);

        if (!pointer) return;

        pointer.setPosition(x, y);

        this.set(pointer, x, y);
    }

    setRelative(id: string, x: number, y: number): void {
        const pointer = this.get(id);

        if (!pointer) return;

        const scale = this.getScale(),
            offsetX = 0,
            offsetY = 0;

        pointer.setPosition(x, y);

        pointer.element.css('left', `${x * scale - offsetX}px`);
        pointer.element.css('top', `${y * scale - offsetY}px`);
    }

    update(): void {
        _.each(this.pointers, (pointer) => {
            switch (pointer.type) {
                case Modules.Pointers.Entity: {
                    const entity = this.game.entities.get(pointer.id);

                    if (entity) this.setToEntity(entity);
                    else this.destroy(pointer);

                    break;
                }

                case Modules.Pointers.Position:
                    if (pointer.x !== -1 && pointer.y !== -1)
                        this.set(pointer, pointer.x, pointer.y);

                    break;
            }
        });
    }

    get(id: string): Pointer {
        if (id in this.pointers) return this.pointers[id];

        return null;
    }

    updateCamera(): void {
        this.camera = this.game.renderer.camera;
    }

    getScale(): number {
        return this.game.getScaleFactor(); //always 3
    }
}
