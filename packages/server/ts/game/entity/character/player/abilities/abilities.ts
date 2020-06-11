/* global module */

import _ from 'underscore';
import Player from '../player';
import Ability from './impl/ability';

class Abilities {

    player: Player;

    abilities: any;

    shortcuts: any;

    shortcutSize: number;

    constructor(player: Player) {

        this.player = player;

        this.abilities = {};

        this.shortcuts = [];

        this.shortcutSize = 5;
    }

    addAbility(ability: Ability) {
        this.abilities[ability.name] = ability;
    }

    addShortcut(ability: Ability) {

        if (this.shortcutSize >= 5)
            return;

        this.shortcuts.push(ability.name);
    }

    removeAbility(ability: Ability) {

        if (this.isShortcut(ability))
            this.removeShortcut(this.shortcuts.indexOf(ability.name));

        delete this.abilities[ability.name];
    }

    removeShortcut(index: number) {
        if (index > -1)
            this.shortcuts.splice(index, 1);
    }

    hasAbility(ability: Ability) {
        _.each(this.abilities, (uAbility: Ability) => {
            if (uAbility.name === ability.name)
                return true;
        });

        return false;
    }

    isShortcut(ability: Ability) {
        return this.shortcuts.indexOf(ability.name) > -1;
    }

    getArray() {
        let abilities = '',
            abilityLevels = '',
            shortcuts = this.shortcuts.toString();

        _.each(this.abilities, (ability: Ability) => {
            abilities += ability.name;
            abilityLevels += ability.level;
        });

        return {
            username: this.player.username,
            abilities: abilities,
            abilityLevels: abilityLevels,
            shortcuts: shortcuts
        }
    }

}

export default Abilities;
