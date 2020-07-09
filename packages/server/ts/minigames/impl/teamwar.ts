/* global module */

import _ from 'underscore';
import Packets from '../../network/packets';
import Messages from '../../network/messages';
import Minigame from '../minigame';
import Utils from '../../util/utils';
import World from '../../game/world';
import Player from '../../game/entity/character/player/player';

class TeamWar extends Minigame {
    world: World;

    lobby: any;
    redTeam: any;
    blueTeam: any;

    updateInterval: any;

    started: boolean;

    countdown: number;
    updateTick: number;
    lastSync: number;
    syncThreshold: number;

    constructor(world: World) {
        super(0, 'TeamWar');

        this.world = world;

        this.lobby = [];
        this.redTeam = [];
        this.blueTeam = [];

        this.updateInterval = null;
        this.started = false;

        this.countdown = 120;
        this.updateTick = 1000;
        this.lastSync = new Date().getTime();
        this.syncThreshold = 10000;

        this.load();
    }

    load() {
        this.updateInterval = setInterval(() => {
            if (this.count() < 5 || this.countdown > 0) return;

            this.buildTeams();

            if (new Date().getTime() - this.lastSync > this.syncThreshold) this.synchronize();

            this.started = true;
        }, this.updateTick);
    }

    start() {}

    add(player: Player) {
        if (this.lobby.indexOf(player) > -1) return;

        this.lobby.push(player);

        player.minigame = this.getState(player);
    }

    remove(player: Player) {
        let index = this.lobby.indexOf(player);

        if (index < 0) return;

        this.lobby.splice(index, 1);
    }

    /**
     * Splits the players in the lobby into two groups.
     * These will be the two teams we are creating and
     * sending into the game map.
     */

    buildTeams() {
        let tmp = this.lobby.slice(),
            half = Math.ceil(tmp.length / 2),
            random = Utils.randomInt(0, 1);

        if (random === 1) (this.redTeam = tmp.splice(0, half)), (this.blueTeam = tmp);
        else (this.blueTeam = tmp.splice(0, half)), (this.redTeam = tmp);
    }

    count() {
        return this.lobby.length;
    }

    synchronize() {
        if (this.started) return;

        _.each(this.lobby, (player: Player) => {
            this.sendCountdown(player);
        });
    }

    sendCountdown(player: Player) {
        /**
         * We handle this logic client-sided. If a countdown does not exist,
         * we create one, otherwise we synchronize it with the packets we receive.
         */

        this.world.push(Packets.PushOpcode.Player, {
            player: player,
            message: new Messages.Minigame(Packets.MinigameOpcode.TeamWar, {
                opcode: Packets.MinigameOpcode.TeamWarOpcode.Countdown,
                countdown: this.countdown,
            }),
        });
    }

    inLobby(player: Player) {
        // TODO - Update these when new lobby is available.
        return player.x > 0 && player.x < 10 && player.y > 10 && player.y < 0;
    }

    // Used for radius
    getRandom(radius?: number) {
        return Utils.randomInt(0, radius || 4);
    }

    getTeam(player: Player) {
        if (this.redTeam.indexOf(player) > -1) return 'red';

        if (this.blueTeam.indexOf(player) > -1) return 'blue';

        if (this.lobby.indexOf(player) > -1) return 'lobby';

        return null;
    }

    // Both these spawning areas randomize the spawning to a radius of 4
    // The spawning area for the red team
    getRedTeamSpawn() {
        return {
            x: 133 + this.getRandom(),
            y: 471 + this.getRandom(),
        };
    }

    // The spawning area for the blue team
    getBlueTeamSpawn() {
        return {
            x: 163 + this.getRandom(),
            y: 499 + this.getRandom(),
        };
    }

    // Expand on the super `getState()`
    getState(player?: Player) {
        let state = super.getState();

        // Player can only be in team `red`, `blue`, or `lobby`.
        state.team = this.getTeam(player);

        if (!state.team) return null;

        return state;
    }
}

export default TeamWar;
