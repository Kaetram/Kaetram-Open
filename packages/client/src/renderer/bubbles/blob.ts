import $ from 'jquery';

import Timer from '../../utils/timer';

import type Entity from '../../entity/entity';

export default class Blob {
    private timer;
    public type!: string;

    public constructor(
        public id: string,
        public element: JQuery,
        duration = 5000,
        isObject?: boolean,
        public info?: Entity
    ) {
        this.timer = new Timer(Date.now(), duration);

        if (isObject) this.type = 'object';
    }

    public isOver(time: number): boolean {
        return this.timer.isOver(time);
    }

    public reset(time: number): void {
        this.timer.time = time;
    }

    public destroy(): void {
        $(this.element).remove();
    }
}
