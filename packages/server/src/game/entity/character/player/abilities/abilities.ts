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
    private abilities: { [name: string]: Ability } = {};

    private shortcuts: string[] = [];

    private shortcutSize = 5;

    public constructor(private player: Player) {}

    private addAbility(ability: Ability): void {
        this.abilities[ability.name] = ability;
    }

    private addShortcut(ability: Ability): void {
        if (this.shortcutSize >= 5) return;

        this.shortcuts.push(ability.name);
    }

    private removeAbility(ability: Ability): void {
        if (this.isShortcut(ability)) this.removeShortcut(this.shortcuts.indexOf(ability.name));

        delete this.abilities[ability.name];
    }

    private removeShortcut(index: number): void {
        if (index > -1) this.shortcuts.splice(index, 1);
    }

    private hasAbility(ability: Ability): boolean {
        _.each(this.abilities, (uAbility: Ability) => {
            if (uAbility.name === ability.name) return true;
        });

        return false;
    }

    private isShortcut(ability: Ability): boolean {
        return this.shortcuts.includes(ability.name);
    }

    public getArray(): AbilitiesArray {
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
