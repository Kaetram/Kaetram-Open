/* eslint-disable max-classes-per-file */

import { Opcodes, Packets } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

import type {
    AnimationData,
    BubbleData,
    ChatData,
    CombatData,
    CombatHitData,
    CombatSyncData,
    CommandData,
    ContainerAddData,
    ContainerBatchData,
    ContainerRemoveData,
    EnchantData,
    EquipmentBatchData,
    EquipmentEquipData,
    EquipmentUnequipData,
    ExperienceCombatData,
    ExperienceProfessionData,
    HandshakeData,
    HealData,
    MinigameData,
    MovementFollowData,
    MovementMoveData,
    MovementOrientateData,
    MovementStateData,
    MovementStopData,
    NotificationData,
    NPCBankData,
    NPCCountdownData,
    NPCEnchantData,
    NPCStoreData,
    NPCTalkData,
    OverlayDarknessData,
    OverlayLampData,
    OverlaySetData,
    PointerButtonData,
    PointerData,
    PointerLocationData,
    PointerRelativeData,
    PointerRemoveData,
    PointsData,
    ProfessionBatchData,
    ProfessionUpdateData,
    ProjectileData,
    QuestAchievementBatchData,
    QuestBatchData,
    QuestFinishData,
    QuestProgressData,
    RegionModifyData,
    RegionRenderData,
    RegionTilesetData,
    RegionUpdateData,
    ShopBuyData,
    ShopOpenData,
    ShopRefreshData,
    ShopRemoveData,
    ShopSelectData,
    ShopSellData,
    SpawnData,
    SyncData,
    TeleportData,
    WelcomeData
} from '@kaetram/common/types/messages';
import type Entity from '../game/entity/entity';

export abstract class Packet<Info = unknown, Opcode = number | string> {
    protected abstract packet: Packets;
    protected opcode;

    public constructor(info: Info);
    public constructor(opcode: Opcode, info?: Info);
    public constructor(infoOrOpcode: Info | Opcode, protected info?: Info) {
        if (info) this.opcode = infoOrOpcode as Opcode;
        else this.info = infoOrOpcode as Info;
    }

    public serialize(): [id: Packets, ...opcode: Opcode[], info: Info] {
        let { packet, info, opcode } = this,
            data: [Packets, ...Opcode[], Info] = [packet, info!];

        if (opcode !== undefined) data.splice(1, 0, opcode);

        return data;
    }
}

