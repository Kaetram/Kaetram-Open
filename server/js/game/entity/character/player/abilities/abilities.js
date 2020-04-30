/* global module */

let _ = require('underscore'),
    AbilityInfo = require('../../../../../util/abilities');

class Abilities {
    
    constructor(player) {
        let self = this;
        
        self.player = player;
        
        self.abilities = {};
        
        self.shortcuts = [];
        
        self.shortcutSize = 5;
    }

    addAbility(ability) {
        this.abilities[ability.name] = ability;
    }

    addShortcut(ability) {
        let self = this;

        if (self.shortcutSize >= 5)
            return;

        self.shortcuts.push(ability.name);
    }

    removeAbility(ability) {
        let self = this;

        if (self.isShortcut(ability))
            self.removeShortcut(self.shortcuts.indexOf(ability.name));

        delete self.abilities[ability.name];
    }

    removeShortcut(index) {
        if (index > -1)
            this.shortcuts.splice(index, 1);
    }

    hasAbility(ability) {
        _.each(this.abilities, (uAbility) => {
            if (uAbility.name === ability.name)
                return true;
        });

        return false;
    }

    isShortcut(ability) {
        return this.shortcuts.indexOf(ability.name) > -1;
    }

    getArray() {
        let self = this,
            abilities = '',
            abilityLevels = '',
            shortcuts = self.shortcuts.toString();

        _.each(self.abilities, (ability) => {
            abilities += ability.name;
            abilityLevels += ability.level;
        });

        return {
            username: self.player.username,
            abilities: abilities,
            abilityLevels: abilityLevels,
            shortcuts: shortcuts
        }
    }
    
}

module.exports = Abilities;