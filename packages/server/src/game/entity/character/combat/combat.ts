import _ from 'lodash';

import { Modules, Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Messages from '../../../../network/messages';
import Formulas from '../../../../util/formulas';
import CombatQueue from './combatqueue';
import Hit from './hit';

import type { HitData } from '@kaetram/common/types/info';
import type Entities from '../../../../controllers/entities';
import type World from '../../../world';
import type Character from '../character';
import type Mob from '../mob/mob';
import type Player from '../player/player';

export default class Combat {
    public world!: World;
    public entities!: Entities;

    public attackers: { [id: string]: Character } = {};

    private retaliate = false;

    private queue = new CombatQueue();

    // private attacking = false;

    private attackLoop: NodeJS.Timeout | null = null;
    private followLoop: NodeJS.Timeout | null = null;
    private checkLoop: NodeJS.Timeout | null = null;

    // private first = false;
    public started = false;
    private lastAction = -1;
    public lastHit = -1;

    public lastActionThreshold = 7000;

    // private cleanTimeout: NodeJS.Timeout | null = null;

    private forgetCallback?(): void;

    public constructor(public character: Character) {
        character.onSubAoE((radius: number, hasTerror: boolean) => {
            this.dealAoE(radius, hasTerror);
        });

        character.onDamage((target, hitInfo) => {
            if (this.isPlayer()) {
                let player = character as Player;

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

    public begin(attacker: Character): void {
        this.start();

        this.character.setTarget(attacker);
        this.addAttacker(attacker);

        attacker.combat.addAttacker(this.character); // For mobs attacking players..

        this.attack(attacker);
    }

    public start(): void {
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

    public stop(): void {
        if (!this.started) return;

        if (this.character.type === 'player') log.debug('Stopping player attack.');

        if (this.attackLoop) clearInterval(this.attackLoop);
        if (this.followLoop) clearInterval(this.followLoop);
        if (this.checkLoop) clearInterval(this.checkLoop);

        this.attackLoop = null!;
        this.followLoop = null!;
        this.checkLoop = null!;

        this.started = false;
    }

    private parseAttack(): void {
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

    private parseFollow(): void {
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

    private parseCheck(): void {
        if (this.getTime() - this.lastAction > this.lastActionThreshold) {
            this.stop();

            this.forget();
        }
    }

    public attack(target: Character): void {
        let hit: Hit | undefined;

        if (this.isPlayer()) {
            let player = this.character as Player;

            hit = player.getHit(target);
        } else hit = new Hit(Modules.Hits.Damage, Formulas.getDamage(this.character, target));

        if (!hit) return;

        this.queue.add(hit);
    }

    public forceAttack(): void {
        if (!this.character.target || !this.inProximity()) return;

        // this.stop();
        this.start();

        this.attackCount(2, this.character.target);
        this.hit(this.character, this.character.target, this.queue.getHit()!);
    }

    private sync(): void {
        if (this.character.type !== 'mob') return;

        this.world.push(Opcodes.Push.Regions, {
            regionId: this.character.region,
            message: new Messages.Combat(Opcodes.Combat.Sync, {
                attackerId: this.character.instance, // irrelevant
                targetId: this.character.instance, // can be the same since we're acting on an entity.
                x: this.character.x,
                y: this.character.y
            })
        });
    }

    /**
     * TODO - Find a way to implement special effects without hardcoding them.
     */
    public dealAoE(radius: number, hasTerror = false): void {
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

    private attackCount(count: number, target: Character): void {
        for (let i = 0; i < count; i++) this.attack(target);
    }

    public addAttacker(character: Character): void {
        if (this.hasAttacker(character)) return;

        this.attackers[character.instance] = character;
    }

    public removeAttacker(character: Character): void {
        if (this.hasAttacker(character)) delete this.attackers[character.instance];

        if (!this.isAttacked()) this.sendToSpawn();
    }

    private sendToSpawn(): void {
        if (!this.isMob()) return;

        let mob = this.character as Mob;

        mob.return();

        this.world.push(Opcodes.Push.Regions, {
            regionId: this.character.region,
            message: new Messages.Movement(Opcodes.Movement.Move, {
                id: this.character.instance,
                x: this.character.x,
                y: this.character.y,
                forced: false,
                teleport: false
            })
        });
    }

    public hasAttacker(character: Character): boolean | void {
        if (!this.isAttacked()) return;

        return character.instance in this.attackers;
    }

    private onSameTile(): boolean | void {
        if (!this.character.target || this.character.type !== 'mob') return;

        return (
            this.character.x === this.character.target.x &&
            this.character.y === this.character.target.y
        );
    }

    public isAttacked(): boolean {
        return this.attackers && Object.keys(this.attackers).length > 0;
    }

    private getNewPosition(): Pos {
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

    public isRetaliating(): boolean {
        return (
            this.isPlayer() &&
            !this.character.target &&
            this.retaliate &&
            !this.character.moving &&
            Date.now() - this.character.lastMovement > 1500
        );
    }

    private inProximity(): boolean | void {
        if (!this.character.target) return;

        let targetDistance = this.character.getDistance(this.character.target),
            range = this.character.attackRange;

        if (this.character.isRanged()) return targetDistance <= range;

        return this.character.isNonDiagonal(this.character.target);
    }

    private getClosestAttacker(): Character | null {
        let closest = null,
            lowestDistance = 100;

        this.forEachAttacker((attacker: Character) => {
            let distance = this.character.getDistance(attacker);

            if (distance < lowestDistance) closest = attacker;
        });

        return closest;
    }

    public setWorld(world: World): void {
        if (!this.world) this.world = world;

        if (!this.entities) this.entities = world.entities;
    }

    public forget(): void {
        this.attackers = {};
        this.character.removeTarget();

        this.forgetCallback?.();
    }

    private move(character: Character, x: number, y: number): void {
        /**
         * The server and mob types can parse the mob movement
         */

        if (character.type !== 'mob') return;

        character.setPosition(x, y);
    }

    public hit(character: Character, target: Character, hitInfo: HitData, override = false): void {
        if (!this.canHit() && !override) return;

        if (character.isRanged() || hitInfo.isRanged) {
            let projectile = this.world.entities.spawnProjectile([character, target])!;

            this.world.push(Opcodes.Push.Regions, {
                regionId: character.region,
                message: new Messages.Projectile(Opcodes.Projectile.Create, projectile.getData())
            });
        } else {
            this.world.push(Opcodes.Push.Regions, {
                regionId: character.region,
                message: new Messages.Combat(Opcodes.Combat.Hit, {
                    attackerId: character.instance,
                    targetId: target.instance,
                    hitInfo
                })
            });

            this.world.handleDamage(character, target, hitInfo.damage);
        }

        character.damageCallback?.(target, hitInfo);

        this.lastHit = this.getTime();
    }

    private follow(character: Character, target: Character): void {
        this.world.push(Opcodes.Push.Regions, {
            regionId: character.region,
            message: new Messages.Movement(Opcodes.Movement.Follow, {
                attackerId: character.instance,
                targetId: target.instance,
                isRanged: character.isRanged(),
                attackRange: character.attackRange
            })
        });
    }

    public end(): void {
        this.world.push(Opcodes.Push.Regions, {
            regionId: this.character.region,
            message: new Messages.Combat(Opcodes.Combat.Finish, {
                attackerId: this.character.instance,
                targetId: null
            })
        });
    }

    private sendFollow(): void {
        if (!this.character.target || this.character.target.isDead()) return;

        // let ignores = [this.character.instance, this.character.target.instance];

        this.world.push(Opcodes.Push.Regions, {
            regionId: this.character.region,
            message: new Messages.Movement(Opcodes.Movement.Follow, {
                attackerId: this.character.instance,
                targetId: this.character.target.instance
            })
        });
    }

    public forEachAttacker(callback: (attacker: Character) => void): void {
        _.each(this.attackers, (attacker) => {
            callback(attacker);
        });
    }

    public onForget(callback: () => void): void {
        this.forgetCallback = callback;
    }

    public targetOutOfBounds(): boolean | void {
        if (!this.character.target || !this.isMob()) return;

        let [x, y] = this.character.spawnLocation,
            { target, spawnDistance } = this.character;

        return Utils.getDistance(x, y, target.x, target.y) > spawnDistance;
    }

    public getTime(): number {
        return Date.now();
    }

    public colliding(x: number, y: number): boolean {
        return this.world.map.isColliding(x, y);
    }

    private isPlayer(): boolean {
        return this.character.type === 'player';
    }

    private isMob(): boolean {
        return this.character.type === 'mob';
    }

    private isTargetMob(): boolean {
        return this.character.target?.type === 'mob';
    }

    private canAttackAoE(target: Character): boolean {
        return (
            this.isMob() ||
            target.type === 'mob' ||
            (this.isPlayer() && target.type === 'player' && target.pvp && this.character.pvp)
        );
    }

    public canHit(): boolean {
        let currentTime = Date.now(),
            diff = currentTime - this.lastHit;

        // 5 millisecond margin of error.
        return diff + 5 > this.character.attackRate;
    }
}
