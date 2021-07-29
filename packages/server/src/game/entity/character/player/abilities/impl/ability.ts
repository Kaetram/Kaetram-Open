import Abilities from '../../../../../../util/abilities';

export default abstract class Ability {
    public level = -1;

    public data;

    protected constructor(public name: string, public type: number) {
        this.data = Abilities.Data[name];
    }

    private setLevel(level: number): void {
        this.level = level;
    }
}
