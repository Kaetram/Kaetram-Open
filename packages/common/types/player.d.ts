import type { Modules } from '../network';
import type { EntityData } from '@kaetram/common/types/entity';
import type { EquipmentData } from '@kaetram/common/types/equipment';

export interface PlayerData extends EntityData {
    rank: Modules.Ranks;
    pvp: boolean;
    orientation: number;

    experience?: number;
    nextExperience?: number;
    prevExperience?: number;

    mana?: number;
    maxMana?: number;

    equipments: EquipmentData[];
}
