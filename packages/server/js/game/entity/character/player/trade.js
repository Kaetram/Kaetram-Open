/* global module */

let Modules = require('../../../../util/modules');

class Trade {

    constructor(player) {
        this.player = player;
        this.oPlayer = null;

        this.requestee = null;

        this.state = null;
        this.subState = null;

        this.playerItems = [];
        this.oPlayerItems = [];
    }

    start() {
        this.oPlayer = this.requestee;
        this.state = Modules.Trade.Started;
    }

    stop() {
        this.oPlayer = null;
        this.state = null;
        this.subState = null;
        this.requestee = null;

        this.playerItems = [];
        this.oPlayerItems = [];
    }

    finalize() {
        if (!this.player.inventory.containsSpaces(this.oPlayerItems.length))
            return;

        for (let i in this.oPlayerItems) {
            let item = this.oPlayerItems[i];

            if (!item || item.id === -1)
                continue;

            this.oPlayer.inventory.remove(item.id, item.count, item.index);
            this.player.inventory.add(item);
        }
    }

    select(slot) {
        let item = this.player.inventory.slots[slot];

        if (!item || item.id === -1 || this.playerItems.indexOf(item) < 0)
            return;

        this.playerItems.push(item);
    }

    request(oPlayer) {
        this.requestee = oPlayer;

        if (oPlayer.trade.getRequestee() === this.player.instance)
            this.start();


    }

    accept() {
        this.subState = Modules.Trade.Accepted;

        if (this.oPlayer.trade.subState === Modules.Trade.Accepted) {
            this.finalize();
            this.oPlayer.trade.finalize();
        }
    }

    getRequestee() {
        if (!this.requestee)
            return null;

        return this.requestee.instance;
    }

    decline() {
        this.stop();
    }

    isStarted() {
        return this.state !== null;
    }

}

module.exports = Trade;
