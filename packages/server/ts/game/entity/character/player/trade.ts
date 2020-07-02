/* global module */

import Player from './player';

// TODO - Actually write a good trading system.

class Trade {

    public player: Player;
    public oPlayer: Player;


    constructor(player: Player) {
        this.player = player;
        this.oPlayer = null;

    }


}

export default Trade;
