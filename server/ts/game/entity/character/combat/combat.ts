import * as _ from 'underscore';
import Messages from '../../../../network/messages';
import Packets from '../../../../network/packets';
import Formulas from '../../../../util/formulas';
import Modules from '../../../../util/modules';
import Utils from '../../../../util/utils';
import Character from '../character';
import CombatQueue from './combatqueue';
import Hit from './hit';

/**
 *
 */
class Combat {
    public attackers: any;

    public retaliate: any;

    public world: any;

    public forgetCallback: any;

    public started: any;

    public lastAction: any;

    public attackLoop: any;

    public followLoop: any;

    public checkLoop: any;

    public queue: any;

    public lastActionThreshold: any;

    public lastHit: any;

    public attacking: boolean;

    public first: boolean;

    public cleanTimeout: any;

    constructor(public character: Character) {
        this.character = character;
        this.world = null;

        this.attackers = {};

        this.retaliate = false;

        this.queue = new CombatQueue();

        this.attacking = false;

        this.attackLoop = null;
        this.followLoop = null;
        this.checkLoop = null;

        this.first = false;
        this.started = false;
        this.lastAction = -1;
        this.lastHit = -1;

        this.lastActionThreshold = 7000;

        this.cleanTimeout = null;

        this.character.onSubAoE((radius, hasTerror) => {
            this.dealAoE(radius, hasTerror);
        });

        this.character.onDamage((target, hitInfo) => {
            if (
                this.isPlayer() &&
                this.character.hasBreakableWeapon() &&
                Formulas.getWeaponBreak(this.character, target)
            )
                this.character.breakWeapon();

            if (hitInfo.type === Modules.Hits.Stun) {
                target.setStun(true);

                if (target.stunTimeout) clearTimeout(target.stunTimeout);

                target.stunTimeout = setTimeout(() => {
                    target.setStun(false);
                }, 3000);
            }
        });
    }

    begin(attacker) {
        this.start();

        this.character.setTarget(attacker);
        this.addAttacker(attacker);

        attacker.combat.addAttacker(this.character); // For mobs attacking players..

        this.attack(attacker);
    }

    start() {
        if (this.started) return;

        this.lastAction = new Date().getTime();

        this.attackLoop = setInterval(() => {
            this.parseAttack();
        }, this.character.attackRate);

        this.followLoop = setInterval(() => {
            this.parseFollow();
        }, 400);

        this.checkLoop = setInterval(() => {
            this.parseCheck();
        }, 1000);

        this.started = true;
    }

    stop() {
        if (!this.started) return;

        clearInterval(this.attackLoop);
        clearInterval(this.followLoop);
        clearInterval(this.checkLoop);

        this.attackLoop = null;
        this.followLoop = null;
        this.checkLoop = null;

        this.started = false;
    }

    parseAttack() {
        if (!this.world || !this.queue || this.character.stunned) return;

        if (this.character.hasTarget() && this.inProximity()) {
            if (this.character.target && !this.character.target.isDead())
                this.attack(this.character.target);

            if (this.queue.hasQueue())
                this.hit(
                    this.character,
                    this.character.target,
                    this.queue.getHit()
                );

            this.sync();

            this.lastAction = this.getTime();
        } else this.queue.clear();
    }

    parseFollow() {
        if (this.character.frozen || this.character.stunned) return;

        if (this.isMob()) {
            if (!this.character.isRanged()) this.sendFollow();

            if (this.isAttacked() || this.character.hasTarget())
                this.lastAction = this.getTime();

            if (this.onSameTile()) {
                const newPosition = this.getNewPosition();

                this.move(this.character, newPosition.x, newPosition.y);
            }

            if (this.character.hasTarget() && !this.inProximity()) {
                const attacker = this.getClosestAttacker();

                if (attacker) this.follow(this.character, attacker);
            }
        }

        if (this.isPlayer()) {
            if (!this.character.hasTarget()) return;

            if (this.character.target.type !== 'player') return;

            if (!this.inProximity())
                this.follow(this.character, this.character.target);
        }
    }

    parseCheck() {
        if (this.getTime() - this.lastAction > this.lastActionThreshold) {
            this.stop();

            this.forget();
        }
    }

    attack(target) {
        let hit;

        if (this.isPlayer()) hit = this.character.getHit(target);
        else
            hit = new Hit(
                Modules.Hits.Damage,
                Formulas.getDamage(this.character, target)
            );

        if (!hit) return;

        this.queue.add(hit);
    }

