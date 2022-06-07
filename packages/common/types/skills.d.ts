import Modules from '../network/modules';

export interface SkillData {
    type: Modules.Skills;
    experience: number;
    level?: number;
    percentage?: number;
}

export interface SerializedSkills {
    skills: SkillData[];
}
