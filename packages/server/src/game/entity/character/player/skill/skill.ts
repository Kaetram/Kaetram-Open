import Formulas from '../../../../../info/formulas';

import { Modules } from '@kaetram/common/network';

import type { SkillData } from '@kaetram/common/types/skills';

type ExperienceCallback = (
    type: Modules.Skills,
    name: string,
    withInfo: boolean,
    experience: number,
    level: number,
    newLevel?: boolean
) => void;

export default abstract class Skill {
    public name = '';
    public level = 1;
    public experience = 0;
    public nextExperience = 0;

    public combat = false;

    private experienceCallback?: ExperienceCallback;

    public constructor(public type: Modules.Skills) {
        this.name = Modules.Skills[this.type];
    }

    /**
     * Unimplemented `stop()` function for the subclasses.
     */

    public stop(): void {
        //
    }

    /**
     * Gets the percentage of the skill's experience to the next level.
     */

    public getPercentage(): number {
        let prevExperience = Formulas.prevExp(this.experience),
            nextExperience = Formulas.nextExp(this.experience),
            percentage = (this.experience - prevExperience) / (nextExperience - prevExperience);

        // Update the next experience for the skill.
        this.nextExperience = nextExperience;

        return percentage < 0 ? 0 : percentage;
    }

    /**
     * Adds experience to the skill and creates a callback. The callback
     * contains the name of the skill, experience we are adding, the
     * current level after adding experience, and whether the
     * experience added resulted in a level-up.
     * @param experience How much exp we are adding to the skill.
     * @param withInfo Whether to disable the experience info.
     */

    public addExperience(experience: number, withInfo = true): void {
        let previousLevel = this.level;

        this.setExperience(this.experience + experience);

        this.experienceCallback?.(
            this.type,
            this.name,
            withInfo,
            experience,
            this.level,
            this.level !== previousLevel
        );
    }

    /**
     * Sets the experience of the skill to the parameter provided.
     * @param experience The experience we are setting the skill to.
     */

    public setExperience(experience: number): void {
        this.level = Formulas.expToLevel(experience);
        this.experience = experience;
    }

    /**
     * Serializes general data about the skill. The level is sometimes not
     * included when we just store the skill to the database.
     * @param includeLevel Whether or not to include the level into the serializing.
     * @returns SkillData object containing information about the skill.
     */

    public serialize(includeLevel = false): SkillData {
        let data: SkillData = {
            type: this.type,
            experience: this.experience
        };

        if (includeLevel) {
            data.level = this.level;
            data.percentage = this.getPercentage();
            data.nextExperience = this.nextExperience;
            data.combat = this.combat;
        }

        return data;
    }

    /**
     * Callback for when a skill experience changes.
     * @param callback The new experience of the skill.
     */

    public onExperience(callback: ExperienceCallback): void {
        this.experienceCallback = callback;
    }
}
