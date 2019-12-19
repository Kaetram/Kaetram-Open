let Utils = require('../../../../util/utils'),
    Messages = require('../../../../network/messages'),
    Packets = require('../../../../network/packets');

class MobHandler {

    constructor(mob, world) {
        let self = this;

        self.mob = mob;
        self.world = world;
        self.map = world.map;

        self.roamingInterval = null;
        self.spawnLocation = mob.spawnLocation;
        self.maxRoamingDistance = mob.maxRoamingDistance;

        self.load();
        self.loadCallbacks();
    }

    load() {
        let self = this;

        if (!self.mob.roaming)
            return;

        self.roamingInterval = setInterval(() => {

            if (!self.mob.dead) {
                // Calculate a random position near the mobs spawn location.
                let newX = self.spawnLocation[0] + Utils.randomInt(-self.maxRoamingDistance, self.maxRoamingDistance),
                    newY = self.spawnLocation[1] + Utils.randomInt(-self.maxRoamingDistance, self.maxRoamingDistance),
                    distance = Utils.getDistance(self.spawnLocation[0], self.spawnLocation[1], newX, newY);

                // Return if the tile is colliding.
                if (self.map.isColliding(newX, newY))
                    return;

                // Prevent movement if the area is empty.
                if (self.map.isEmpty(newX, newY))
                    return;

                // Don't have mobs block a door.
                if (self.map.isDoor(newX, newY))
                    return;

                // Prevent mobs from going outside of their roaming radius.
                if (distance < self.mob.maxRoamingDistance)
                    return;

                // No need to move mobs to the same position as theirs.
                if (newX === self.mob.x && newY === self.mob.y)
                    return;

                // We don't want mobs randomly roaming while in combat.
                if (self.mob.combat.started)
                    return;

                /**
                 * Prevents mobs from entering areas not the same as theirs.
                 * Mobs inside the plateau cannot enter areas outside of it and vice versa.
                 */
                if (self.mob.getPlateauState() !== self.map.isPlateau(newX, newY))
                    return;

                self.mob.setPosition(newX, newY);

                self.world.push(Packets.PushOpcode.Regions, {
                    regionId: self.mob.region,
                    message: new Messages.Movement(Packets.MovementOpcode.Move, {
                        id: self.mob.instance,
                        x: newX,
                        y: newY
                    })
                });

            }

        }, 5000);
    }

    loadCallbacks() {
        let self = this;


        //TODO - Implement posion on Mobs
    }

}

module.exports = MobHandler;
