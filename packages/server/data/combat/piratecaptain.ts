import { Opcodes } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import Combat from '../../src/game/entity/character/combat/combat';
import Messages from '../../src/network/messages';

import type { HitData } from '@kaetram/common/types/info';
import type Character from '../../src/game/entity/character/character';

export default class PirateCaptain extends Combat {
    private teleportLocations: Pos[];
    private lastTeleportIndex: number;
    private lastTeleport: number;
    private location: Pos;
    // declare character: Character;

    public constructor(character: Character) {
        character.spawnDistance = 20;
        super(character);

        this.character = character;

        this.teleportLocations = [];

        this.lastTeleportIndex = 0;
        this.lastTeleport = 0;

        this.location = {
            x: this.character.x,
            y: this.character.y
        };

        this.load();
    }

    private load(): void {
        let south = { x: 251, y: 574 },
            west = { x: 243, y: 569 },
            east = { x: 258, y: 568 },
            north = { x: 251, y: 563 };

        this.teleportLocations.push(north, south, west, east);
    }

    public override hit(character: Character, target: Character, hitInfo: HitData): void {
        if (this.canTeleport()) this.teleport();
        else super.hit(character, target, hitInfo);
    }

    private teleport(): void {
        let position = this.getRandomPosition();

        if (!position) return;

        this.stop();

        this.lastTeleport = Date.now();
        this.lastTeleportIndex = position.index;

        this.character.setPosition(position.x, position.y);

        if (this.world)
            this.world.push(Opcodes.Push.Regions, {
                regionId: this.character.region,
                message: new Messages.Teleport({
                    id: this.character.instance,
                    x: this.character.x,
                    y: this.character.y,
                    withAnimation: true
                })
            });

        this.forEachAttacker((attacker: Character) => {
            attacker.removeTarget();
        });

        if (this.character.target) this.begin(this.character.target);
    }

    private getRandomPosition(): { x: number; y: number; index: number } | null {
        let random = Utils.randomInt(0, this.teleportLocations.length - 1),
            position = this.teleportLocations[random];

        if (!position || random === this.lastTeleportIndex) return null;

        return {
            x: position.x,
            y: position.y,
            index: random
        };
    }

    private canTeleport(): boolean {
        // Just randomize the teleportation for shits and giggles.
        return Date.now() - this.lastTeleport > 10_000 && Utils.randomInt(0, 4) === 2;
    }

    private getHealthPercentage(): number {
        // Floor it to avoid random floats
        return Math.floor((this.character.hitPoints / this.character.maxHitPoints) * 100);
    }
}