export default {
    Handshake: class extends Packet<HandshakeData> {
        public packet = Packets.Handshake;
    },

    Welcome: class extends Packet<WelcomeData> {
        public packet = Packets.Welcome;
    },

    Spawn: class extends Packet<SpawnData> {
        public packet = Packets.Spawn;

        public constructor(entity: Entity) {
            super(entity.getState());
        }
    },

    List: class extends Packet<string[]> {
        public packet = Packets.List;
    },

    Sync: class extends Packet<SyncData> {
        public packet = Packets.Sync;
    },

    Equipment: class extends Packet<
        EquipmentBatchData | EquipmentEquipData | EquipmentUnequipData,
        Opcodes.Equipment
    > {
        public packet = Packets.Equipment;
    },

    Movement: class extends Packet<
        | MovementMoveData
        | MovementFollowData
        | MovementStopData
        | MovementStateData
        | MovementOrientateData,
        Opcodes.Movement
    > {
        public packet = Packets.Movement;
    },

    Teleport: class extends Packet<TeleportData> {
        public packet = Packets.Teleport;
    },

    Despawn: class extends Packet<string> {
        public packet = Packets.Despawn;
    },

    Animation: class extends Packet<AnimationData, string> {
        public packet = Packets.Animation;
    },

    // TODO - Revise this when going over combat.
    Combat: class extends Packet<CombatData | CombatHitData | CombatSyncData, Opcodes.Combat> {
        public packet = Packets.Combat;
    },

    Projectile: class extends Packet<ProjectileData, Opcodes.Projectile> {
        public packet = Packets.Projectile;
    },

    Population: class extends Packet<number> {
        public packet = Packets.Population;
    },

    Points: class extends Packet<PointsData> {
        public packet = Packets.Points;
    },

    Network: class extends Packet<Opcodes.Network> {
        public packet = Packets.Network;
    },

    Chat: class extends Packet<ChatData> {
        public packet = Packets.Chat;
    },

    Command: class extends Packet<CommandData, Opcodes.Command> {
        public packet = Packets.Command;
    },

    /**
     * Should we just have a packet that represents containers
     * as a whole or just send it separately for each?
     */

    Inventory: class extends Packet<
        ContainerBatchData | ContainerAddData | ContainerRemoveData,
        Opcodes.Inventory
    > {
        public packet = Packets.Inventory;
    },

    Bank: class extends Packet<
        ContainerBatchData | ContainerAddData | ContainerRemoveData,
        Opcodes.Bank
    > {
        public packet = Packets.Bank;
    },

    Ability: class extends Packet<unknown> {
        public packet = Packets.Ability;
    },

    Quest: class extends Packet<
        QuestBatchData | QuestAchievementBatchData | QuestProgressData | QuestFinishData,
        Opcodes.Quest
    > {
        public packet = Packets.Quest;
    },

    Notification: class extends Packet<NotificationData, Opcodes.Notification> {
        public packet = Packets.Notification;
    },

    Blink: class extends Packet<string> {
        public packet = Packets.Blink;
    },

    Heal: class extends Packet<HealData> {
        public packet = Packets.Heal;
    },

    Experience: class extends Packet<
        ExperienceCombatData | ExperienceProfessionData,
        Opcodes.Experience
    > {
        public packet = Packets.Experience;
    },

    Death: class extends Packet<string> {
        public packet = Packets.Death;
    },

    Audio: class extends Packet<string> {
        public packet = Packets.Audio;
    },

    NPC: class extends Packet<
        NPCTalkData | NPCStoreData | NPCBankData | NPCEnchantData | NPCCountdownData,
        Opcodes.NPC
    > {
        public packet = Packets.NPC;
    },

    Respawn: class extends Packet<number, string | number> {
        public packet = Packets.Respawn;

        public constructor(public instance: string, public x: number, public y: number) {
            super(instance);
        }

        public override serialize(): [Packets, string, number, number] {
            return [this.packet, this.instance, this.x, this.y];
        }
    },

    Enchant: class extends Packet<EnchantData, Opcodes.Enchant> {
        public packet = Packets.Enchant;
    },

    Guild: class extends Packet<unknown, Opcodes.Guild> {
        public packet = Packets.Guild;
    },

    Pointer: class extends Packet<
        | PointerData
        | PointerLocationData
        | PointerRelativeData
        | PointerRemoveData
        | PointerButtonData,
        Opcodes.Pointer
    > {
        public packet = Packets.Pointer;
    },

    PVP: class extends Packet<boolean, string> {
        public packet = Packets.PVP;

        public constructor(public id: string, public pvp: boolean) {
            super(id);
        }

        public override serialize(): [Packets, string, boolean] {
            return [this.packet, this.id, this.pvp];
        }
    },

    Shop: class extends Packet<
        | ShopOpenData
        | ShopBuyData
        | ShopSellData
        | ShopRefreshData
        | ShopSelectData
        | ShopRemoveData,
        Opcodes.Shop
    > {
        public packet = Packets.Shop;
    },

    Minigame: class extends Packet<MinigameData, Opcodes.Minigame> {
        public packet = Packets.Minigame;
    },

    Region: class extends Packet<string, Opcodes.Region> {
        public packet = Packets.Region;

        private bufferSize: number;

        public constructor(
            opcode: Opcodes.Region,
            info: RegionRenderData | RegionModifyData | RegionUpdateData | RegionTilesetData
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
            return [this.packet, this.opcode!, this.bufferSize, this.info!];
        }
    },

    Overlay: class extends Packet<
        OverlaySetData | OverlayLampData | OverlayDarknessData,
        Opcodes.Overlay
    > {
        public packet = Packets.Overlay;
    },

    Camera: class extends Packet<Opcodes.Camera> {
        public packet = Packets.Camera;
    },

    Bubble: class extends Packet<BubbleData> {
        public packet = Packets.Bubble;
    },

    Profession: class extends Packet<
        ProfessionBatchData | ProfessionUpdateData,
        Opcodes.Profession
    > {
        public packet = Packets.Profession;
    },

    BuildUp: class extends Packet<never> {
        public packet = Packets.BuildUp;
    }
};
