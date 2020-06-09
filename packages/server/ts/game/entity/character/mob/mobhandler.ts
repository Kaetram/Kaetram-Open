import Utils from '../../../../util/utils';
    import Messages from '../../../../network/messages';
    import Mobs from '../../../../util/mobs';
    import Packets from '../../../../network/packets';

class MobHandler {

    constructor(mob, world) {

        this.mob = mob;
        this.combat = mob.combat;
        this.world = world;
        this.map = world.map;

        this.roamingInterval = null;
        this.spawnLocation = mob.spawnLocation;
        this.maxRoamingDistance = mob.maxRoamingDistance;

        this.load();
        this.loadCallbacks();
    }

    load() {

        if (!this.mob.roaming)
            return;

        this.roamingInterval = setInterval(() => {

            if (!this.mob.dead) {
                // Calculate a random position near the mobs spawn location.
                let newX = this.spawnLocation[0] + Utils.randomInt(-this.maxRoamingDistance, this.maxRoamingDistance),
                    newY = this.spawnLocation[1] + Utils.randomInt(-this.maxRoamingDistance, this.maxRoamingDistance),
                    distance = Utils.getDistance(this.spawnLocation[0], this.spawnLocation[1], newX, newY);

                // Return if the tile is colliding.
                if (this.map.isColliding(newX, newY))
                    return;

                // Prevent movement if the area is empty.
                if (this.map.isEmpty(newX, newY))
                    return;

                // Don't have mobs block a door.
                if (this.map.isDoor(newX, newY))
                    return;

                // Prevent mobs from going outside of their roaming radius.
                if (distance < this.mob.maxRoamingDistance)
                    return;

                // No need to move mobs to the same position as theirs.
                if (newX === this.mob.x && newY === this.mob.y)
                    return;

                // We don't want mobs randomly roaming while in combat.
                if (this.mob.combat.started)
                    return;

                /**
                 * An expansion of the plateau level present in BrowserQuest.
                 * Because the map is far more complex, we will require multiple
                 * levels of plateau in order to properly roam entities without
                 * them walking into other regions (or clipping).
                 */

                if (this.mob.getPlateauLevel() !== this.map.getPlateauLevel(newX, newY))
                    return;

                //if (config.debug)
                //    this.forceTalk('Yes hello, I am moving.');

                this.mob.setPosition(newX, newY);

                this.world.push(Packets.PushOpcode.Regions, {
                    regionId: this.mob.region,
                    message: new Messages.Movement(Packets.MovementOpcode.Move, {
                        id: this.mob.instance,
                        x: newX,
                        y: newY
                    })
                });

            }

        }, 5000);
    }

    loadCallbacks() {

        // Combat plugin has its own set of callbacks.
        if (Mobs.hasCombatPlugin(this.mob.id))
            return;

        this.mob.onLoad(() => {

            if (this.mob.miniboss)
                this.mob.setMinibossData();

        });

        this.mob.onDeath(() => {

            if (!this.mob.miniboss || !this.combat)
                return;

            this.combat.forEachAttacker((attacker) => {
                if (attacker)
                    attacker.finishAchievement(this.mob.achievementId);
            });

        });

        //TODO - Implement posion on Mobs
    }

    forceTalk(message) {
        if (!this.world)
            return;

        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.mob.region,
            message: new Messages.NPC(Packets.NPCOpcode.Talk, {
                id: this.mob.instance,
                text: message,
                nonNPC: true
            })
        });

    }

}

export default MobHandler;
