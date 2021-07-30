import type Player from './player';

// TODO - Actually write a good trading system.

export default class Trade {
    public oPlayer: Player;

    public constructor(private player: Player) {
        this.oPlayer = null!;
    }
}
