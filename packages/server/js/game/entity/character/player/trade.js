/* global module */

let Modules = require('../../../../util/modules');

class Trade {
    
    constructor(player) {
        let self = this;
        
        self.player = player;
        self.oPlayer = null;
        
        self.requestee = null;
        
        self.state = null;
        self.subState = null;
        
        self.playerItems = [];
        self.oPlayerItems = [];
    }

    start() {
        let self = this;

        self.oPlayer = self.requestee;
        self.state = Modules.Trade.Started;
    }

    stop() {
        let self = this;

        self.oPlayer = null;
        self.state = null;
        self.subState = null;
        self.requestee = null;

        self.playerItems = [];
        self.oPlayerItems = [];
    }

    finalize() {
        let self = this;

        if (!self.player.inventory.containsSpaces(self.oPlayerItems.length))
            return;

        for (let i in self.oPlayerItems) {
            let item = self.oPlayerItems[i];

            if (!item || item.id === -1)
                continue;

            self.oPlayer.inventory.remove(item.id, item.count, item.index);
            self.player.inventory.add(item);
        }
    }

    select(slot) {
        let self = this,
            item = self.player.inventory.slots[slot];

        if (!item || item.id === -1 || self.playerItems.indexOf(item) < 0)
            return;

        self.playerItems.push(item);
    }

    request(oPlayer) {
        let self = this;

        self.requestee = oPlayer;

        if (oPlayer.trade.getRequestee() === self.player.instance)
            self.start();


    }

    accept() {
        let self = this;

        self.subState = Modules.Trade.Accepted;

        if (self.oPlayer.trade.subState === Modules.Trade.Accepted) {
            self.finalize();
            self.oPlayer.trade.finalize();
        }
    }

    getRequestee() {
        let self = this;

        if (!self.requestee)
            return null;

        return self.requestee.instance;
    }

    decline() {
        this.stop();
    }

    isStarted() {
        return this.state !== null;
    }
    
}

module.exports = Trade;