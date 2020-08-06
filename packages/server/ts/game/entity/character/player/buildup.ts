import Player from './player';
import Messages from '../../../../network/messages';

class BuildUp {
    private player: Player;
    private effects: any;

    constructor(player: Player) {
        this.player = player;

        this.effects = {}; // The buildup effects
    }

    process() {}

    send(opcode: number, info: any) {
        this.player.send(new Messages.BuildUp(opcode, info));
    }
}

export default BuildUp;
