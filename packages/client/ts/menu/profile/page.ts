import $ from 'jquery';

export default class Page {
    body: JQuery;
    loaded: boolean;

    constructor(element: string) {
        this.body = $(element);

        this.loaded = false;
    }

    show(): void {
        this.body.fadeIn('slow');
    }

    hide(): void {
        this.body.fadeOut('slow');
    }

    isVisible(): boolean {
        return this.body.css('display') === 'block';
    }

    async getImageFormat(name: string): Promise<string> {
        return `url("${(await import(`../../../img/sprites/item-${name}.png`)).default}")`;
    }
}
