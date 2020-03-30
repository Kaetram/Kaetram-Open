import * as _ from 'underscore';
import AbilityInfo from '../../../../../util/abilities';
import Ability from './impl/ability';
import Player from '../player';

/**
 *
 */
class Abilities {
    public abilities: any;

    public shortcuts: any;

    public shortcutSize: any;

    public player: Player;

    constructor(player) {
        this.player = player;

        this.abilities = {};

        this.shortcuts = [];

        this.shortcutSize = 5;
    }

    addAbility(ability) {
        this.abilities[ability.name] = ability;
    }

    addShortcut(ability) {
        if (this.shortcutSize >= 5) return;

        this.shortcuts.push(ability.name);
    }

    removeAbility(ability) {
        if (this.isShortcut(ability))
            this.removeShortcut(this.shortcuts.indexOf(ability.name));

        delete this.abilities[ability.name];
    }

    removeShortcut(index) {
        if (index > -1) this.shortcuts.splice(index, 1);
    }

    hasAbility(ability) {
        _.each(this.abilities, (uAbility: Ability) => {
            if (uAbility.name === ability.name) return true;
        });

        return false;
    }

    isShortcut(ability) {
        return this.shortcuts.indexOf(ability.name) > -1;
    }

    getArray() {
        let abilities = '';
        let abilityLevels = '';
        const shortcuts = this.shortcuts.toString();

        _.each(this.abilities, (ability: Ability) => {
            abilities += ability.name;
            abilityLevels += ability.level;
        });

        return {
            username: this.player.username,
            abilities,
            abilityLevels,
            shortcuts
        };
    }
}

export default Abilities;
