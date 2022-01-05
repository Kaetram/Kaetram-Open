import _, { remove } from 'lodash';

import config from '@kaetram/common/config';
import { Modules, Opcodes } from '@kaetram/common/network';
import { SlotData } from '@kaetram/common/types/slot';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import {
    Container,
    Equipment as EquipmentPacket,
    NPC as NPCPacket
} from '../../../../network/packets';
import Map from '../../../map/map';
import World from '../../../world';
import Hit from '../combat/hit';
import Slot from './containers/slot';

import type Areas from '../../../map/areas/areas';
import type NPC from '../../npc/npc';
import type Mob from '../mob/mob';
import type Player from './player';
import Equipment from './equipment/impl/equipment';
import Item from '../../objects/item';

export default class Handler {
    private world: World;
    private map: Map;

    private updateTicks = 0;
    private updateInterval: NodeJS.Timeout | null = null;

    public constructor(private player: Player) {
        this.world = player.world;
        this.map = player.world.map;

        this.player.onRegion(this.handleRegion.bind(this));

        // Loading callbacks
        this.player.equipment.onLoaded(this.handleEquipment.bind(this));
        this.player.inventory.onLoaded(this.handleInventory.bind(this));
        this.player.bank.onLoaded(this.handleBank.bind(this));

        // Inventory callbacks
        this.player.inventory.onAdd(this.handleInventoryAdd.bind(this));
        this.player.inventory.onRemove(this.handleInventoryRemove.bind(this));
        this.player.inventory.onNotify(this.player.notify.bind(this.player));

        // Bank callbacks
        this.player.bank.onAdd(this.handleBankAdd.bind(this));
        this.player.bank.onRemove(this.handleBankRemove.bind(this));
        this.player.bank.onNotify(this.player.notify.bind(this.player));

        // Equipment callbacks
        this.player.equipment.onEquip(this.handleEquip.bind(this));
        this.player.equipment.onUnequip(this.handleUnequip.bind(this));

        // NPC talking callback
        this.player.onTalkToNPC(this.handleTalkToNPC.bind(this));

        this.load();
    }

    /**
     * Callback for when a region has changed.
     * @param region The new region.
     */

    private handleRegion(region: number): void {
        log.debug(`Player ${this.player.username} entered region: ${region}.`);

        this.map.regions.sendEntities(this.player);
    }

    /**
     * Callback once the equipments are loaded. Relay the mesasge to the client.
     */

    private handleEquipment(): void {
        this.player.send(
            new EquipmentPacket(Opcodes.Equipment.Batch, this.player.equipment.serialize())
        );
    }

    /**
     * Callback for when an item is equipped.
     * @param equipment The equipment slot and the data contained.
     */

    private handleEquip(equipment: Equipment): void {
        this.player.send(new EquipmentPacket(Opcodes.Equipment.Equip, equipment));
    }

    /**
     * Callback for when the equipment is removed.
     * @param type The equipment type we are removing.
     */

    private handleUnequip(type: Modules.Equipment): void {
        this.player.send(new EquipmentPacket(Opcodes.Equipment.Unequip, type));
    }

    /**
     * Callback for when the inventory is loaded. Relay message to the client.
     */

    private handleInventory(): void {
        let { slots } = this.player.inventory.serialize();

        this.player.send(
            new Container(Opcodes.Container.Batch, {
                type: Modules.ContainerType.Inventory,
                slots
            })
        );

        // Load the bank after inventory is loaded.
        this.player.loadBank();
    }

    /**
     * Sends a packet to the client whenever
     * we add an item in our inventory.
     * @param slot The slot we just added the item to.
     */

    private handleInventoryAdd(slot: Slot): void {
        this.player.send(
            new Container(Opcodes.Container.Add, {
                type: Modules.ContainerType.Inventory,
                slot
            })
        );
    }

    /**
     * Send a packet to the client to clear the inventory slot.
     * @param slot The slot of the item we removed.
     * @param key The key of the slot we removed.
     * @param count The count represents the amount of item we are dropping, NOT IN THE SLOT.
     * @param drop If the item should spawn in the world upon removal.
     */

