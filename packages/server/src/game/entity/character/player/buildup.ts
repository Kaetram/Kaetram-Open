import Messages from '../../../../network/messages';

import type Player from './player';

export default class BuildUp {
    // private effects = {};

    public constructor(private player: Player) {}

    // process() {}

    private send(opcode: number, info: never): void {
        this.player.send(new Messages.BuildUp(opcode, info));
    }
}
