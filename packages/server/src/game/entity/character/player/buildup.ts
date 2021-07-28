import Messages from '../../../../network/messages';

import type Player from './player';

export default class BuildUp {
    // private effects = {};

    constructor(private player: Player) {}

    // process() {}

    send(opcode: number, info: never): void {
        this.player.send(new Messages.BuildUp(opcode, info));
    }
}
