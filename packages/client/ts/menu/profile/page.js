import $ from 'jquery';

export default class Page {
    constructor(element) {
        this.body = $(element);

        this.loaded = false;
    }

    show() {
        this.body.fadeIn('slow');
    }

    hide() {
        this.body.fadeOut('slow');
    }

    isVisible() {
        return this.body.css('display') === 'block';
    }

    load() {
        //log.info('Uninitialized.');
    }

    resize() {
        //log.info('Uninitialized.');
    }

    update() {
        //log.info('Uninitialized.');
    }

    getImageFormat(name) {
        return 'url("img/sprites/item-' + name + '.png")';
    }
}
