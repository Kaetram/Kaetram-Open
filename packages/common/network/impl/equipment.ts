import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { Modules, Opcodes } from '@kaetram/common/network';
import type { Bonuses, Enchantments, Light, Stats } from '../../types/item';
import type { DefinePacket } from './utils';

export type EquipmentType = 'weapon' | 'armour' | 'pendant' | 'ring' | 'boots';

export interface EquipmentData {
    type: Modules.Equipment;
    key: string;
    name?: string;
    count: number;
    enchantments: Enchantments;
    attackRange?: number; // Specifically for weapon type.
    poisonous?: boolean;
    attackStats?: Stats;
    defenseStats?: Stats;
    bonuses?: Bonuses;
    attackStyle?: Modules.AttackStyle;
    attackStyles?: Modules.AttackStyle[];
    bow?: boolean;
    archer?: boolean;
    light?: Light;
}

export interface SerializedEquipment {
    equipments: EquipmentData[];
}

type Equipment = DefinePacket<{
    [Opcodes.Equipment.Batch]: { data: SerializedEquipment };
    [Opcodes.Equipment.Equip]: { data: EquipmentData };
    [Opcodes.Equipment.Unequip]: { type: Modules.Equipment; count?: number };
    [Opcodes.Equipment.Style]: { attackStyle: Modules.AttackStyle; attackRange: number };
}>;

export type EquipmentPacketData = Equipment['Data'];
export type EquipmentPacketValues = Equipment['Values'];
export type EquipmentPacketCallback = Equipment['Callback'];
export type EquipmentPacketOutgoing = Equipment['Outgoing'];

export default class EquipmentPacket<O extends Opcodes.Equipment> extends Packet {
    public constructor(opcode: O, data: EquipmentPacketData[O]) {
        super(Packets.Equipment, opcode, data);
    }
}
