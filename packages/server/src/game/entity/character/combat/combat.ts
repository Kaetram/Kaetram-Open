import _ from 'lodash';

import * as Modules from '@kaetram/common/src/modules';
import Packets from '@kaetram/common/src/packets';

import Entities from '../../../../controllers/entities';
import Messages from '../../../../network/messages';
import Formulas from '../../../../util/formulas';
import log from '../../../../util/log';
import Utils from '../../../../util/utils';
import World from '../../../world';
import Character from '../character';
import CombatQueue from './combatqueue';
import Hit from './hit';

import type { HitData } from './hit';
import Player from '../player/player';
import Mob from '../mob/mob';

export default class Combat {
    character: Character;
    world: World;
    entities!: Entities;

    attackers: { [id: string]: Character };

    retaliate: boolean;

    queue: CombatQueue;

    attacking: boolean;

    attackLoop: NodeJS.Timeout;
    followLoop: NodeJS.Timeout;
    checkLoop: NodeJS.Timeout;

    first: boolean;
    started: boolean;
    lastAction: number;
    lastHit: number;

    lastActionThreshold: number;

    cleanTimeout: NodeJS.Timeout;

    forgetCallback?(): void;

    constructor(character: Character) {
        this.character = character;
        this.world = null!;

        this.attackers = {};

        this.retaliate = false;

        this.queue = new CombatQueue();

        this.attacking = false;

        this.attackLoop = null!;
        this.followLoop = null!;
        this.checkLoop = null!;

        this.first = false;
        this.started = false;
        this.lastAction = -1;
        this.lastHit = -1;

        this.lastActionThreshold = 7000;

        this.cleanTimeout = null!;

        this.character.onSubAoE((radius: number, hasTerror: boolean) => {
            this.dealAoE(radius, hasTerror);
        });

        this.character.onDamage((target, hitInfo) => {
            if (this.isPlayer()) {
                const player = this.character as Player;

                if (player.hasBreakableWeapon() && Formulas.getWeaponBreak(player, target))
                    player.breakWeapon();
            }

            if (hitInfo.type === Modules.Hits.Stun) {
                target.setStun(true);

                if (target.stunTimeout) clearTimeout(target.stunTimeout);

                target.stunTimeout = setTimeout(() => {
                    target.setStun(false);
                }, 3000);
            }
        });
    }

    begin(attacker: Character): void {
        this.start();

        this.character.setTarget(attacker);
        this.addAttacker(attacker);

        attacker.combat.addAttacker(this.character); // For mobs attacking players..

        this.attack(attacker);
    }

