/* eslint-disable max-classes-per-file */

import type * as Modules from '@kaetram/common/src/modules';
import Packets from '@kaetram/common/src/packets';

import Utils from '../util/utils';

import type { ProcessedArea } from '@kaetram/common/types/map';
import type { ShopData } from '../controllers/shops';
import type { HitData } from '../game/entity/character/combat/hit';
import type { AchievementData } from '../game/entity/character/player/achievement';
import type Slot from '../game/entity/character/player/containers/slot';
import type { EquipmentData } from '../game/entity/character/player/equipment/equipment';
import type { PlayerExperience } from '../game/entity/character/player/player';
import type { ProfessionsInfo } from '../game/entity/character/player/professions/professions';
import type { QuestInfo } from '../game/entity/character/player/quests/quest';
import type Entity from '../game/entity/entity';
import type { EntityState } from '../game/entity/entity';
import type { ProjectileData } from '../game/entity/objects/projectile';
import type { RegionTileData, Tile, TilesetData } from '../region/region';

export abstract class Packet<Info = unknown, Opcode = number | string> {
    protected abstract id: number;
    protected opcode?: Opcode;

    public constructor(infoOrOpcode: Info | Opcode, protected info?: Info) {
        if (info) this.opcode = infoOrOpcode as Opcode;
        else this.info = infoOrOpcode as Info;
    }

    public serialize(): [id: number, ...opcode: Opcode[], info: Info] {
        let { id, info, opcode } = this,
            data: [number, ...Opcode[], Info] = [id, info];

        if (opcode !== undefined) data.splice(1, 0, opcode);

        return data;
    }
}

type ContainerPacket =
    | [size: number, slots: Slot[]]
    | Slot
    | {
          index: number;
          count: number;
      };

