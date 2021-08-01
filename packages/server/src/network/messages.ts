/* eslint-disable max-classes-per-file */

import { Opcodes, Packets } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import type { Modules } from '@kaetram/common/network';
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
    protected abstract id: Packets;
    protected opcode;

    public constructor(info: Info);
    public constructor(opcode: Opcode, info?: Info);
    public constructor(infoOrOpcode: Info | Opcode, protected info?: Info) {
        if (info) this.opcode = infoOrOpcode as Opcode;
        else this.info = infoOrOpcode as Info;
    }

    public serialize(): [id: Packets, ...opcode: Opcode[], info: Info] {
        let { id, info, opcode } = this,
            data: [Packets, ...Opcode[], Info] = [id, info!];

        if (opcode !== undefined) data.splice(1, 0, opcode);

        return data;
    }
}

type ContainerPacket = [size: number, slots: Slot[]] | Slot | { index: number; count: number };

export default {
    Handshake: class extends Packet<{ id: string }> {
        public id = Packets.Handshake;
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
        nextExperience?: number;
        prevExperience: number;
        level: number;
        lastLogin: number;
        pvpKills: number;
        pvpDeaths: number;
        orientation: number;
        movementSpeed: number;
    }> {
        public id = Packets.Welcome;
    },

    Spawn: class extends Packet<EntityState> {
        public id = Packets.Spawn;

        public constructor(entity: Entity) {
            super(entity.getState());
        }
    },

    List: class extends Packet<string[]> {
        public id = Packets.List;
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
        public id = Packets.Sync;
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
          },
        Opcodes.Equipment
    > {
        public id = Packets.Equipment;
    },

    Movement: class extends Packet<
        | [instance: string, orientation: number]
        | { instance: string; force?: boolean }
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
          },
        Opcodes.Movement
    > {
        public id = Packets.Movement;
    },

    Teleport: class extends Packet<{
        id: string;
        x: number;
        y: number;
        withAnimation?: boolean;
    }> {
        public id = Packets.Teleport;
    },

    Despawn: class extends Packet<string> {
        public id = Packets.Despawn;
    },

    Animation: class extends Packet<{ action: Modules.Actions }, string> {
        public id = Packets.Animation;
    },

    // TODO - Revise this when going over combat.
    Combat: class extends Packet<
        {
            attackerId: string | null;
            targetId: string | null;
            x?: number;
            y?: number;
            hitInfo?: HitData;
        },
        Opcodes.Combat
    > {
        public id = Packets.Combat;
    },

    Projectile: class extends Packet<ProjectileData, Opcodes.Projectile> {
        public id = Packets.Projectile;
    },

    Population: class extends Packet<number> {
        public id = Packets.Population;
    },

    Points: class extends Packet<{
        id: string;
        hitPoints: number;
        mana: null;
    }> {
        public id = Packets.Points;
    },

    Network: class extends Packet<Opcodes.Network> {
        public id = Packets.Network;
    },

    Chat: class extends Packet<
        | {
              name: string;
              text: string;
              colour?: string;
              isGlobal?: boolean;
              withBubble?: boolean;
          }
        | {
              id: string;
              name: string;
              withBubble: boolean;
              text: string;
              duration: number;
          }
    > {
        public id = Packets.Chat;
    },

    Command: class extends Packet<{ command: string }, Opcodes.Camera> {
        public id = Packets.Command;
    },

    /**
     * Should we just have a packet that represents containers
     * as a whole or just send it separately for each?
     */

    Inventory: class extends Packet<ContainerPacket, Opcodes.Inventory> {
        public id = Packets.Inventory;
    },

    Bank: class extends Packet<ContainerPacket, Opcodes.Bank> {
        public id = Packets.Bank;
    },

    Ability: class extends Packet<never> {
        public id = Packets.Ability;
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
          },
        Opcodes.Quest
    > {
        public id = Packets.Quest;
    },

    Notification: class extends Packet<
        {
            title?: string;
            message: string;
            colour?: string;
        },
        Opcodes.Notification
    > {
        public id = Packets.Notification;
    },

    Blink: class extends Packet<string> {
        public id = Packets.Blink;
    },

    Heal: class extends Packet<{ id: string; type: string; amount: number }> {
        public id = Packets.Heal;
    },

    Experience: class extends Packet<
        { instance: string } | { id: string; amount: number } | PlayerExperience,
        Opcodes.Experience
    > {
        public id = Packets.Experience;
    },

    Death: class extends Packet<string> {
        public id = Packets.Death;
    },

    Audio: class extends Packet<string> {
        public id = Packets.Audio;
    },

    NPC: class extends Packet<
        | Record<string, never>
        | { id: string; countdown: number }
        | {
              id: string | null;
              text?: string;
              nonNPC?: boolean;
          },
        Opcodes.NPC
    > {
        public id = Packets.NPC;
    },

    Respawn: class extends Packet<Pos, string> {
        public id = Packets.Respawn;
    },

    Enchant: class extends Packet<{ type: string; index: number }, Opcodes.Enchant> {
        public id = Packets.Enchant;
    },

    Guild: class extends Packet<never, Opcodes.Guild> {
        public id = Packets.Guild;
    },

    Pointer: class extends Packet<
        {
            id?: string;
            x?: number;
            y?: number;
            button?: string;
        },
        Opcodes.Pointer
    > {
        public id = Packets.Pointer;
    },

    PVP: class extends Packet<boolean, string> {
        public id = Packets.PVP;
    },

    Shop: class extends Packet<
        | ShopData
        | { id: number; index: number }
        | { id: number; slotId: number; currency: string; price: number }
        | { instance: string; npcId: number; shopData?: ShopData },
        Opcodes.Shop
    > {
        public id = Packets.Shop;
    },

    Minigame: class extends Packet<{ opcode: number; countdown: number }, Opcodes.Minigame> {
        public id = Packets.Minigame;
    },

    Region: class extends Packet<string, Opcodes.Region> {
        public id = Packets.Region;

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
            return [this.id, this.opcode!, this.bufferSize, this.info!];
        }
    },

    Overlay: class extends Packet<
        ProcessedArea | { image: string; colour: string },
        Opcodes.Overlay
    > {
        public id = Packets.Overlay;
    },

    Camera: class extends Packet<Opcodes.Camera> {
        public id = Packets.Camera;
    },

    Bubble: class extends Packet<{
        id: string;
        text: string;
        duration: number;
        isObject: boolean;
        info: { id: string; x: number; y: number };
    }> {
        public id = Packets.Bubble;
    },

    Profession: class extends Packet<
        | { data: ProfessionsInfo[] }
        | {
              id: number;
              level: number;
              percentage: string;
          },
        Opcodes.Profession
    > {
        public id = Packets.Profession;
    },

    BuildUp: class extends Packet<never> {
        public id = Packets.BuildUp;
    }
};