    start(): void {
        if (this.started) return;

        if (this.character.type === 'player') log.debug('Starting player attack.');

        this.lastAction = Date.now();

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

    stop(): void {
        if (!this.started) return;

        if (this.character.type === 'player') log.debug('Stopping player attack.');

        clearInterval(this.attackLoop);
        clearInterval(this.followLoop);
        clearInterval(this.checkLoop);

        this.attackLoop = null!;
        this.followLoop = null!;
        this.checkLoop = null!;

        this.started = false;
    }

    parseAttack(): void {
        if (!this.world || !this.queue || this.character.stunned) return;

        if (this.character.target && this.inProximity()) {
            if (this.character.target && !this.character.target.isDead())
                this.attack(this.character.target);

            if (this.queue.hasQueue())
                this.hit(this.character, this.character.target, this.queue.getHit()!);

            this.sync();

            this.lastAction = this.getTime();
        } else this.queue.clear();
    }

    parseFollow(): void {
        if (this.character.frozen || this.character.stunned) return;

        if (this.isMob()) {
            if (!this.character.isRanged()) this.sendFollow();

            if (this.isAttacked() || this.character.target) this.lastAction = this.getTime();

            if (this.onSameTile()) {
                let newPosition = this.getNewPosition();

                this.move(this.character, newPosition.x, newPosition.y);
            }

            if (this.character.target && !this.inProximity()) {
                let attacker = this.getClosestAttacker();

                if (attacker) this.follow(this.character, attacker);
            }
        }

        if (this.isPlayer()) {
            if (!this.character.target) return;

            if (this.character.target.type !== 'player') return;

            if (!this.inProximity()) this.follow(this.character, this.character.target);
        }
    }

    parseCheck(): void {
        if (this.getTime() - this.lastAction > this.lastActionThreshold) {
            this.stop();

            this.forget();
        }
    }

    attack(target: Character): void {
        let hit: Hit | undefined;

        if (this.isPlayer()) {
            const player = this.character as Player;

            hit = player.getHit(target);
        } else hit = new Hit(Modules.Hits.Damage, Formulas.getDamage(this.character, target));

        if (!hit) return;

        this.queue.add(hit);
    }

    forceAttack(): void {
        if (!this.character.target || !this.inProximity()) return;

        // this.stop();
        this.start();

        this.attackCount(2, this.character.target);
        this.hit(this.character, this.character.target, this.queue.getHit()!);
    }

    sync(): void {
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

    dealAoE(radius: number, hasTerror = false): void {
        /**
         * TODO - Find a way to implement special effects without hardcoding them.
         */

        if (!this.world) return;

        let entities = this.world
            .getGrids()
            .getSurroundingEntities(this.character, radius) as Character[];

        _.each(entities, (entity) => {
            let hitData = new Hit(
                Modules.Hits.Damage,
                Formulas.getAoEDamage(this.character, entity)
            ).getData();

            hitData.isAoE = true;
            hitData.hasTerror = hasTerror;

            this.hit(this.character, entity, hitData);
        });
    }

    attackCount(count: number, target: Character): void {
        for (let i = 0; i < count; i++) this.attack(target);
    }

    addAttacker(character: Character): void {
        if (this.hasAttacker(character)) return;

        this.attackers[character.instance] = character;
    }

    removeAttacker(character: Character): void {
        if (this.hasAttacker(character)) delete this.attackers[character.instance];

        if (!this.isAttacked()) this.sendToSpawn();
    }

    sendToSpawn(): void {
        if (!this.isMob()) return;

        const mob = this.character as Mob;

        mob.return();

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

    hasAttacker(character: Character): boolean | void {
        if (!this.isAttacked()) return;

        return character.instance in this.attackers;
    }

    onSameTile(): boolean | void {
        if (!this.character.target || this.character.type !== 'mob') return;

        return (
            this.character.x === this.character.target.x &&
            this.character.y === this.character.target.y
        );
    }

    isAttacked(): boolean {
        return this.attackers && Object.keys(this.attackers).length > 0;
    }

    getNewPosition(): Pos {
        let position = {
                x: this.character.x,
                y: this.character.y
            },
            random = Utils.randomInt(0, 3);

        switch (random) {
            case 0: {
                position.x++;
                break;
            }
            case 1: {
                position.y--;
                break;
            }
            case 2: {
                position.x--;
                break;
            }
            case 3:
                {
                    position.y++;
                    // No default
                }
                break;
        }

        return position;
    }

    isRetaliating(): boolean {
        return (
            this.isPlayer() &&
            !this.character.target &&
            this.retaliate &&
            !this.character.moving &&
            Date.now() - this.character.lastMovement > 1500
        );
    }

    inProximity(): boolean | void {
        if (!this.character.target) return;

        let targetDistance = this.character.getDistance(this.character.target),
            range = this.character.attackRange;

        if (this.character.isRanged()) return targetDistance <= range;

        return this.character.isNonDiagonal(this.character.target);
    }

    getClosestAttacker(): Character | null {
        let closest = null,
            lowestDistance = 100;

        this.forEachAttacker((attacker: Character) => {
            let distance = this.character.getDistance(attacker);

            if (distance < lowestDistance) closest = attacker;
        });

        return closest;
    }

    setWorld(world: World): void {
        if (!this.world) this.world = world;

        if (!this.entities) this.entities = world.entities;
    }

    forget(): void {
        this.attackers = {};
        this.character.removeTarget();

        if (this.forgetCallback) this.forgetCallback();
    }

    move(character: Character, x: number, y: number): void {
        /**
         * The server and mob types can parse the mob movement
         */

        if (character.type !== 'mob') return;

        character.setPosition(x, y);
    }

    hit(character: Character, target: Character, hitInfo: HitData, override?: boolean): void {
        if (!this.canHit() && !override) return;

        if (character.isRanged() || hitInfo.isRanged) {
            let projectile = this.world.entities.spawnProjectile([character, target])!;

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

    follow(character: Character, target: Character): void {
        this.world.push(Packets.PushOpcode.Regions, {
            regionId: character.region,
            message: new Messages.Movement(Packets.MovementOpcode.Follow, {
                attackerId: character.instance,
                targetId: target.instance,
                isRanged: character.isRanged(),
                attackRange: character.attackRange
            })
        });
    }

    end(): void {
        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.character.region,
            message: new Messages.Combat(Packets.CombatOpcode.Finish, {
                attackerId: this.character.instance,
                targetId: null
            })
        });
    }

    sendFollow(): void {
        if (!this.character.target || this.character.target.isDead()) return;

        // let ignores = [this.character.instance, this.character.target.instance];

        this.world.push(Packets.PushOpcode.Regions, {
            regionId: this.character.region,
            message: new Messages.Movement(Packets.MovementOpcode.Follow, {
                attackerId: this.character.instance,
                targetId: this.character.target.instance
            })
        });
    }

    forEachAttacker(callback: (attacker: Character) => void): void {
        _.each(this.attackers, (attacker) => {
            callback(attacker);
        });
    }

    onForget(callback: () => void): void {
        this.forgetCallback = callback;
    }

    targetOutOfBounds(): boolean | void {
        if (!this.character.target || !this.isMob()) return;

        let [x, y] = this.character.spawnLocation,
            { target, spawnDistance } = this.character;

        return Utils.getDistance(x, y, target.x, target.y) > spawnDistance;
    }

    getTime(): number {
        return Date.now();
    }

    colliding(x: number, y: number): boolean {
        return this.world.map.isColliding(x, y);
    }

    isPlayer(): boolean {
        return this.character.type === 'player';
    }

    isMob(): boolean {
        return this.character.type === 'mob';
    }

    isTargetMob(): boolean {
        return this.character.target?.type === 'mob';
    }

    canAttackAoE(target: Character): boolean {
        return (
            this.isMob() ||
            target.type === 'mob' ||
            (this.isPlayer() && target.type === 'player' && target.pvp && this.character.pvp)
        );
    }

    canHit(): boolean {
        let currentTime = Date.now(),
            diff = currentTime - this.lastHit;

        // 5 millisecond margin of error.
        return diff + 5 > this.character.attackRate;
    }
}
