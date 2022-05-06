/**
 * An abstract class for creating a system used to manage points.
 */

export default abstract class Points {
    public points: number;
    public maxPoints: number;

    protected constructor(points: number, maxPoints: number) {
        this.points = points;
        this.maxPoints = maxPoints;
    }

    /**
     * Increments the points by the specified `amount`.
     * @param amount How much to increment the points by.
     */

    protected increment(amount: number): void {
        this.setPoints(this.points + amount);
    }

    /**
     * Decrements the points by the specified `amount`.
     * @param amount How much to decrement the points by.
     */

    protected decrement(amount: number): void {
        this.setPoints(this.points - amount);
    }

    /**
     * Updates the points based on the specified `info`.
     * @param info The info to update the points with.
     */

    protected updatePoints(info: number[]): void {
        if (info.length === 0) return;

        let points = info.shift(),
            maxPoints = info.shift() || points;

        this.setMaxPoints(maxPoints as number);
        this.setPoints(points as number);
    }

    /**
     * Sets the points to the specified `points`.
     * @param points The value to set to.
     */

    protected setPoints(points: number): void {
        this.points = points;

        if (this.points >= this.maxPoints) this.points = this.maxPoints;
        if (this.points < 0) this.points = 0;
    }

    /**
     * Sets the maximum points to the specified `maxPoints`.
     * @param maxPoints The value to set to.
     */

    protected setMaxPoints(maxPoints: number): void {
        this.maxPoints = maxPoints;
    }

    /**
     * Resets the current points to the maximum points.
     */

    public reset(): void {
        this.setPoints(this.maxPoints);
    }

    /**
     * Returns wheather or not the points are at the maximum points.
     * @returns `true` if the points are at the maximum points.
     */

    public isFull(): boolean {
        return this.points >= this.maxPoints;
    }

    /**
     * Returns whether or not the points are empty.
     * @returns `true` if there are no points.
     */

    public isEmpty(): boolean {
        return this.points <= 0;
    }

    /**
     * @returns A serialized version of the points.
     */

    public serialize(): number[] {
        return [this.points, this.maxPoints];
    }
}
