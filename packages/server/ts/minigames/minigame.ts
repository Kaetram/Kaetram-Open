/* global module */

class Minigame {
    id: number;
    name: string;

    constructor(id: number, name: string) {
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
    getState(): any {
        return {
            id: this.id,
            name: this.name,
        };
    }
}

export default Minigame;