    private handleInventoryRemove(slot: Slot, key: string, count: number, drop?: boolean): void {
        let { ability, abilityLevel } = slot;

        // Spawn the item in the world if drop is true.
        if (drop)
            this.world.entities.spawnItem(
                key, // Key of the item before an action is done on the slot.
                this.player.x,
                this.player.y,
                true,
                count, // Note this is the amount we are dropping.
                ability,
                abilityLevel
            );

        this.player.send(
            new Container(Opcodes.Container.Drop, {
                type: Modules.ContainerType.Inventory,
                slot: slot.serialize()
            })
        );
    }

    /**
     * Callback for when the inventory is loaded. Relay message to the client.
     */

    private handleBank(): void {
        let { slots } = this.player.bank.serialize();

        this.player.send(
            new Container(Opcodes.Container.Batch, {
                type: Modules.ContainerType.Bank,
                slots
            })
        );
    }

    /**
     * Sends a packet to the client whenever
     * we add an item in our bank.
     * @param slot The slot we just added the item to.
     */

    private handleBankAdd(slot: Slot): void {
        this.player.send(
            new Container(Opcodes.Container.Add, {
                type: Modules.ContainerType.Bank,
                slot
            })
        );
    }

    /**
     * Handle the process of removing from the bank and placing
     * the item in the inventory. The `drop` parameter is used
     * ambiguously in this case. It refers to whether the item we
     * are removing from the bank is added to the inventory. By default
     * we will add the removed item to the inventory, but special cases
     * such as quests/achievements (or something else) will require we
     * remove items permanently from the bank.
     * @param slot The slot of the item we removed.
     * @param key The key of the slot we removed.
     * @param count The count represents the amount of item we are dropping, NOT IN THE SLOT.
     * @param drop If the item removed from the bank should be added to the inventory.
     */

    private handleBankRemove(slot: Slot, key: string, count: number, drop?: boolean): void {
        let removePacket = () => {
            this.player.send(
                new Container(Opcodes.Container.Drop, {
                    type: Modules.ContainerType.Bank,
                    slot: slot.serialize()
                })
            );
        };

        if (drop) return removePacket();

        // The item and amount we are removing from the container.
        let item = new Item(key, -1, -1, true, count, slot.ability, slot.abilityLevel);

        // Attempt to add the item to the inventory.
        if (this.player.inventory.add(item)) removePacket();
        else this.player.bank.add(item); // Add item back to bank if we can't add to inventory.
    }

    /**
     * Callback for when a player interacts with an NPC.
     * @param npc The NPC instance we are interacting with.
     */

    private handleTalkToNPC(npc: NPC): void {
        if (this.player.quests.isQuestNPC(npc)) {
            this.player.quests.getQuestByNPC(npc)!.triggerTalk(npc);
            return;
        }

        if (this.player.quests.isAchievementNPC(npc)) {
            this.player.quests.getAchievementByNPC(npc)!.converse(npc);
            return;
        }

        // if (Shops.isShopNPC(npc.id)) {
        //     this.world.shops.open(this.player, npc.id);
        //     return;
        // }

        switch (npc.role) {
            case 'banker':
                this.player.send(new NPCPacket(Opcodes.NPC.Bank, {}));
                return;
            case 'enchanter':
                this.player.send(new NPCPacket(Opcodes.NPC.Enchant, {}));
                break;
        }

        if (!npc.hasDialogue()) return;

        this.player.send(
            new NPCPacket(Opcodes.NPC.Talk, {
                id: npc.instance,
                text: npc.talk(this.player)
            })
        );
    }

    // TODO - Refactor all of this.

