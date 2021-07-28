export interface MinigameState {
    id: number;
    name: string;
}

export default abstract class Minigame {
    id: number;
    name: string;

    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }

    getId(): number {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    // Used to mark if `player` is in a minigame instance.
    getState(): MinigameState | null {
        return {
            id: this.id,
            name: this.name
        };
    }
}
