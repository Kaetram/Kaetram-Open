import $ from 'jquery';
import _ from 'underscore';
import Pointer from '../renderer/pointers/pointer';
import Modules from '../utils/modules';

export default class PointerController {
    constructor(game) {
        var self = this;

        self.game = game;
        self.pointers = {};

        self.scale = self.getScale();

        self.container = $('#bubbles');
    }

    create(id, type, name) {
        var self = this;

        if (id in self.pointers) return;

        switch (type) {
            case Modules.Pointers.Button:
                self.pointers[id] = new Pointer(id, $('#' + name), type);

                break;

            default:
                var element = $('<div id="' + id + '" class="pointer"></div>');

                self.setSize(element);

                self.container.append(element);

                self.pointers[id] = new Pointer(id, element, type);

                break;
        }
    }

    resize() {
        var self = this;

        _.each(self.pointers, function(pointer) {
            switch (pointer.type) {
                case Modules.Pointers.Relative:
                    var scale = self.getScale(),
                        x = pointer.x,
                        y = pointer.y,
                        offsetX = 0,
                        offsetY = 0;

                    pointer.element.css('left', x * scale - offsetX + 'px');
                    pointer.element.css('top', y * scale - offsetY + 'px');

                    break;
            }
        });
    }

    setSize(element) {
        var self = this;

        element.css({
            width: '64px',
            height: '64px',
            margin: 'inherit',
            'margin-top': '-18px',
            top: '30px',
            background: 'url("img/sprites/pointer.png")',
        });
    }

    clean() {
        var self = this;

        _.each(self.pointers, function(pointer) {
            pointer.destroy();
        });

        self.pointers = {};
    }

    destroy(pointer) {
        var self = this;

        delete self.pointers[pointer.id];
        pointer.destroy();
    }

    set(pointer, posX, posY) {
        var self = this;

        self.updateCamera();

        var tileSize = 48, //16 * self.scale
            x = (posX - self.camera.x) * self.scale,
            width = parseInt(pointer.element.css('width') + 24),
            offset = width / 2 - tileSize / 2,
            y,
            outX,
            outY;

        y = (posY - self.camera.y) * self.scale - tileSize;

        outX = x / self.game.renderer.canvasWidth;
        outY = y / self.game.renderer.canvasHeight;

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
        var self = this,
            pointer = self.get(entity.id);

        if (!pointer) return;

        self.set(pointer, entity.x, entity.y);
    }

    setToPosition(id, x, y) {
        var self = this,
            pointer = self.get(id);

        if (!pointer) return;

        pointer.setPosition(x, y);

        self.set(pointer, x, y);
    }

    setRelative(id, x, y) {
        var self = this,
            pointer = self.get(id);

        if (!pointer) return;

        var scale = self.getScale(),
            offsetX = 0,
            offsetY = 0;

        pointer.setPosition(x, y);

        pointer.element.css('left', x * scale - offsetX + 'px');
        pointer.element.css('top', y * scale - offsetY + 'px');
    }

    update() {
        var self = this;

        _.each(self.pointers, function(pointer) {
            switch (pointer.type) {
                case Modules.Pointers.Entity:
                    var entity = self.game.entities.get(pointer.id);

                    if (entity) self.setToEntity(entity);
                    else self.destroy(pointer);

                    break;

                case Modules.Pointers.Position:
                    if (pointer.x !== -1 && pointer.y !== -1)
                        self.set(pointer, pointer.x, pointer.y);

                    break;
            }
        });
    }

    get(id) {
        var self = this;

        if (id in self.pointers) return self.pointers[id];

        return null;
    }

    updateCamera() {
        this.camera = this.game.renderer.camera;
    }

    getScale() {
        return this.game.getScaleFactor(); //always 3
    }
}
