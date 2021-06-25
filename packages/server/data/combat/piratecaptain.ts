import Combat from '../../src/game/entity/character/combat/combat';
import Character from '../../src/game/entity/character/character';
import Mob from '../../src/game/entity/character/mob/mob';
import Utils from '../../src/util/utils';
import Messages from '../../src/network/messages';
import Packets from '../../src/network/packets';

class PirateCaptain extends Combat {
    teleportLocations: Array<any>;
    lastTeleportIndex: number;
    lastTeleport: number;
    location: any;
    declare character: Mob;

    constructor(character: Mob) {
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

    load() {
        const south = { x: 251, y: 574 },
             west = { x: 243, y: 569 },
             east = { x: 258, y: 568 },
             north = { x: 251, y: 563 };

        this.teleportLocations.push(north, south, west, east);
    }

    hit(character: Character, target: Character, hitInfo: any) {
        if (this.canTeleport()) this.teleport();
        else super.hit(character, target, hitInfo);
    }

    teleport() {
        const position = this.getRandomPosition();

        if (!position) return;

        this.stop();

        this.lastTeleport = Date.now();
        this.lastTeleportIndex = position.index;

        this.character.setPosition(position.x, position.y);

        if (this.world)
            this.world.push(Packets.PushOpcode.Regions, {
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

        if (this.character.hasTarget()) this.begin(this.character.target);
    }

    getRandomPosition() {
        const random = Utils.randomInt(0, this.teleportLocations.length - 1),
             position = this.teleportLocations[random];

        if (!position || random === this.lastTeleportIndex) return null;

        return {
            x: position.x,
            y: position.y,
            index: random
        };
    }

    canTeleport() {
        //Just randomize the teleportation for shits and giggles.
        return Date.now() - this.lastTeleport > 10000 && Utils.randomInt(0, 4) === 2;
    }

    getHealthPercentage() {
        //Floor it to avoid random floats
        return Math.floor((this.character.hitPoints / this.character.maxHitPoints) * 100);
    }
}

export default PirateCaptain;
