import $ from 'jquery';
import Pointer from '../renderer/pointers/pointer';
import Modules from '../utils/modules';
import _ from 'underscore';

export default class Pointers {
    game: any;
    pointers: { [key: string]: any };
    scale: any;
    container: JQuery<HTMLElement>;
    camera: any;
    constructor(game) {
        this.game = game;
        this.pointers = {};

        this.scale = this.getScale();

        this.container = $('#bubbles');
    }

    create(id, type, name) {
        if (id in this.pointers) return;

        switch (type) {
            case Modules.Pointers.Button:
                this.pointers[id] = new Pointer(id, $('#' + name), type);

                break;

            default:
                const element = $(
                    '<div id="' + id + '" class="pointer"></div>'
                );

                this.setSize(element);

                this.container.append(element);

                this.pointers[id] = new Pointer(id, element, type);

                break;
        }
    }

    resize() {
        _.each(this.pointers, function(pointer) {
            switch (pointer.type) {
                case Modules.Pointers.Relative:
                    const scale = this.getScale();
                    const x = pointer.x;
                    const y = pointer.y;
                    const offsetX = 0;
                    const offsetY = 0;

                    pointer.element.css('left', x * scale - offsetX + 'px');
                    pointer.element.css('top', y * scale - offsetY + 'px');

                    break;
            }
        });
    }

    setSize(element) {
        element.css({
            width: 16 + 16 * this.scale + 'px',
            height: 16 + 16 * this.scale + 'px',
            margin: 'inherit',
            'margin-top': '-' + 6 * this.scale + 'px',
            top: 10 * this.scale + 'px',
            background: 'url("img/' + this.scale + '/pointer.png")'
        });
    }

    clean() {
        _.each(this.pointers, function(pointer) {
            pointer.destroy();
        });

        this.pointers = {};
    }

    destroy(pointer) {
        delete this.pointers[pointer.id];
        pointer.destroy();
    }

    set(pointer, posX, posY) {
        this.updateCamera();

        const tileSize = 48; // 16 * this.scale
        const x = (posX - this.camera.x) * this.scale;
        const width = parseInt(pointer.element.css('width') + 24);
        const offset = width / 2 - tileSize / 2;
        const y = (posY - this.camera.y) * this.scale - tileSize;
        const outX = x / this.game.renderer.canvasWidth;
        const outY = y / this.game.renderer.canvasHeight;

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
            pointer.element.css('left', x - offset + 'px');
            pointer.element.css('right', '');
            pointer.element.css('top', y + 'px');
            pointer.element.css('bottom', '');

            pointer.element.css('transform', '');
        }
    }

    setToEntity(entity) {
        const pointer = this.get(entity.id);

        if (!pointer) return;

        this.set(pointer, entity.x, entity.y);
    }

    setToPosition(id, x, y) {
        const pointer = this.get(id);

        if (!pointer) return;

        pointer.setPosition(x, y);

        this.set(pointer, x, y);
    }

    setRelative(id, x, y) {
        const pointer = this.get(id);

        if (!pointer) return;

        const scale = this.getScale();
        const offsetX = 0;
        const offsetY = 0;

        pointer.setPosition(x, y);

        pointer.element.css('left', x * scale - offsetX + 'px');
        pointer.element.css('top', y * scale - offsetY + 'px');
    }

    update() {
        _.each(this.pointers, function(pointer) {
            switch (pointer.type) {
                case Modules.Pointers.Entity:
                    const entity = this.game.entities.get(pointer.id);

                    if (entity) this.setToEntity(entity);
                    else this.destroy(pointer);

                    break;

                case Modules.Pointers.Position:
                    if (pointer.x !== -1 && pointer.y !== -1)
                        this.set(pointer, pointer.x, pointer.y);

                    break;
            }
        });
    }

    get(id) {
        if (id in this.pointers) return this.pointers[id];

        return null;
    }

    updateCamera() {
        this.camera = this.game.renderer.camera;
    }

    getScale() {
        return this.game.getScaleFactor(); // always 3
    }
};
