/* global module */

let Minigame = require('../minigame'),
    Utils = require('../../util/utils');

class TeamWar extends Minigame {

    constructor(world) {
        super(0, 'TeamWar');

        let self = this;

        self.world = world;

        self.lobby = [];
        self.redTeam = [];
        self.blueTeam = [];

        self.updateInterval = null;
        self.started = false;

        self.countdown = 120;

        self.load();
    }

    load() {
        let self = this;

        self.updateInterval = setInterval(() => {

            if (self.count() < 5 || self.countdown > 0)
                return;

            self.buildTeams();

            
            self.started = true;
        });
    }

    start() {
        let self = this;


    }

    add(player) {
        let self = this;

        if (self.lobby.indexOf(player) > -1)
            return;

        self.lobby.push(player);
    }

    remove(player) {
        let self = this,
            index = self.lobby.indexOf(player);

        if (index < 0)
            return;

        self.lobby.splice(index, 1);
    }

    /**
     * Splits the players in the lobby into two groups.
     * These will be the two teams we are creating and
     * sending into the game map.
     */

    buildTeams() {
        let self = this,
            tmp = self.lobby.slice(),
            half = Math.ceil(tmp.length / 2),
            random = Utils.randomInt(0, 1);

        if (random === 1)
            self.redTeam = tmp.splice(0, half), self.blueTeam = tmp;
        else
            self.blueTeam = tmp.splice(0, half), self.redTeam = tmp;
    }

    count() {
        return this.lobby.length;
    }

    // Used for radius
    getRandom(radius) {
        return Utils.randomInt(0, radius || 4);
    }

    getTeam(player) {
        return this.redTeam.indexOf(player) > -1 ? 'red' : this.blueTeam.indexOf(player) > -1 ? 'blue' : 'lobby';
    }

    // Both these spawning areas randomize the spawning to a radius of 4
    // The spawning area for the red team
    getRedTeamSpawn() {
        let self = this;

        return {
            x: 133 + self.getRandom(),
            y: 471 + self.getRandom()
        }
    }

    // The spawning area for the blue team
    getBlueTeamSpawn() {
        let self = this;

        return {
            x: 163 + self.getRandom(),
            y: 499 + self.getRandom()
        }
    }
}

module.exports = TeamWar;
