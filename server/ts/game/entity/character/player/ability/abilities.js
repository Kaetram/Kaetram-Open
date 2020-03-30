"use strict";
exports.__esModule = true;
var _ = require("underscore");
/**
 *
 */
var Abilities = /** @class */ (function () {
    function Abilities(player) {
        this.player = player;
        this.abilities = {};
        this.shortcuts = [];
        this.shortcutSize = 5;
    }
    Abilities.prototype.addAbility = function (ability) {
        this.abilities[ability.name] = ability;
    };
    Abilities.prototype.addShortcut = function (ability) {
        if (this.shortcutSize >= 5)
            return;
        this.shortcuts.push(ability.name);
    };
    Abilities.prototype.removeAbility = function (ability) {
        if (this.isShortcut(ability))
            this.removeShortcut(this.shortcuts.indexOf(ability.name));
        delete this.abilities[ability.name];
    };
    Abilities.prototype.removeShortcut = function (index) {
        if (index > -1)
            this.shortcuts.splice(index, 1);
    };
    Abilities.prototype.hasAbility = function (ability) {
        _.each(this.abilities, function (uAbility) {
            if (uAbility.name === ability.name)
                return true;
        });
        return false;
    };
    Abilities.prototype.isShortcut = function (ability) {
        return this.shortcuts.indexOf(ability.name) > -1;
    };
    Abilities.prototype.getArray = function () {
        var abilities = '';
        var abilityLevels = '';
        var shortcuts = this.shortcuts.toString();
        _.each(this.abilities, function (ability) {
            abilities += ability.name;
            abilityLevels += ability.level;
        });
        return {
            username: this.player.username,
            abilities: abilities,
            abilityLevels: abilityLevels,
            shortcuts: shortcuts
        };
    };
    return Abilities;
}());
exports["default"] = Abilities;
