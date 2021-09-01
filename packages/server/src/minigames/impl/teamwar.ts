import _ from 'lodash';

import { Opcodes } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import Messages from '../../network/messages';
import Minigame, { MinigameState } from '../minigame';

import type Player from '../../game/entity/character/player/player';
import type World from '../../game/world';

type Team = 'red' | 'blue' | 'lobby' | null;

interface TeamWarState extends MinigameState {
    team: Team;
}

export default class TeamWar extends Minigame {
    private lobby: Player[] = [];
    private redTeam: Player[] = [];
    private blueTeam: Player[] = [];

    private updateInterval: NodeJS.Timeout | null = null;

    private started = false;

    private countdown = 120;
    private updateTick = 1000;
    private lastSync = Date.now();
    private syncThreshold = 10_000;

    public constructor(private world: World) {
        super(0, 'TeamWar');

        this.load();
    }

    private load(): void {
        this.updateInterval = setInterval(() => {
            if (this.count() < 5 || this.countdown > 0) return;

            this.buildTeams();

            if (Date.now() - this.lastSync > this.syncThreshold) this.synchronize();

            this.started = true;
        }, this.updateTick);
    }

    // start(): void {}

    private add(player: Player): void {
        if (this.lobby.includes(player)) return;

        this.lobby.push(player);

        player.minigame = this.getState(player)!;
    }

    private remove(player: Player): void {
        let index = this.lobby.indexOf(player);

        if (index < 0) return;

        this.lobby.splice(index, 1);
    }

    /**
     * Splits the players in the lobby into two groups.
     * These will be the two teams we are creating and
     * sending into the game map.
     */
    private buildTeams(): void {
        let tmp = [...this.lobby],
            half = Math.ceil(tmp.length / 2),
            random = Utils.randomInt(0, 1);

        if (random === 1) (this.redTeam = tmp.splice(0, half)), (this.blueTeam = tmp);
        else (this.blueTeam = tmp.splice(0, half)), (this.redTeam = tmp);
    }

    private count(): number {
        return this.lobby.length;
    }

    private synchronize(): void {
        if (this.started) return;

        _.each(this.lobby, (player: Player) => {
            this.sendCountdown(player);
        });
    }

    /**
     * We handle this logic client-sided. If a countdown does not exist,
     * we create one, otherwise we synchronize it with the packets we receive.
     */
    private sendCountdown(player: Player): void {
        this.world.push(Opcodes.Push.Player, {
            player,
            message: new Messages.Minigame(Opcodes.Minigame.TeamWar, {
                opcode: Opcodes.TeamWar.Countdown,
                countdown: this.countdown
            })
        });
    }

    private inLobby(player: Player): boolean {
        // TODO - Update these when new lobby is available.
        return player.x > 0 && player.x < 10 && player.y > 10 && player.y < 0;
    }

    // Used for radius
    private getRandom(radius?: number): number {
        return Utils.randomInt(0, radius || 4);
    }

    private getTeam(player: Player): Team {
        if (this.redTeam.includes(player)) return 'red';

        if (this.blueTeam.includes(player)) return 'blue';

        if (this.lobby.includes(player)) return 'lobby';

        return null;
    }

    // Both these spawning areas randomize the spawning to a radius of 4
    // The spawning area for the red team
    private getRedTeamSpawn(): Pos {
        return {
            x: 133 + this.getRandom(),
            y: 471 + this.getRandom()
        };
    }

    // The spawning area for the blue team
    private getBlueTeamSpawn(): Pos {
        return {
            x: 163 + this.getRandom(),
            y: 499 + this.getRandom()
        };
    }

    // Expand on the super `getState()`
    public override getState(player?: Player): TeamWarState | null {
        let state = super.getState() as TeamWarState;

        // Player can only be in team `red`, `blue`, or `lobby`.
        state.team = this.getTeam(player!);

        if (!state.team) return null;

        return state;
    }
}
