let Utils = require('../../../../util/utils'),
    Messages = require('../../../../network/messages'),
    Mobs = require('../../../../util/mobs'),
    Packets = require('../../../../network/packets');

class MobHandler {

    constructor(mob, world) {
        let self = this;

        self.mob = mob;
        self.combat = mob.combat;
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
                 * An expansion of the plateau level present in BrowserQuest.
                 * Because the map is far more complex, we will require multiple
                 * levels of plateau in order to properly roam entities without
                 * them walking into other regions (or clipping).
                 */

                if (self.mob.getPlateauLevel() !== self.map.getPlateauLevel(newX, newY))
                    return;

                //if (config.debug)
                //    self.forceTalk('Yes hello, I am moving.');

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

        // Combat plugin has its own set of callbacks.
        if (Mobs.hasCombatPlugin(self.mob.id))
            return;

        self.mob.onLoad(() => {

            if (self.mob.miniboss)
                self.mob.setMinibossData();

        });

        self.mob.onDeath(() => {

            if (!self.mob.miniboss || !self.combat)
                return;

            self.combat.forEachAttacker((attacker) => {
                if (attacker)
                    attacker.finishAchievement(self.mob.achievementId);
            });

        });

        //TODO - Implement posion on Mobs
    }

    forceTalk(message) {
        var self = this;

        if (!self.world)
            return;

        self.world.push(Packets.PushOpcode.Regions, {
            regionId: self.mob.region,
            message: new Messages.NPC(Packets.NPCOpcode.Talk, {
                id: self.mob.instance,
                text: message,
                nonNPC: true
            })
        });

    }

}

module.exports = MobHandler;