    sync() {
        if (this.character.type !== 'mob') return;

        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.character.region,
            message: new Messages.Combat(Packets.CombatOpcode.Sync, {
                attackerId: this.character.instance, // irrelevant
                targetId: this.character.instance, // can be the same since we're acting on an entity.
                x: this.character.x,
                y: this.character.y
            })
        });
    }

    dealAoE(radius, hasTerror) {
        // TODO: Find a way to implement special effects without hard-coding them.

        if (!this.world) return;

        const entities = this.world
            .getGrids()
            .getSurroundingEntities(this.character, radius);

        _.each(entities, (entity) => {
            const hitData = new Hit(
                Modules.Hits.Damage,
                Formulas.getAoEDamage(this.character, entity)
            ).getData();

            hitData.isAoE = true;
            hitData.hasTerror = hasTerror;

            this.hit(this.character, entity, hitData);
        });
    }

    forceAttack() {
        if (!this.character.target || !this.inProximity()) return;

        // this.stop();
        this.start();

        this.attackCount(2, this.character.target);
        this.hit(this.character, this.character.target, this.queue.getHit());
    }

    attackCount(count, target) {
        for (let i = 0; i < count; i++) this.attack(target);
    }

    addAttacker(character) {
        if (this.hasAttacker(character)) return;

        this.attackers[character.instance] = character;
    }

    removeAttacker(character) {
        if (this.hasAttacker(character))
            delete this.attackers[character.instance];

        if (!this.isAttacked()) this.sendToSpawn();
    }

    sendToSpawn() {
        if (!this.isMob()) return;

        this.character.return();

        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.character.region,
            message: new Messages.Movement(Packets.MovementOpcode.Move, {
                id: this.character.instance,
                x: this.character.x,
                y: this.character.y,
                forced: false,
                teleport: false
            })
        });
    }

    hasAttacker(character) {
        if (!this.isAttacked()) return;

        return character.instance in this.attackers;
    }

    onSameTile() {
        if (!this.character.target || this.character.type !== 'mob') return;

        return (
            this.character.x === this.character.target.x &&
            this.character.y === this.character.target.y
        );
    }

    isAttacked() {
        return this.attackers && Object.keys(this.attackers).length > 0;
    }

    getNewPosition() {
        const position = {
            x: this.character.x,
            y: this.character.y
        };

        const random = Utils.randomInt(0, 3);

        if (random === 0) position.x++;
        else if (random === 1) position.y--;
        else if (random === 2) position.x--;
        else if (random === 3) position.y++;

        return position;
    }

    isRetaliating() {
        return (
            this.isPlayer() &&
            !this.character.hasTarget() &&
            this.retaliate &&
            !this.character.moving &&
            new Date().getTime() - this.character.lastMovement > 1500
        );
    }

    inProximity() {
        if (!this.character.target) return;

        const targetDistance = this.character.getDistance(
            this.character.target
        );
        const range = this.character.attackRange;

        if (this.character.isRanged()) return targetDistance <= range;

        return this.character.isNonDiagonal(this.character.target);
    }

    getClosestAttacker() {
        let closest = null;
        const lowestDistance = 100;

        this.forEachAttacker((attacker) => {
            const distance = this.character.getDistance(attacker);

            if (distance < lowestDistance) closest = attacker;
        });

        return closest;
    }

    setWorld(world) {
        if (!this.world) this.world = world;
    }

    forget() {
        this.attackers = {};
        this.character.removeTarget();

        if (this.forgetCallback) this.forgetCallback();
    }

    move(character, x, y) {
        /**
         * The server and mob types can parse the mob movement
         */

        if (character.type !== 'mob') return;

        character.setPosition(x, y);
    }

    hit(character, target, hitInfo, force?) {
        const time = this.getTime();

        if (
            time - this.lastHit < this.character.attackRate &&
            !hitInfo.isAoE &&
            !force
        )
            return;

        if (character.isRanged() || hitInfo.isRanged) {
            const projectile = this.world.createProjectile(
                [character, target],
                hitInfo
            );

            this.world.push(Packets.PushOpcode.Regions, {
                regionId: character.region,
                message: new Messages.Projectile(
                    Packets.ProjectileOpcode.Create,
                    projectile.getData()
                )
            });
        } else {
            this.world.push(Packets.PushOpcode.Regions, {
                regionId: character.region,
                message: new Messages.Combat(Packets.CombatOpcode.Hit, {
                    attackerId: character.instance,
                    targetId: target.instance,
                    hitInfo
                })
            });

            this.world.handleDamage(character, target, hitInfo.damage);
        }

        if (character.damageCallback) character.damageCallback(target, hitInfo);

        this.lastHit = this.getTime();
    }

    follow(character, target) {
        this.world.push(Packets.PushOpcode.Regions, {
            regionId: character.region,
            message: new Messages.Movement(Packets.MovementOpcode.Follow, {
                attackerId: character.instance,
                targetId: target.instance,
                isRanged: character.isRanged,
                attackRange: character.attackRange
            })
        });
    }

    end() {
        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.character.region,
            message: new Messages.Combat(Packets.CombatOpcode.Finish, {
                attackerId: this.character.instance,
                targetId: null
            })
        });
    }

    sendFollow() {
        if (!this.character.hasTarget() || this.character.target.isDead())
            return;

        // let ignores = [this.character.instance, this.character.target.instance];

        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.character.region,
            message: new Messages.Movement(Packets.MovementOpcode.Follow, {
                attackerId: this.character.instance,
                targetId: this.character.target.instance
            })
        });
    }

    forEachAttacker(callback) {
        _.each(this.attackers, (attacker) => {
            callback(attacker);
        });
    }

    onForget(callback) {
        this.forgetCallback = callback;
    }

    targetOutOfBounds() {
        if (!this.character.hasTarget() || !this.isMob()) return;

        const spawnPoint = this.character.spawnLocation;
        const { target } = this.character;

        return (
            Utils.getDistance(
                spawnPoint[0],
                spawnPoint[1],
                target.x,
                target.y
            ) > this.character.spawnDistance
        );
    }

    getTime() {
        return new Date().getTime();
    }

    colliding(x, y) {
        return this.world.map.isColliding(x, y);
    }

    isPlayer() {
        return this.character.type === 'player';
    }

    isMob() {
        return this.character.type === 'mob';
    }

    isTargetMob() {
        return this.character.target.type === 'mob';
    }

    canAttackAoE(target) {
        return (
            this.isMob() ||
            target.type === 'mob' ||
            (this.isPlayer() &&
                target.type === 'player' &&
                target.pvp &&
                this.character.pvp)
        );
    }
}

export default Combat;