    private load(): void {
        this.updateInterval = setInterval(() => {
            this.detectAggro();

            if (this.updateTicks % 4 === 0)
                // Every 4 (1.6 seconds) update ticks.
                this.handlePoison();

            if (this.updateTicks % 16 === 0)
                // Every 16 (6.4 seconds) update ticks.
                this.player.cheatScore = 0;

            if (this.updateTicks > 100)
                // Reset them every now and then.
                this.updateTicks = 0;

            this.updateTicks++;
        }, 400);

        this.player.onMovement((x: number, y: number) => {
            this.map.regions.handle(this.player);

            this.detectAreas(x, y);

            this.detectClipping(x, y);
        });

        this.player.onDeath(() => {
            this.player.combat.stop();
        });

        this.player.onHit((attacker, damage) => {
            /**
             * Handles actions whenever the player
             * instance is hit by 'damage' amount
             */

            if (this.player.combat.isRetaliating()) this.player.combat.begin(attacker);

            log.debug(`Player has been hit - damage: ${damage}`);
        });

        this.player.onKill((character) => {
            if (!this.player.quests) {
                log.warning(`${this.player.username} does not have quests initialized.`);
                return;
            }

            let mob = character as Mob;

            if (this.player.quests.isAchievementMob(mob)) {
                let achievement = this.player.quests.getAchievementByMob(mob);

                if (achievement && achievement.isStarted()) achievement.step();
            }
        });

        // this.player.onRegion(() => {
        //     this.player.lastRegionChange = Date.now();

        //     this.map.regions.sendEntities(this.player);

        //     //TODO - Redo
        //     // this.world.region.handle(this.player);
        //     // this.world.region.push(this.player);
        // });

        this.player.connection.onClose(() => {
            this.player.stopHealing();

            /* Avoid a memory leak */
            if (this.updateInterval) clearInterval(this.updateInterval);
            this.updateInterval = null;

            if (this.player.ready) {
                if (config.discordEnabled)
                    this.world.discord.sendWebhook(this.player.username, 'has logged out!');

                if (config.hubEnabled)
                    this.world.api.sendChat(
                        Utils.formatUsername(this.player.username),
                        'has logged out!'
                    );
            }

            this.world.entities.removePlayer(this.player);
        });

        this.player.onTeleport((x: number, y: number, isDoor = false) => {
            if (!this.player.finishedTutorial() && isDoor && this.player.doorCallback) {
                this.player.doorCallback(x, y);
                return;
            }
        });

        this.player.onPoison((info) => {
            this.player.sync();

            if (info) this.player.notify('You have been poisoned.');
            else this.player.notify('The poison has worn off.');

            log.debug(`Player ${this.player.instance} updated poison status.`);
        });

        this.player.onCheatScore(() => {
            /**
             * This is a primitive anti-cheating system.
             * It will not accomplish much, but it is enough for now.
             */

            if (this.player.cheatScore > 10) this.player.timeout();

            log.debug(`Cheat score - ${this.player.cheatScore}`);
        });
    }

    public destroy(): void {
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.updateInterval = null;
    }

    private detectAggro(): void {
        // TODO - Redo
        // let region = this.world.region.regions[this.player.region!];
        // if (!region) return;
        // _.each(region.entities, (character) => {
        //     if (character && character.isMob() && this.canEntitySee(character)) {
        //         let mob = character as Mob,
        //             aggro = mob.canAggro(this.player);
        //         if (aggro) mob.combat.begin(this.player);
        //     }
        // });
    }

    private detectAreas(x: number, y: number): void {
        this.map.forEachAreas((areas: Areas, name: string) => {
            let info = areas.inArea(x, y);

            switch (name) {
                case 'pvp':
                    return this.player.updatePVP(!!info);

                case 'music':
                    return this.player.updateMusic(info);

                case 'overlay':
                    return this.player.updateOverlay(info);

                case 'camera':
                    return this.player.updateCamera(info);

                case 'achievements':
                    if (!info || !info.achievement) return;

                    if (!this.player.achievementsLoaded) return;

                    this.player.finishAchievement(info.achievement);

                    break;

                case 'door':
                    break;
            }
        });
    }

    private detectClipping(x: number, y: number): void {
        let isColliding = this.map.isColliding(x, y);

        if (!isColliding) return;

        this.player.incoming.handleNoClip(x, y);
    }

    private handlePoison(): void {
        if (!this.player.poison) return;

        let info = this.player.poison.split(':'),
            date = parseInt(info[0]),
            time = parseInt(info[1]),
            damage = parseInt(info[2]),
            timeDiff = Date.now() - date;

        if (timeDiff > time) {
            this.player.setPoison('');
            return;
        }

        let hit = new Hit(Modules.Hits.Poison, damage);

        hit.poison = true;

        this.player.combat.hit(this.player, this.player, hit.getData());
    }
}
