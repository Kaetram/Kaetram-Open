import Equipment from './equipment';

export default class Pendant extends Equipment {
    constructor(name, string, count, ability, abilityLevel, power) {
        super(name, string, count, ability, abilityLevel, power);
    }
}
