import $ from 'underscore';
import Timer from '../../utils/timer';

export default class Blob {
    constructor(id, element, duration, isObject, info) {
        var self = this;

        self.id = id;
        self.element = element;
        self.duration = duration || 5000;

        self.time = new Date().getTime();
        self.timer = new Timer(self.time, self.duration);

        if (isObject) {
            self.type = 'object';
            self.info = info;
        }
    }

    isOver(time) {
        return this.timer.isOver(time);
    }

    reset(time) {
        this.timer.time = time;
    }

    destroy() {
        $(this.element).remove();
    }
}
