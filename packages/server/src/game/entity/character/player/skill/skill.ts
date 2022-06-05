import Formulas from '../../../../../info/formulas';

import log from '@kaetram/common/util/log';

import { Modules } from '@kaetram/common/network';
import { SkillData } from '@kaetram/common/types/skills';

type ExperienceCallback = (
    name: string,
    experience: number,
    level: number,
    newLevel?: boolean
) => void;

export default abstract class Skill {
    public experience = 0;

    private experienceCallback?: ExperienceCallback;

    public constructor(public type: Modules.Skills, public name = '') {}

    /**
     * Unimplemented `stop()` function for the subclasses.
     */

    public stop(): void {
        log.debug(`[Skill] stop() uninitialized in ${this.type}`);
    }

    /**
     * Converts the skill's experience to a level integer.
     * @returns Level integer of the skill.
     */

    public getLevel(): number {
        return Formulas.expToLevel(this.experience);
    }

    /**
     * Gets the percentage of the skill's experience to the next level.
     */

    public getPercentage(): number {
        let prevExperience = Formulas.prevExp(this.getLevel() - 1),
            nextExperience = Formulas.nextExp(this.experience);

        return (this.experience - prevExperience) / (nextExperience - prevExperience);
    }

    /**
     * Adds experience to the skill and creates a callback. The callback
     * contains the name of the skill, experience we are adding, the
     * current level after adding experience, and whether the
     * experience added resulted in a level-up.
     * @param experience How much exp we are adding to the skill.
     */

    public addExperience(experience: number): void {
        let level = this.getLevel();

        this.setExperience(this.experience + experience);

        // Level after adding experience.
        let currentLevel = this.getLevel();

        this.experienceCallback?.(this.name, experience, currentLevel, level !== currentLevel);
    }

    /**
     * Sets the experience of the skill to the parameter provided.
     * @param experience The experience we are setting the skill to.
     */

    public setExperience(experience: number): void {
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
            data.level = this.getLevel();
            data.percentage = this.getPercentage();
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
