import Messages from '../../../../network/messages';
import Player from './player';

export default class BuildUp {
    private player: Player;
    // private effects

    constructor(player: Player) {
        this.player = player;

        // this.effects = {}; // The buildup effects
    }

    // process() {}

    send(opcode: number, info: never): void {
        this.player.send(new Messages.BuildUp(opcode, info));
    }
}
