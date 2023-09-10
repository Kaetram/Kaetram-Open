import Menu from './menu';

import log from '../lib/log';

import { Modules } from '@kaetram/common/network';

export default class Warp extends Menu {
    public override identifier: number = Modules.Interfaces.Warp;

    private list: NodeListOf<HTMLElement> = document.querySelectorAll('.map-button')!;

    private selectCallback?: (id: number) => void;

    public constructor() {
        super('#map-frame', '#close-map-frame', '#warp-button');

        for (let element of this.list)
            element.addEventListener('click', () => this.handleWarp(element));
    }

    /**
     * Handles the interaction when a warp element is clicked.
     * Extracts the id of the warp button, and sends a packet
     * to the server containing the id.
     * @param element Which warp button is being clicked.
     */

    private handleWarp(element: HTMLElement): void {
        let id = parseInt(element.id.replace('warp', ''));

        if (isNaN(id)) return log.error('Invalid warp element clicked.');

        this.selectCallback?.(id);

        this.hide();
    }

    /**
     * Callback for when the warp is clicked.
     * @param callback Contains the id of the warp.
     */

    public onSelect(callback: (id: number) => void): void {
        this.selectCallback = callback;
    }
}
