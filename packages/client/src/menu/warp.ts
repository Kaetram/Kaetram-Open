import _ from 'lodash-es';
import { Packets } from '@kaetram/common/network';

import log from '../lib/log';

import Menu from './menu';

import type Socket from '../network/socket';

export default class Warp extends Menu {
    private list: NodeListOf<HTMLElement> = document.querySelectorAll('.map-button')!;

    public constructor(private socket: Socket) {
        super('#map-frame', '#close-map-frame', '#warp-button');

        _.each(this.list, (element: HTMLElement) =>
            element.addEventListener('click', () => this.handleWarp(element))
        );
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

        this.socket.send(Packets.Warp, {
            id
        });

        this.hide();
    }
}
