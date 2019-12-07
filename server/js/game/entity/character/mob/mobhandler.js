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
                let newX = self.mob.x + Utils.randomInt(-self.maxRoamingDistance, self.maxRoamingDistance),
                    newY = self.mob.y + Utils.randomInt(-self.maxRoamingDistance, self.maxRoamingDistance),
                    distance = Utils.getDistance(self.spawnLocation[0], self.spawnLocation[1], newX, newY);

                if (self.map.isColliding(newX, newY))
                    return;

                if (self.map.isEmpty(newX, newY))
                    return;

                if (self.map.isDoor(newX, newY))
                    return;

                if (distance < self.mob.maxRoamingDistance)
                    return;

                if (newX === self.mob.x && newY === self.mob.y)
                    return;

                if (self.mob.combat.started)
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
