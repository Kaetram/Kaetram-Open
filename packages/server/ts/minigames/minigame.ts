/* global module */

class Minigame {

    constructor(id, name) {
        this.id = id;
        this.name = name;
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

export default Minigame;
