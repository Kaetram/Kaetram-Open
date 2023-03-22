import Points from './points';

export default class Mana extends Points {
    private manaCallback?: () => void;

    public constructor(mana: number, maxMana?: number) {
        super(mana, maxMana || mana);
    }

    public override increment(amount: number): void {
        super.increment(amount);

        this.manaCallback?.();
    }

    public override decrement(amount: number): void {
        super.decrement(amount);

        this.manaCallback?.();
    }

    public updateMana(mana: number, maxMana?: number): void {
        super.updatePoints(mana, maxMana);
    }

    public setMana(mana: number): void {
        super.setPoints(mana);

        this.manaCallback?.();
    }

    public setMaxMana(maxMana: number): void {
        super.setMaxPoints(maxMana);
    }

    public getMana(): number {
        return this.points;
    }

    public getMaxMana(): number {
        return this.maxPoints;
    }

    public onMana(callback: () => void): void {
        this.manaCallback = callback;
    }
}
