import _ from 'lodash';

import type Player from '../player';
import type Ability from './impl/ability';

export interface AbilitiesArray {
    username: string;
    abilities: string;
    abilityLevels: string;
    shortcuts: string;
}

export default class Abilities {
    abilities: { [name: string]: Ability } = {};

    shortcuts: string[] = [];

    shortcutSize = 5;

    constructor(private player: Player) {}

    addAbility(ability: Ability): void {
        this.abilities[ability.name] = ability;
    }

    addShortcut(ability: Ability): void {
        if (this.shortcutSize >= 5) return;

        this.shortcuts.push(ability.name);
    }

    removeAbility(ability: Ability): void {
        if (this.isShortcut(ability)) this.removeShortcut(this.shortcuts.indexOf(ability.name));

        delete this.abilities[ability.name];
    }

    removeShortcut(index: number): void {
        if (index > -1) this.shortcuts.splice(index, 1);
    }

    hasAbility(ability: Ability): boolean {
        _.each(this.abilities, (uAbility: Ability) => {
            if (uAbility.name === ability.name) return true;
        });

        return false;
    }

    isShortcut(ability: Ability): boolean {
        return this.shortcuts.includes(ability.name);
    }

    getArray(): AbilitiesArray {
        let abilities = '',
            abilityLevels = '',
            shortcuts = this.shortcuts.toString();

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
