import Arrow from '../renderer/pointers/arrow';

import { Opcodes } from '@kaetram/common/network';

import type Entity from '../entity/entity';
import type Game from '../game';
import type Camera from '../renderer/camera';

export default class PointerController {
    private camera: Camera;

    private pointers: { [id: string]: Arrow } = {};

    private container: HTMLElement = document.querySelector('#bubbles')!;

    public constructor(private game: Game) {
        this.camera = this.game.camera;
    }

    public create(id: string, type: Opcodes.Pointer, name?: string): void {
        let { pointers, container } = this;

        if (id in pointers) return;

        switch (type) {
            case Opcodes.Pointer.Button: {
                let element = document.createElement('div');

                element.id = name!;

                pointers[id] = new Arrow(id, element, type);

                break;
            }

            default: {
                let element = document.createElement('div');

                element.id = id;
                element.className = 'pointer';

                this.setSize(element);

                container.append(element);

                pointers[id] = new Arrow(id, element, type);

                break;
            }
        }
    }

    public resize(): void {
        for (let { type, x, y, element } of Object.values(this.pointers))
            switch (type) {
                case Opcodes.Pointer.Relative: {
                    let scale = this.getZoom(),
                        offsetX = 0,
                        offsetY = 0;

                    element.style.left = `${x * scale - offsetX}px`;
                    element.style.top = `${y * scale - offsetY}px`;

                    break;
                }
            }
    }

    private setSize(element: HTMLElement): void {
        let pointer = '/img/pointer.png';

        element.style.top = '30px';
        element.style.width = '64px';
        element.style.height = '64px';
        element.style.margin = 'inherit';
        element.style.marginTop = '-18px';
        element.style.background = `url("${pointer}") no-repeat -4px`;
    }

    public clean(): void {
        for (let pointer of Object.values(this.pointers)) pointer.destroy();

        this.pointers = {};
    }

    private destroy(pointer: Arrow): void {
        delete this.pointers[pointer.id];
        pointer.destroy();
    }

    private set(pointer: Arrow, posX: number, posY: number): void {
        let { camera, game } = this;

        if (!camera) return;

        let { element } = pointer,
            { canvasWidth, canvasHeight } = game.renderer,
            tileSize = game.map.tileSize * this.getZoom(), // 16 * scale
            x = (posX - camera.x) * this.getZoom(),
            width = parseInt(element.style.width),
            offset = width / 2 - tileSize / 2,
            y = (posY - camera.y) * this.getZoom() - tileSize,
            outX = x / canvasWidth,
            outY = y / canvasHeight;

        if (outX >= 1.5) {
            element.style.left = '';
            element.style.right = '0';
            element.style.top = '50%';
            element.style.bottom = '';
            element.style.transform = 'rotate(-90deg)';
        } else if (outY >= 1.5) {
            element.style.left = '';
            element.style.right = '0';
            element.style.top = '50%';
            element.style.bottom = '';
            element.style.transform = 'rotate(-90deg)';
        } else if (outX <= 0) {
            element.style.left = '0';
            element.style.right = '';
            element.style.top = '50%';
            element.style.bottom = '';
            element.style.transform = 'rotate(90deg)';
        } else if (outY <= 0) {
            element.style.left = '';
            element.style.right = '50%';
            element.style.top = '0';
            element.style.bottom = '';
            element.style.transform = 'rotate(180deg)';
        } else {
            element.style.left = `${x - offset}px`;
            element.style.right = '';
            element.style.top = `${y}px`;
            element.style.bottom = '';
            element.style.transform = '';
        }
    }

    public setToEntity(entity: Entity): void {
        let pointer = this.get(entity.instance);

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

        let scale = this.getZoom(),
            offsetX = 0,
            offsetY = 0;

        pointer.setPosition(x, y);

        pointer.element.style.left = `${x * scale - offsetX}px`;
        pointer.element.style.top = `${y * scale - offsetY}px`;
    }

    public update(): void {
        for (let pointer of Object.values(this.pointers))
            switch (pointer.type) {
                case Opcodes.Pointer.Entity: {
                    let entity = this.game.entities.get(pointer.id);

                    if (entity) this.setToEntity(entity);
                    else this.destroy(pointer);

                    break;
                }

                case Opcodes.Pointer.Location: {
                    if (pointer.x !== -1 && pointer.y !== -1)
                        this.set(pointer, pointer.x, pointer.y);

                    break;
                }
            }
    }

    private get(id: string): Arrow | null {
        let { pointers } = this;

        if (id in pointers) return pointers[id];

        return null;
    }

    private getZoom(): number {
        return this.game.camera.zoomFactor;
    }
}
