/* global module */

class Minigame {
    constructor(id, name) {
        const self = this;

        self.id = id;
        self.name = name;
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }
}

module.exports = Minigame;
