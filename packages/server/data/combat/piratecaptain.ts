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
    character: any;

    constructor(character: Mob) {
        character.spawnDistance = 20;
        super(character);

        const self = this;

        self.character = character;

        self.teleportLocations = [];

        self.lastTeleportIndex = 0;
        self.lastTeleport = 0;

        self.location = {
            x: self.character.x,
            y: self.character.y
        };

        self.load();
    }

    load() {
        const self = this,
            south = { x: 251, y: 574 },
            west = { x: 243, y: 569 },
            east = { x: 258, y: 568 },
            north = { x: 251, y: 563 };

        self.teleportLocations.push(north, south, west, east);
    }

    hit(character: Character, target: Character, hitInfo: any) {
        const self = this;
        if (self.canTeleport()) self.teleport();
        else super.hit(character, target, hitInfo);
    }

    teleport() {
        const self = this,
            position = self.getRandomPosition();

        if (!position) return;

        self.stop();

        self.lastTeleport = new Date().getTime();
        self.lastTeleportIndex = position.index;

        self.character.setPosition(position.x, position.y);

        if (self.world)
            self.world.push(Packets.PushOpcode.Regions, {
                regionId: self.character.region,
                message: new Messages.Teleport({
                    id: self.character.instance,
                    x: self.character.x,
                    y: self.character.y,
                    withAnimation: true
                })
            });

        self.forEachAttacker((attacker: Character) => {
            attacker.removeTarget();
        });

        if (self.character.hasTarget()) self.begin(self.character.target);
    }

    getRandomPosition() {
        const self = this,
            random = Utils.randomInt(0, self.teleportLocations.length - 1),
            position = self.teleportLocations[random];

        if (!position || random === self.lastTeleportIndex) return null;

        return {
            x: position.x,
            y: position.y,
            index: random
        };
    }

    canTeleport() {
        //Just randomize the teleportation for shits and giggles.
        return new Date().getTime() - this.lastTeleport > 10000 && Utils.randomInt(0, 4) === 2;
    }

    getHealthPercentage() {
        //Floor it to avoid random floats
        return Math.floor((this.character.hitPoints / this.character.maxHitPoints) * 100);
    }
}

export default PirateCaptain;
