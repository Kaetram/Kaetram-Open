import Timer from '../../utils/timer';

export default class Blob {
    id: string;
    element: JQuery<HTMLElement>;
    duration: number;
    time: number;
    timer: Timer;
    type: string;
    info: string;

    constructor(
        id: string,
        element: JQuery<HTMLElement>,
        duration: number,
        isObject: boolean,
        info: string
    ) {
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

    isOver(time: number) {
        return this.timer.isOver(time);
    }

    reset(time: number) {
        this.timer.time = time;
    }

    destroy() {
        $(this.element).remove();
    }
}
