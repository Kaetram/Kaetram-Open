import $ from 'jquery';

import Timer from '../../utils/timer';

import type Entity from '../../entity/entity';

export default class Blob {
    private timer = new Timer(Date.now(), this.duration);

    public type!: string;

    public constructor(
        public id: string,
        public element: JQuery,
        private duration = 5000,
        isObject?: boolean,
        public info?: Entity
    ) {
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
