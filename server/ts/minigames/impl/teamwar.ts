import _ from 'underscore';
import Minigame from '../minigame';
import Utils from '../../util/utils';
import Messages from '../../network/messages';
import Packets from '../../network/packets';

class TeamWar extends Minigame {
    public lobby: any;
    public redTeam: any;
    public blueTeam: any;
    public updateInterval: any;
    public countdown: any;
    public lastSync: any;
    public syncThreshold: any;
    public started: any;
    public world: any;

    constructor(world) {
        super(0, 'TeamWar');

        this.world = world;

        this.lobby = [];
        this.redTeam = [];
        this.blueTeam = [];

        this.updateInterval = null;
        this.started = false;

        this.countdown = 120;
        this.updateInterval = 1000;
        this.lastSync = new Date().getTime();
        this.syncThreshold = 10000;

        this.load();
    }

    load() {
        this.updateInterval = setInterval(() => {
            if (this.count() < 5 || this.countdown > 0) return;

            this.buildTeams();

            if (new Date().getTime() - this.lastSync > this.syncThreshold)
                this.synchronize();

            this.started = true;
        }, this.updateInterval);
    }

    start() {
        //
    }

    add(player) {
        if (this.lobby.indexOf(player) > -1) return;

        this.lobby.push(player);
    }

    remove(player) {
        const index = this.lobby.indexOf(player);

        if (index < 0) return;

        this.lobby.splice(index, 1);
    }

    /**
     * Splits the players in the lobby into two groups.
     * These will be the two teams we are creating and
     * sending into the game map.
     */

    buildTeams() {
        const tmp = this.lobby.slice();
        const half = Math.ceil(tmp.length / 2);
        const random = Utils.randomInt(0, 1);

        if (random === 1)
            (this.redTeam = tmp.splice(0, half)), (this.blueTeam = tmp);
        else (this.blueTeam = tmp.splice(0, half)), (this.redTeam = tmp);
    }

    count() {
        return this.lobby.length;
    }

    synchronize() {
        if (this.started) return;

        _.each(this.lobby, player => {
            this.sendCountdown(player);
        });
    }

    sendCountdown(player) {
        /**
         * We handle this logic client-sided. If a countdown does not exist,
         * we create one, otherwise we synchronize it with the packets we receive.
         */

        this.world.push(Packets.PushOpcode.Player, {
            player,
            message: new Messages.Minigame(Packets.MinigameOpcode.TeamWar, {
                opcode: Packets.MinigameOpcode.TeamWarOpcode.Countdown,
                countdown: this.countdown
            })
        });
    }

    // Used for radius
    getRandom(radius?) {
        return Utils.randomInt(0, radius || 4);
    }

    getTeam(player) {
        return this.redTeam.indexOf(player) > -1
            ? 'red'
            : this.blueTeam.indexOf(player) > -1
            ? 'blue'
            : 'lobby';
    }

    // Both these spawning areas randomize the spawning to a radius of 4
    // The spawning area for the red team
    getRedTeamSpawn() {
        return {
            x: 133 + this.getRandom(),
            y: 471 + this.getRandom()
        };
    }

    // The spawning area for the blue team
    getBlueTeamSpawn() {
        return {
            x: 163 + this.getRandom(),
            y: 499 + this.getRandom()
        };
    }
}

export default TeamWar;