export default {
    Handshake: class extends Packet<{ id: string; development: boolean }> {
        id = Packets.Handshake;
    },

    Welcome: class extends Packet<{
        instance: string;
        username: string;
        x: number;
        y: number;
        rights: number;
        hitPoints: number[];
        mana: number[];
        experience: number;
        nextExperience: number;
        prevExperience: number;
        level: number;
        lastLogin: number;
        pvpKills: number;
        pvpDeaths: number;
        orientation: number;
        movementSpeed: number;
    }> {
        id = Packets.Welcome;
    },

    Spawn: class extends Packet<EntityState> {
        id = Packets.Spawn;

        public constructor(entity: Entity) {
            super(entity.getState());
        }
    },

    List: class extends Packet<string[]> {
        id = Packets.List;
    },

    Sync: class extends Packet<{
        id: string;
        orientation?: Modules.Orientation;
        attackRange?: number;
        playerHitPoints?: number;
        maxHitPoints?: number;
        mana?: number;
        maxMana?: number;
        level?: number;
        armour?: string;
        weapon?: EquipmentData;
        poison?: boolean;
        movementSpeed?: number;
    }> {
        id = Packets.Sync;
    },

    Equipment: class extends Packet<
        | [string]
        | {
              armour: EquipmentData;
              weapon: EquipmentData;
              pendant: EquipmentData;
              ring: EquipmentData;
              boots: EquipmentData;
          }
        | {
              type: Modules.Equipment;
              name: string;
              string: string;
              count: number;
              ability: number;
              abilityLevel: number;
              power: number;
          }
    > {
        id = Packets.Equipment;
    },

    Movement: class extends Packet<
        | [instance: string, orientation: number]
        | { instance: string; force: boolean }
        | { id: string; state: boolean }
        | {
              id: string;
              x: number;
              y: number;
              forced?: boolean;
              teleport?: boolean;
          }
        | {
              attackerId: string;
              targetId: string;
              isRanged?: boolean;
              attackRange?: number;
          }
    > {
        id = Packets.Movement;
    },

    Teleport: class extends Packet<{
        id: string;
        x: number;
        y: number;
        withAnimation: boolean;
    }> {
        id = Packets.Teleport;
    },

    Despawn: class extends Packet<string> {
        id = Packets.Despawn;
    },

    Animation: class extends Packet<{ action: Modules.Actions }, string> {
        id = Packets.Animation;
    },

    // TODO - Revise this when going over combat.
    Combat: class extends Packet<{
        attackerId: string;
        targetId: string;
        x?: number;
        y?: number;
        hitInfo?: HitData;
    }> {
        id = Packets.Combat;
    },

    Projectile: class extends Packet<ProjectileData> {
        id = Packets.Projectile;
    },

    Population: class extends Packet<number> {
        id = Packets.Population;
    },

    Points: class extends Packet<{
        id: string;
        hitPoints: number;
        mana: null;
    }> {
        id = Packets.Points;
    },

    Network: class extends Packet<typeof Packets.NetworkOpcode> {
        id = Packets.Network;
    },

    Chat: class extends Packet<
        | {
              name: string;
              text: string;
              colour: string;
              isGlobal: boolean;
              withBubble: boolean;
          }
        | {
              id: string;
              name: string;
              withBubble: boolean;
              text: string;
              duration: number;
          }
    > {
        id = Packets.Chat;
    },

    Command: class extends Packet<{ command: string }> {
        id = Packets.Command;
    },

    /**
     * Should we just have a packet that represents containers
     * as a whole or just send it separately for each?
     */

    Inventory: class extends Packet<ContainerPacket> {
        id = Packets.Inventory;
    },

    Bank: class extends Packet<ContainerPacket> {
        id = Packets.Bank;
    },

    Ability: class extends Packet<never> {
        id = Packets.Ability;
    },

    Quest: class extends Packet<
        | { id: number; stage?: number }
        | { achievements: AchievementData[] }
        | { quests: QuestInfo[] }
        | {
              id: number;
              name: string;
              progress?: number;
              count?: number;
              isQuest: boolean;
          }
    > {
        id = Packets.Quest;
    },

    Notification: class extends Packet<{
        title?: string;
        message: string;
        colour?: string;
    }> {
        id = Packets.Notification;
    },

    Blink: class extends Packet<string> {
        id = Packets.Blink;
    },

    Heal: class extends Packet<{ id: string; type: string; amount: number }> {
        id = Packets.Heal;
    },

    Experience: class extends Packet<
        { instance: string } | { id: string; amount: number } | PlayerExperience
    > {
        id = Packets.Experience;
    },

    Death: class extends Packet<string> {
        id = Packets.Death;
    },

    Audio: class extends Packet<string> {
        id = Packets.Audio;
    },

    NPC: class extends Packet<
        | Record<string, never>
        | { id: string; countdown: number }
        | {
              id: string;
              text: string;
              nonNPC?: boolean;
          }
    > {
        id = Packets.NPC;
    },

    Respawn: class extends Packet<Pos, string> {
        id = Packets.Respawn;
    },

    Enchant: class extends Packet<{ type: string; index: number }> {
        id = Packets.Enchant;
    },

    Guild: class extends Packet<never> {
        id = Packets.Guild;
    },

    Pointer: class extends Packet<{
        id?: string;
        x?: number;
        y?: number;
        button?: string;
    }> {
        id = Packets.Pointer;
    },

    PVP: class extends Packet<boolean, string> {
        id = Packets.PVP;
    },

    Shop: class extends Packet<
        | ShopData
        | { id: number; index: number }
        | { id: number; slotId: number; currency: string; price: number }
        | { instance: string; npcId: number; shopData: ShopData }
    > {
        id = Packets.Shop;
    },

    Minigame: class extends Packet<{ opcode: number; countdown: number }> {
        id = Packets.Minigame;
    },

    Region: class extends Packet<string, number> {
        id = Packets.Region;

        private bufferSize: number;

        public constructor(
            opcode: number,
            info:
                | RegionTileData[]
                | TilesetData
                | { id: string; type: 'remove' }
                | { index: number; data: number }
                | { index: number; newTile: Tile }
        ) {
            super(opcode, Utils.compressData(JSON.stringify(info)));

            this.bufferSize = Utils.getBufferSize(info);
        }

        public override serialize(): [
            id: number,
            opcode: number,
            bufferSize: number,
            info: string
        ] {
            return [this.id, this.opcode, this.bufferSize, this.info];
        }
    },

    Overlay: class extends Packet<ProcessedArea | { image: string; colour: string }> {
        id = Packets.Overlay;
    },

    Camera: class extends Packet<typeof Packets.CameraOpcode> {
        id = Packets.Camera;
    },

    Bubble: class extends Packet<{
        id: string;
        text: string;
        duration: number;
        isObject: boolean;
        info: { id: string; x: number; y: number };
    }> {
        id = Packets.Bubble;
    },

    Profession: class extends Packet<
        | { data: ProfessionsInfo[] }
        | {
              id: number;
              level: number;
              percentage: string;
          }
    > {
        id = Packets.Profession;
    },

    BuildUp: class extends Packet<never> {
        id = Packets.BuildUp;
    }
};
