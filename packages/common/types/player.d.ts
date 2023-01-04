import type { EntityData } from '@kaetram/common/types/entity';
import type { EquipmentData } from '@kaetram/common/types/equipment';

export interface PlayerData extends EntityData {
    rights: number;
    pvp: boolean;
    orientation: number;

    experience?: number;
    nextExperience?: number;
    prevExperience?: number;

    mana?: number;
    maxMana?: number;

    equipments: EquipmentData[];
}
