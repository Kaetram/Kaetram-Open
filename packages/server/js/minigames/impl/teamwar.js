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
        self.updateInterval = 1000;
        self.lastSync = new Date().getTime();
        self.syncThreshold = 10000;

        self.load();
    }

    load() {
        let self = this;

        self.updateInterval = setInterval(() => {

            if (self.count() < 5 || self.countdown > 0)
                return;

            self.buildTeams();

            if (new Date().getTime() - self.lastSync > self.syncThreshold)
                self.synchronize();

            self.started = true;

        }, self.updateInterval);
    }

    start() {
        let self = this;


    }

    add(player) {
        let self = this;

        if (self.lobby.indexOf(player) > -1)
            return;

        self.lobby.push(player);

		player.minigame = self.getState(player);
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

    synchronize() {
        let self = this;

        if (self.started)
            return;

        _.each(self.lobby, (player) => {
            self.sendCountdown(player);
        });
    }

    sendCountdown(player) {
        let self = this;

        /**
         * We handle this logic client-sided. If a countdown does not exist,
         * we create one, otherwise we synchronize it with the packets we receive.
         */

        self.world.push(Packets.PushOpcode.Player, {
            player: player,
            message: new Messages.Minigame(Packets.MinigameOpcode.TeamWar, {
                opcode: Packets.MinigameOpcode.TeamWarOpcode.Countdown,
                countdown: self.countdown
            })
        });
    }

	inLobby(player) {
		// TODO - Update these when new lobby is available.
		return player.x > 0 && player.x < 10 && player.y > 10 && player.y < 0;
	}

    // Used for radius
    getRandom(radius) {
        return Utils.randomInt(0, radius || 4);
    }

    getTeam(player) {
		let self = this;

		if (self.redTeam.indexOf(player) > -1)
			return 'red';

		if (self.blueTeam.indexOf(player) > -1)
			return 'blue';

		if (self.lobby.indexOf(player) > -1)
			return 'lobby';

		return null;
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

	// Expand on the super `getState()`
	getState(player) {
		let self = this,
			state = super.getState();

		// Player can only be in team `red`, `blue`, or `lobby`.
		state.team = self.getTeam(player);

		if (!state.team)
			return null;

		return state;
	}
}

module.exports = TeamWar;
