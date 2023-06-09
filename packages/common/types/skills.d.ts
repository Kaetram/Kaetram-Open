import type { Modules } from '@kaetram/common/network';

export interface SkillData {
    type: Modules.Skills;
    experience: number;
    level?: number;
    percentage?: number;
    nextExperience?: number;
    combat?: boolean;
}

export interface SerializedSkills {
    skills: SkillData[];
    cheater: boolean;
}
