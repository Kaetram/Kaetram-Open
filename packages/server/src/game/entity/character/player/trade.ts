import Player from './player';

// TODO - Actually write a good trading system.

export default class Trade {
    public player: Player;
    public oPlayer: Player;

    constructor(player: Player) {
        this.player = player;
        this.oPlayer = null!;
    }
}
