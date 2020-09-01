import $ from 'jquery';
import Entity from '../../entity/entity';
import Timer from '../../utils/timer';

export default class Blob {
    id: string;
    element: JQuery;
    duration: number;
    time: number;
    timer: Timer;
    type: string;
    info: Entity;

    constructor(id: string, element: JQuery, duration: number, isObject: boolean, info: Entity) {
        this.id = id;
        this.element = element;
        this.duration = duration || 5000;

        this.time = new Date().getTime();
        this.timer = new Timer(this.time, this.duration);

        if (isObject) {
            this.type = 'object';
            this.info = info;
        }
    }

    isOver(time: number): boolean {
        return this.timer.isOver(time);
    }

    reset(time: number): void {
        this.timer.time = time;
    }

    destroy(): void {
        $(this.element).remove();
    }
}
