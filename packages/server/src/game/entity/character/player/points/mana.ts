import Points from './points';

export default class Mana extends Points {
    manaCallback?(): void;
    maxManaCallback?(): void;

    public constructor(mana: number, maxMana: number) {
        super(mana, maxMana);
    }

    setMana(mana: number): void {
        this.points = mana;

        this.manaCallback?.();
    }

    setMaxMana(maxMana: number): void {
        this.maxPoints = maxMana;

        this.maxManaCallback?.();
    }

    getMana(): number {
        return this.points;
    }

    getMaxMana(): number {
        return this.maxPoints;
    }

    onMana(callback: () => void): void {
        this.manaCallback = callback;
    }

    onMaxMana(callback: () => void): void {
        this.maxManaCallback = callback;
    }
}
