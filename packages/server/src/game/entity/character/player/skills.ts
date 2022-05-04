import Player from './player';
import Skill from './skill/skill';
import Lumberjacking from './skill/impl/lumberjacking';
import { SerializedSkills, SkillData } from '@kaetram/common/types/skills';
import _ from 'lodash';

export default class Skills {
    private lumberjacking: Lumberjacking = new Lumberjacking();

    private skills: Skill[] = [this.lumberjacking];

    public constructor(private player: Player) {}

    public load(data: SkillData[]): void {
        console.log(data);
    }

    /**
     * Iterates through all the skills and serializes their data.
     * The data is stored in an array so that it can be parsed.
     * @returns Array containing data for each skill (at each index).
     */

    public serialize(): SerializedSkills {
        let skills: SkillData[] = [];

        this.forEachSkill((skill: Skill) => skills.push(skill.serialize()));

        return {
            skills
        };
    }

    /**
     * Iterates through all the skills and creates a callback.
     * @param callback Contains skill being iterated currently.
     */

    private forEachSkill(callback: (skill: Skill) => void): void {
        _.each(this.skills, callback);
    }
}
