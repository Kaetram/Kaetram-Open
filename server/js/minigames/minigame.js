/* global module */

class Minigame {

    constructor(id, name) {
        let self = this;

        self.id = id;
        self.name = name;
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

	// Used to mark if `player` is in a minigame instance.
	getState() {
		return {
			id: this.id,
			name: this.name
		}
	}
}

module.exports = Minigame;
