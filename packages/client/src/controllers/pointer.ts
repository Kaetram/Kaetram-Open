import $ from 'jquery';
import _ from 'lodash';

import { Modules } from '@kaetram/common/network';

import Pointer from '../renderer/pointers/pointer';

import type Entity from '../entity/entity';
import type Game from '../game';
import type Camera from '../renderer/camera';

export default class PointerController {
    private pointers: { [id: string]: Pointer } = {};

    private scale;

    private container = $('#bubbles');

    private camera?: Camera | null;

    public constructor(private game: Game) {
        this.scale = this.getScale();
    }

    public create(id: string, type: Modules.Pointers, name?: string): void {
        let { pointers, container } = this;

        if (id in pointers) return;

        switch (type) {
            case Modules.Pointers.Button:
                pointers[id] = new Pointer(id, $(`#${name}`), type);

                break;

            default: {
                let element = $(`<div id="${id}" class="pointer"></div>`);

                this.setSize(element);

                container.append(element);

                pointers[id] = new Pointer(id, element, type);

                break;
            }
        }
    }

    public resize(): void {
        _.each(this.pointers, ({ type, x, y, element }) => {
            switch (type) {
                case Modules.Pointers.Relative: {
                    let scale = this.getScale(),
                        offsetX = 0,
                        offsetY = 0;

                    element.css({
                        left: `${x * scale - offsetX}px`,
                        top: `${y * scale - offsetY}px`
                    });

                    break;
                }
            }
        });
    }

    private setSize(element: JQuery): void {
        let pointer = '/img/sprites/pointer.png';

        element.css({
            top: '30px',
            width: '64px',
            height: '64px',
            margin: 'inherit',
            marginTop: '-18px',
            background: `url("${pointer}")`
        });
    }

    public clean(): void {
        _.each(this.pointers, (pointer) => pointer.destroy());

        this.pointers = {};
    }

    private destroy(pointer: Pointer): void {
        delete this.pointers[pointer.id];
        pointer.destroy();
    }

    private set(pointer: Pointer, posX: number, posY: number): void {
        this.updateCamera();

        let { camera, game, scale } = this;

        if (!camera) return;

        let { element } = pointer,
            { canvasWidth, canvasHeight } = game.renderer,
            tileSize = 48, // 16 * scale
            x = (posX - camera.x) * scale,
            width = parseInt(element.css('width') + 24),
            offset = width / 2 - tileSize / 2,
            y = (posY - camera.y) * scale - tileSize,
            outX = x / canvasWidth,
            outY = y / canvasHeight;

        if (outX >= 1.5)
            // Right
            element.css({
                left: '',
                right: 0,
                top: '50%',
                bottom: '',
                transform: 'rotate(-90deg)'
            });
        else if (outY >= 1.5)
            // Bottom
            element.css({
                left: '50%',
                right: '',
                top: '',
                bottom: 0,
                transform: ''
            });
        else if (outX <= 0)
            // Left
            element.css({
                left: 0,
                right: '',
                top: '50%',
                bottom: '',
                transform: 'rotate(90deg)'
            });
        else if (outY <= 0)
            // Top
            element.css({
                left: '',
                right: '50%',
                top: 0,
                bottom: '',
                transform: 'rotate(180deg)'
            });
        else
            element.css({
                left: `${x - offset}px`,
                right: '',
                top: `${y}px`,
                bottom: '',
                transform: ''
            });
    }

    public setToEntity(entity: Entity): void {
        let pointer = this.get(entity.id);

        if (!pointer) return;

        this.set(pointer, entity.x, entity.y);
    }

    public setToPosition(id: string, x: number, y: number): void {
        let pointer = this.get(id);

        if (!pointer) return;

        pointer.setPosition(x, y);

        this.set(pointer, x, y);
    }

    public setRelative(id: string, x: number, y: number): void {
        let pointer = this.get(id);

        if (!pointer) return;

        let scale = this.getScale(),
            offsetX = 0,
            offsetY = 0;

        pointer.setPosition(x, y);

        pointer.element.css({
            left: `${x * scale - offsetX}px`,
            top: `${y * scale - offsetY}px`
        });
    }

    public update(): void {
        _.each(this.pointers, (pointer) => {
            switch (pointer.type) {
                case Modules.Pointers.Entity: {
                    let entity = this.game.entities.get(pointer.id);

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

    private get(id: string): Pointer | null {
        let { pointers } = this;

        if (id in pointers) return pointers[id];

        return null;
    }

    private updateCamera(): void {
        this.camera = this.game.renderer.camera;
    }

    private getScale(): number {
        return this.game.getScaleFactor();
    }
}
