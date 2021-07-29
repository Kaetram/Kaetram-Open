export interface MinigameState {
    id: number;
    name: string;
}

export default abstract class Minigame {
    protected constructor(private id: number, private name: string) {}

    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    // Used to mark if `player` is in a minigame instance.
    protected getState(): MinigameState | null {
        return {
            id: this.id,
            name: this.name
        };
    }
}
