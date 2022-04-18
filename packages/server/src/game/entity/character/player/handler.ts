import config from '@kaetram/common/config';
import { Modules, Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';
import Utils from '@kaetram/common/util/utils';

import {
    Container,
    Quest,
    Equipment as EquipmentPacket,
    NPC as NPCPacket,
    Death
} from '../../../../network/packets';
import Map from '../../../map/map';
import World from '../../../world';
import Hit from '../combat/hit';
import Slot from './containers/slot';

import type Areas from '../../../map/areas/areas';
import type NPC from '../../npc/npc';
import type Mob from '../mob/mob';
import type Player from './player';
import Equipment from './equipment/equipment';
import Character from '../character';
import { ProcessedDoor } from '@kaetram/common/types/map';

export default class Handler {
    private world: World;
    private map: Map;

    private updateTime = 600;

    private updateTicks = 0;
    private updateInterval: NodeJS.Timeout | null = null;

    public constructor(private player: Player) {
        this.world = player.world;
        this.map = player.world.map;

        // Disconnect callback
        this.player.connection.onClose(this.handleClose.bind(this));

        // Death callback
        this.player.onDeath(this.handleDeath.bind(this));

        // Movement-related callbacks
        this.player.onDoor(this.handleDoor.bind(this));
        this.player.onMovement(this.handleMovement.bind(this));

        // Region callback
        this.player.onRegion(this.handleRegion.bind(this));

        // Loading callbacks
        this.player.equipment.onLoaded(this.handleEquipment.bind(this));
        this.player.inventory.onLoaded(this.handleInventory.bind(this));
        this.player.quests.onLoaded(this.handleQuests.bind(this));

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

        // Killing a character callback
        this.player.onKill(this.handleKill.bind(this));

        // Poison callback
        this.player.onPoison(this.handlePoison.bind(this));

        // Cheat-score callback
        this.player.onCheatScore(this.handleCheatScore.bind(this));

        // Update interval callback
        this.updateInterval = setInterval(this.handleUpdate.bind(this), this.updateTime);
    }

    /**
     * Callback handler for when the player's connection is closed.
     */

    private handleClose(): void {
        this.player.stopHealing();

        this.clear();

        if (this.player.ready) {
            if (config.discordEnabled)
                this.world.discord.sendMessage(this.player.username, 'has logged out!');

            if (config.hubEnabled)
                this.world.api.sendChat(Utils.formatName(this.player.username), 'has logged out!');
        }

        this.world.entities.removePlayer(this.player);
    }

    /**
     * Callback for when the player dies.
     */

    private handleDeath(): void {
        this.player.dead = true;

        this.player.combat.stop();

        this.player.send(new Death(this.player.instance));
    }

    /**
     * Receive a callback about the door destination coordinate
     * and quest information (if existant).
     */

    private handleDoor(door: ProcessedDoor): void {
        if (door.quest) {
            let quest = this.player.quests.getQuest(door.quest);

            return quest.doorCallback?.(door, this.player);
        }

        this.player.teleport(door.x, door.y, true);

        log.debug(`[Handler] Going through door: ${door.x} - ${door.y}`);
    }

    /**
     * Handles the player's movement and passes new position as parameters.
     * @param x The new x grid position.
     * @param y The new y grid position.
     */

    private handleMovement(x: number, y: number): void {
        this.map.regions.handle(this.player);

        this.detectAreas(x, y);

        this.detectClipping(x, y);

        this.player.storeOpen = '';
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

        // Send Batch packet to the client.
        this.player.send(
            new Container(Opcodes.Container.Batch, {
                type: Modules.ContainerType.Inventory,
                slots
            })
        );
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
     * Send a packet to the client to load quests.
     */

    private handleQuests(): void {
        let { quests } = this.player.quests.serialize(true);

        this.player.send(new Quest(Opcodes.Quest.Batch, quests));
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
     * Callback sent to the client for when a slot is removed from the bank.
     * @param slot The slot of the bank we just removed data from.
     */

    private handleBankRemove(slot: Slot): void {
        this.player.send(
            new Container(Opcodes.Container.Drop, {
                type: Modules.ContainerType.Bank,
                slot: slot.serialize()
            })
        );
    }

    /**
     * Callback for when a player interacts with an NPC.
     * @param npc The NPC instance we are interacting with.
     */

    private handleTalkToNPC(npc: NPC): void {
        // Primarily for the prevention of packet injection.
        if (!this.player.isAdjacent(npc))
            return log.warning(
                `Player ${this.player.username} tried to talk to NPC ${npc.key} but is not adjacent.`
            );

        let quest = this.player.quests.getQuestFromNPC(npc);

        if (quest) return quest.talkCallback?.(npc, this.player);

        if (npc.store) return this.world.stores.open(this.player, npc);

        switch (npc.role) {
            case 'banker':
                this.player.send(new NPCPacket(Opcodes.NPC.Bank, this.player.bank.serialize()));
                return;
            case 'enchanter':
                this.player.send(new NPCPacket(Opcodes.NPC.Enchant, {}));
                break;
        }

        npc.talk(this.player);
    }

    /**
     * Callback for when a character instance is killed.
     * @param character A character instance, generally a player or a mob.
     */

    private handleKill(character: Character): void {
        log.debug(`Received kill callback for: ${character.instance}.`);

        if (!character.isMob()) return;

        let quest = this.player.quests.getQuestFromMob(character as Mob);

        if (quest) quest.killCallback?.(character as Mob);
    }

    /**
     * Callback for when the player's poison status updates.
     */

    // TODO - Set poison type.
    private handlePoison(info: any): void {
        this.player.sync();

        // Notify the player when the poison status changes.
        if (info) this.player.notify('You have been poisoned.');
        else this.player.notify('The poison has worn off.');

        log.debug(`Player ${this.player.instance} updated poison status.`);
    }

    /**
     * Callback for when the cheat score updates.
     */

    private handleCheatScore(): void {
        /**
         * This is a primitive anti-cheating system.
         * It will not accomplish much, but it is enough for now.
         */

        if (this.player.cheatScore > 10) this.player.timeout();

        log.debug(`Cheat score - ${this.player.cheatScore}`);
    }

    /**
     * Callback function for the update that gets called every `updateTime` seconds.
     */

    private handleUpdate(): void {
        this.detectAggro();

        if (this.isTickInterval(3)) this.parsePoison();

        this.updateTicks++;
    }

    /**
     * Checks for the area the player is currently in at the given
     * `x` and `y` positions. Triggers an update in the player's area
     * state if it differs from the player's current state. (e.g. if
     * the player is not in a PVP area and enters a PVP area, the player's
     * current state differs from the position's state, so the player's
     * state is updated and relayed to the client).
     * @param x The x grid coordinate we are checking the area at.
     * @param y The y grid coordinate we are checking the area at.
     */

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

    /**
     * Takes a `interval` value and modulos it against the current updateTicks.
     * This is to separate an event into a larger interval instead of starting
     * multiple `setInterval` functions. For example, an `interval` of 4 means
     * that the event is called every 4 ticks (or 2400 milliseconds if `updateTime`
     * is set to 600 milliseconds).
     * @param interval The modulo interval.
     * @returns Whether or not the `interval` is reached.
     */

    private isTickInterval(interval: number): boolean {
        return this.updateTicks % interval === 0;
    }

    /**
     * Clears the timeouts and nullifies them (used for disconnection);
     */

    private clear(): void {
        clearInterval(this.updateInterval!);
        this.updateInterval = null;
    }

    // TODO - REFACTOR

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

    private detectClipping(x: number, y: number): void {
        let isColliding = this.map.isColliding(x, y);

        if (!isColliding) return;

        this.player.incoming.handleNoClip(x, y);
    }

    private parsePoison(): void {
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

        // let hit = new Hit(Modules.Hits.Poison, damage);

        // hit.poison = true;

        // this.player.combat.hit(this.player, this.player, hit.getData());
    }
}
