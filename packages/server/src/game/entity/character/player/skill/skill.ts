import Formulas from '../../../../../info/formulas';

import { Modules } from '@kaetram/common/network';
import { SkillData } from '@kaetram/common/types/skills';

export default abstract class Skill {
    public experience = 0;

    private experienceCallback?: (experience: number) => void;

    public constructor(public type: Modules.Skills) {}

    /**
     * Converts the skill's experience to a level integer.
     * @returns Level integer of the skill.
     */

    public getLevel(): number {
        return Formulas.expToLevel(this.experience);
    }

    /**
     * Adds experience to the skill.
     * @param experience How much exp we are adding to the skill.
     */

    public addExperience(experience: number): void {
        this.setExperience(this.experience + experience);
    }

    /**
     * Sets the experience of the skill to the parameter provided
     * and creates a callback each time exp changes.
     * @param experience The experience we are setting the skill to.
     */

    public setExperience(experience: number): void {
        this.experience = experience;

        this.experienceCallback?.(experience);
    }

    /**
     * Serializes general data about the skill.
     * @returns SkillData object containing information about the skill.
     */

    public serialize(): SkillData {
        return {
            type: this.type,
            experience: this.experience,
            level: this.getLevel()
        };
    }

    /**
     * Callback for when a skill experience changes.
     * @param callback The new experience of the skill.
     */

    public onExperience(callback: (experience: number) => void): void {
        this.experienceCallback = callback;
    }
}
