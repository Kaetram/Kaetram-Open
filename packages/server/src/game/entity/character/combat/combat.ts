import _ from 'lodash';

import { Modules, Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import Formulas from '../../../../info/formulas';
import Queue from './queue';
import Hit from './hit';

import type { HitData } from '@kaetram/common/types/info';
import type Entities from '../../../../controllers/entities';
import type World from '../../../world';
import type Character from '../character';
import type Mob from '../mob/mob';
import type Player from '../player/player';
import { Movement, Combat as CombatPacket, Projectile } from '@kaetram/server/src/network/packets';

export default class Combat {
    public started = false;

    private lastAttack = Date.now();

    // Create the combat queue.
    private queue: Queue = new Queue();

    private attackLoop?: NodeJS.Timeout | undefined;

    public constructor(private character: Character) {}

    /**
     * Starts the attack loop.
     */

    public start(): void {
        this.started = true;

        this.attackLoop = setInterval(this.handleAttackLoop.bind(this), this.character.attackRate);
    }

    /**
     * Stops the combat loops and clears the queue.
     */

    public stop(): void {
        // Clear the loops.
        if (this.attackLoop) clearInterval(this.attackLoop);

        this.attackLoop = undefined;

        // Clear target and attackers.
        this.character.clearTarget();
        this.character.clearAttackers();

        // Clear the queue.
        this.queue.clear();

        // Mark the combat as stopped.
        this.started = false;
    }

    /**
     * Starts a combat session if not started and attacks
     * the target if possible.
     * @param target The target we are going to attack.
     */

    public attack(target: Character): void {
        // Already started, let the loop handle it.
        if (this.started) return;

        this.character.setTarget(target);

        this.start();

        /**
         * Initiates an attack right away prior to letting the first interval
         * kick in. Essential when a player starts a combat. The timeout is added
         * in order to give the player a small delay effect, otherwise the
         * combat is perceived as 'too snappy.'
         */

        if (this.canAttack()) setTimeout(() => this.handleAttackLoop(), 250);
    }

    /**
     * Callback loop handler for when the character should attempt to perform an attack.
     * The attack loop consists of checking viable targets
     * by looking at the attackers (if it's a non-player character)
     * and then checking if the character is in range of the target.
     */

    private handleAttackLoop(): void {
        if (!this.character.hasTarget()) return;

        if (this.character.isNearTarget()) {
            let hit = this.createHit();

            this.character.target?.hit(hit.getDamage(), this.character);

            this.sendAttack(hit);
        } else this.sendFollow();
    }

    /**
     * Relays to the nearby regions that the character
     * is attacking their target.
     */

    private sendAttack(hit: Hit): void {
        this.character.sendToRegions(
            new CombatPacket(Opcodes.Combat.Hit, {
                instance: this.character.instance,
                target: this.character.target!.instance,
                hit: hit.serialize()
            })
        );
    }

    /**
     * Sends a follow request to the nearby regions. This
     * notifies all the players that this current character
     * is following their target.
     */

    private sendFollow(): void {
        if (this.character.isMob()) console.log('Mob is following');
        this.character.sendToRegions(
            new Movement(Opcodes.Movement.Follow, {
                instance: this.character.instance,
                target: this.character.target!.instance
            })
        );
    }

    /**
     * Creates a Hit object with the data from the current
     * character and its target.
     * @returns A new hit object with the damage.
     */

    private createHit(): Hit {
        return new Hit(
            Modules.Hits.Damage,
            Formulas.getDamage(this.character, this.character.target!),
            this.character.isRanged()
        );
    }

    /**
     * Checks if a character can attack. This is used more-so for
     * players exiting and re-entering combat loops.
     * @returns If the difference in time from now to the last attack is greater than the attack rate.
     */

    private canAttack(): boolean {
        return Date.now() - this.lastAttack >= this.character.attackRate;
    }

    // public world!: World;
    // public entities!: Entities;

    // public attackers: { [id: string]: Character } = {};

    // private retaliate = false;

    // private queue = new CombatQueue();

    // // private attacking = false;

    // private attackLoop: NodeJS.Timeout | null = null;
    // private followLoop: NodeJS.Timeout | null = null;
    // private checkLoop: NodeJS.Timeout | null = null;

    // // private first = false;
    // public started = false;
    // private lastAction = -1;
    // public lastHit = -1;

    // public lastActionThreshold = 7000;

    // // private cleanTimeout: NodeJS.Timeout | null = null;

    // private forgetCallback?(): void;

    // public constructor(public character: Character) {
    //     this.world = character.world;

    //     character.onSubAoE((radius: number, hasTerror: boolean) => {
    //         this.dealAoE(radius, hasTerror);
    //     });

    //     character.onDamage((target, hitInfo) => {
    //         if (this.character.isPlayer()) {
    //             let player = character as Player;

    //             // if (player.hasBreakableWeapon() && Formulas.getWeaponBreak(player, target))
    //             //     player.breakWeapon();
    //         }

    //         if (hitInfo.type === Modules.Hits.Stun) {
    //             target.setStun(true);

    //             if (target.stunTimeout) clearTimeout(target.stunTimeout);

    //             target.stunTimeout = setTimeout(() => {
    //                 target.setStun(false);
    //             }, 3000);
    //         }
    //     });
    // }

    // public begin(attacker: Character): void {
    //     this.start();

    //     this.character.setTarget(attacker);
    //     this.addAttacker(attacker);

    //     attacker.combat.addAttacker(this.character); // For mobs attacking players..

    //     this.attack(attacker);
    // }

    // public start(): void {
    //     if (this.started) return;

    //     if (this.character.isPlayer()) log.debug('Starting player attack.');

    //     this.lastAction = Date.now();

    //     this.attackLoop = setInterval(() => this.parseAttack(), this.character.attackRate);

    //     this.followLoop = setInterval(() => this.parseFollow(), 400);

    //     this.checkLoop = setInterval(() => this.parseCheck(), 1000);

    //     this.started = true;
    // }

    // public stop(): void {
    //     if (!this.started) return;

    //     if (this.character.isPlayer()) log.debug('Stopping player attack.');

    //     if (this.attackLoop) clearInterval(this.attackLoop);
    //     if (this.followLoop) clearInterval(this.followLoop);
    //     if (this.checkLoop) clearInterval(this.checkLoop);

    //     this.attackLoop = null!;
    //     this.followLoop = null!;
    //     this.checkLoop = null!;

    //     this.started = false;

    //     this.forget();
    //     this.end();
    // }

    // private parseAttack(): void {
    //     if (!this.world || !this.queue || this.character.stunned) return;

    //     if (this.character.target?.isDead()) return this.character.removeTarget();

    //     if (this.character.target && this.inProximity()) {
    //         if (this.character.target && !this.character.target.isDead())
    //             this.attack(this.character.target);

    //         if (this.queue.hasQueue())
    //             this.hit(this.character, this.character.target, this.queue.getHit()!);

    //         this.sync();

    //         this.lastAction = this.getTime();
    //     } else this.queue.clear();
    // }

    // private parseFollow(): void {
    //     if (this.character.frozen || this.character.stunned) return;

    //     if (this.character.isMob()) {
    //         if (!this.character.isRanged()) this.sendFollow();

    //         if (this.isAttacked() || this.character.target) this.lastAction = this.getTime();

    //         if (this.onSameTile()) {
    //             let newPosition = this.getNewPosition();

    //             this.move(this.character, newPosition.x, newPosition.y);
    //         }

    //         if (this.character.target && !this.inProximity()) {
    //             let attacker = this.getClosestAttacker();

    //             if (attacker) this.follow(this.character, attacker);
    //         }
    //     }

    //     if (this.character.isPlayer()) {
    //         if (!this.character.target) return;

    //         if (this.character.target.isPlayer()) return;

    //         if (!this.inProximity()) this.follow(this.character, this.character.target);
    //     }
    // }

    // private parseCheck(): void {
    //     if (this.getTime() - this.lastAction > this.lastActionThreshold) {
    //         this.stop();

    //         this.forget();
    //     }
    // }

    // public attack(target: Character): void {
    //     let hit: Hit | undefined;

    //     if (this.character.isPlayer()) {
    //         let player = this.character as Player;

    //         hit = player.getHit(target);
    //     } else hit = new Hit(Modules.Hits.Damage, Formulas.getDamage(this.character, target));

    //     if (!hit) return;

    //     this.queue.add(hit);
    // }

    // public forceAttack(): void {
    //     if (!this.character.target || !this.inProximity()) return;

    //     // this.stop();
    //     this.start();

    //     this.attackCount(2, this.character.target);
    //     this.hit(this.character, this.character.target, this.queue.getHit()!);
    // }

    // private sync(): void {
    //     if (this.character.isMob()) return;

    //     this.world.push(Modules.PacketType.Regions, {
    //         region: this.character.region,
    //         packet: new CombatPacket(Opcodes.Combat.Sync, {
    //             attackerId: this.character.instance, // irrelevant
    //             targetId: this.character.instance, // can be the same since we're acting on an entity.
    //             x: this.character.x,
    //             y: this.character.y
    //         })
    //     });
    // }

    // /**
    //  * TODO - Find a way to implement special effects without hardcoding them.
    //  */
    // public dealAoE(radius: number, hasTerror = false): void {
    //     if (!this.world) return;

    //     let entities = this.world
    //         .getGrids()
    //         .getSurroundingEntities(this.character, radius) as Character[];

    //     _.each(entities, (entity) => {
    //         let hitData = new Hit(
    //             Modules.Hits.Damage,
    //             Formulas.getAoEDamage(this.character, entity)
    //         ).getData();

    //         hitData.isAoE = true;
    //         hitData.hasTerror = hasTerror;

    //         this.hit(this.character, entity, hitData);
    //     });
    // }

    // private attackCount(count: number, target: Character): void {
    //     for (let i = 0; i < count; i++) this.attack(target);
    // }

    // public addAttacker(character: Character): void {
    //     if (this.hasAttacker(character)) return;

    //     this.attackers[character.instance] = character;
    // }

    // public removeAttacker(character: Character): void {
    //     if (this.hasAttacker(character)) delete this.attackers[character.instance];

    //     if (!this.isAttacked()) this.sendToSpawn();
    // }

    // private sendToSpawn(): void {
    //     if (!this.character.isMob()) return;

    //     let mob = this.character as Mob;

    //     mob.sendToSpawn();
    // }

    // public hasAttacker(character: Character): boolean | void {
    //     if (!this.isAttacked()) return;

    //     return character.instance in this.attackers;
    // }

    // private onSameTile(): boolean | void {
    //     if (!this.character.target || this.character.isMob()) return;

    //     return (
    //         this.character.x === this.character.target.x &&
    //         this.character.y === this.character.target.y
    //     );
    // }

    // public isAttacked(): boolean {
    //     return this.attackers && Object.keys(this.attackers).length > 0;
    // }

    // private getNewPosition(): Position {
    //     let position = {
    //             x: this.character.x,
    //             y: this.character.y
    //         },
    //         random = Utils.randomInt(0, 3);

    //     switch (random) {
    //         case 0: {
    //             position.x++;
    //             break;
    //         }
    //         case 1: {
    //             position.y--;
    //             break;
    //         }
    //         case 2: {
    //             position.x--;
    //             break;
    //         }
    //         case 3:
    //             {
    //                 position.y++;
    //                 // No default
    //             }
    //             break;
    //     }

    //     return position;
    // }

    // public isRetaliating(): boolean {
    //     return (
    //         this.character.isPlayer() &&
    //         !this.character.target &&
    //         this.retaliate &&
    //         !this.character.moving &&
    //         Date.now() - this.character.lastMovement > 1500
    //     );
    // }

    // private inProximity(): boolean | void {
    //     if (!this.character.target) return;

    //     let targetDistance = this.character.getDistance(this.character.target),
    //         range = this.character.attackRange;

    //     if (this.character.isRanged()) return targetDistance <= range;

    //     return this.character.isNonDiagonal(this.character.target);
    // }

    // private getClosestAttacker(): Character | null {
    //     let closest = null,
    //         lowestDistance = 100;

    //     this.forEachAttacker((attacker: Character) => {
    //         let distance = this.character.getDistance(attacker);

    //         if (distance < lowestDistance) closest = attacker;
    //     });

    //     return closest;
    // }

    // public setWorld(world: World): void {
    //     if (!this.world) this.world = world;

    //     if (!this.entities) this.entities = world.entities;
    // }

    // public forget(): void {
    //     this.attackers = {};
    //     this.character.removeTarget();

    //     this.forgetCallback?.();
    // }

    // private move(character: Character, x: number, y: number): void {
    //     /**
    //      * The server and mob types can parse the mob movement
    //      */

    //     if (character.isMob()) return;

    //     character.setPosition(x, y);
    // }

    // public hit(character: Character, target: Character, hitInfo: HitData, override = false): void {
    //     if (!this.canHit() && !override) return;

    //     if (character.isRanged() || hitInfo.isRanged) {
    //         let projectile = this.world.entities.spawnProjectile([character, target])!;

    //         this.world.push(Modules.PacketType.Regions, {
    //             region: character.region,
    //             packet: new Projectile(Opcodes.Projectile.Create, projectile.serialize())
    //         });
    //     } else {
    //         this.world.push(Modules.PacketType.Regions, {
    //             region: character.region,
    //             packet: new CombatPacket(Opcodes.Combat.Hit, {
    //                 attackerId: character.instance,
    //                 targetId: target.instance,
    //                 hitInfo
    //             })
    //         });

    //         target.hit(hitInfo.damage, character);
    //     }

    //     character.damageCallback?.(target, hitInfo);

    //     this.lastHit = this.getTime();
    // }

    // private follow(character: Character, target: Character): void {
    //     this.world.push(Modules.PacketType.Regions, {
    //         region: character.region,
    //         packet: new Movement(Opcodes.Movement.Follow, {
    //             attackerId: character.instance,
    //             targetId: target.instance,
    //             isRanged: character.isRanged(),
    //             attackRange: character.attackRange
    //         })
    //     });
    // }

    // public end(): void {
    //     this.world.push(Modules.PacketType.Regions, {
    //         region: this.character.region,
    //         packet: new CombatPacket(Opcodes.Combat.Finish, {
    //             attackerId: this.character.instance,
    //             targetId: null
    //         })
    //     });
    // }

    // private sendFollow(): void {
    //     if (!this.character.target || this.character.target.isDead()) return;

    //     // let ignores = [this.character.instance, this.character.target.instance];

    //     this.world.push(Modules.PacketType.Regions, {
    //         region: this.character.region,
    //         packet: new Movement(Opcodes.Movement.Follow, {
    //             attackerId: this.character.instance,
    //             targetId: this.character.target.instance
    //         })
    //     });
    // }

    // public forEachAttacker(callback: (attacker: Character) => void): void {
    //     _.each(this.attackers, callback);
    // }

    // public onForget(callback: () => void): void {
    //     this.forgetCallback = callback;
    // }

    // public targetOutOfBounds(): boolean | void {
    //     if (!this.character.target || !this.character.isMob()) return;

    //     let { x, y, target, roamDistance } = this.character as Mob;

    //     return Utils.getDistance(x, y, target!.x, target!.y) > roamDistance;
    // }

    // public getTime(): number {
    //     return Date.now();
    // }

    // public colliding(x: number, y: number): boolean {
    //     return this.world.map.isColliding(x, y);
    // }

    // private canAttackAoE(target: Character): boolean {
    //     return false;
    //     // return (
    //     //     this.isMob() ||
    //     //     target.isMob() ||
    //     //     (this.isPlayer() && target.isPlayer() && target.pvp && this.character.pvp)
    //     // );
    // }

    // public canHit(): boolean {
    //     let currentTime = Date.now(),
    //         diff = currentTime - this.lastHit;

    //     // 5 millisecond margin of error.
    //     return diff + 5 > this.character.attackRate;
    // }
}
