import type { EntityData } from '@kaetram/common/types/entity';

export interface PetData extends EntityData {
    owner: string;
    movementSpeed: number;
}
