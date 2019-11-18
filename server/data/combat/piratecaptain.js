const Combat = require('../../js/game/entity/character/combat/combat');
const Utils = require('../../js/util/utils');
const Messages = require('../../js/network/messages');
const Packets = require('../../js/network/packets');
const Modules = require('../../js/util/modules');

class PirateCaptain extends Combat {
    constructor(character) {
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
        const self = this;
        const south = { x: 251, y: 574 };
        const west = { x: 243, y: 569 };
        const east = { x: 258, y: 568 };
        const north = { x: 251, y: 563 };

        self.teleportLocations.push(north, south, west, east);
    }

    hit(character, target, hitInfo) {
        const self = this;
        if (self.canTeleport())
            self.teleport();
        else
            super.hit(character, target, hitInfo);
    }

    teleport() {
        const self = this;
        const position = self.getRandomPosition();

        if (!position)
            return;

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

        self.forEachAttacker(attacker => {
            attacker.removeTarget();
        });

        if (self.character.hasTarget())
            self.begin(self.character.target);
    }

    getRandomPosition() {
        const self = this;
        const random = Utils.randomInt(0, self.teleportLocations.length - 1);
        const position = self.teleportLocations[random];

        if (!position || random === self.lastTeleportIndex)
            return null;

        return {
            x: position.x,
            y: position.y,
            index: random
        };
    }

    canTeleport() {
        // Just randomize the teleportation for shits and giggles.
        return new Date().getTime() - this.lastTeleport > 10000 && Utils.randomInt(0, 4) === 2;
    }

    getHealthPercentage() {
        // Floor it to avoid random floats
        return Math.floor((this.character.hitPoints / self.character.maxHitPoints) * 100);
    }
}

module.exports = PirateCaptain;
