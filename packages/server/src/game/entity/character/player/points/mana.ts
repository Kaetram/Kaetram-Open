import Points from './points';

export default class Mana extends Points {
    manaCallback?(): void;
    maxManaCallback?(): void;

    constructor(mana: number, maxMana: number) {
        super(mana, maxMana);
    }

    setMana(mana: number): void {
        this.points = mana;

        if (this.manaCallback) this.manaCallback();
    }

    setMaxMana(maxMana: number): void {
        this.maxPoints = maxMana;

        if (this.maxManaCallback) this.maxManaCallback();
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
