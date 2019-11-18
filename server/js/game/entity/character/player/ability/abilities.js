/* global module */

const _ = require('underscore');
const AbilityInfo = require('../../../../../util/abilities');

class Abilities {
    constructor(player) {
        const self = this;

        self.player = player;

        self.abilities = {};

        self.shortcuts = [];

        self.shortcutSize = 5;
    }

    addAbility(ability) {
        this.abilities[ability.name] = ability;
    }

    addShortcut(ability) {
        const self = this;

        if (self.shortcutSize >= 5)
            return;

        self.shortcuts.push(ability.name);
    }

    removeAbility(ability) {
        const self = this;

        if (self.isShortcut(ability))
            self.removeShortcut(self.shortcuts.indexOf(ability.name));

        delete self.abilities[ability.name];
    }

    removeShortcut(index) {
        if (index > -1)
            this.shortcuts.splice(index, 1);
    }

    hasAbility(ability) {
        _.each(this.abilities, uAbility => {
            if (uAbility.name === ability.name)
                return true;
        });

        return false;
    }

    isShortcut(ability) {
        return this.shortcuts.indexOf(ability.name) > -1;
    }

    getArray() {
        const self = this;
        let abilities = '';
        let abilityLevels = '';
        const shortcuts = self.shortcuts.toString();

        _.each(self.abilities, ability => {
            abilities += ability.name;
            abilityLevels += ability.level;
        });

        return {
            username: self.player.username,
            abilities: abilities,
            abilityLevels: abilityLevels,
            shortcuts: shortcuts
        };
    }
}

module.exports = Abilities;
