import _ from 'lodash';

import Player from './player';
import Skill from './skill/skill';
import Lumberjacking from './skill/impl/lumberjacking';

import { Modules, Opcodes } from '@kaetram/common/network';
import { SerializedSkills, SkillData } from '@kaetram/common/types/skills';
import { Experience, Skill as SkillPacket } from '@kaetram/server/src/network/packets';

export default class Skills {
    private lumberjacking: Lumberjacking = new Lumberjacking();

    private skills: Skill[] = [this.lumberjacking];

    private loadCallback?: () => void;

    public constructor(private player: Player) {
        this.loadCallbacks();
    }

    /**
     * Iterates through the data from the database and finds the
     * matching skill based on the type. Loads the experience into
     * that skill if found.
     * @param data Raw database data containing skill type and experience.
     */

    public load(data: SkillData[]): void {
        _.each(data, (skillData: SkillData) => {
            let skill = this.get(skillData.type);

            if (skill) skill.setExperience(skillData.experience);
        });

        this.loadCallback?.();
    }

    /**
     * Loads all the callbacks for skills. Currently this implies only
     * the experience callback. We use this to determine packets to send
     * to the player's client.
     */

    private loadCallbacks(): void {
        this.forEachSkill((skill: Skill) => skill.onExperience(this.handleExperience.bind(this)));
    }

    /**
     * Skills such as lumberjacking may have loops that need to be stopped
     * whenever an action such as movement or being attacked occurs. This is
     * an overload function that calls the stop() function on all skills.
     */

    public stop(): void {
        this.forEachSkill((skill: Skill) => skill.stop());
    }

    /**
     * Handles skill-based experience gain.
     * @param type The skill that gained experience.
     * @param name The name of the skill.
     * @param experience The amount of experience the skill has.
     * @param level The amount of levels the skill has.
     * @param newLevel Whether the player has gained a new level.
     */

    private handleExperience(
        type: Modules.Skills,
        name: string,
        experience: number,
        level: number,
        newLevel?: boolean
    ): void {
        if (newLevel)
            this.player.popup(
                'Skill level up!',
                `Congratulations, your ${name} skill has reached level ${level}!`,
                '#9933ff'
            );

        this.player.send(
            new Experience(Opcodes.Experience.Skill, {
                instance: this.player.instance,
                amount: experience
            })
        );

        this.player.send(new SkillPacket(Opcodes.Skill.Update, this.skills[type].serialize(true)));
    }

    /**
     * Grabs a skill from our array of skills based on its type.
     * @param type The skill type identifier to look for.
     * @returns The instance of the skill if found, otherwise undefined.
     */

    private get(type: Modules.Skills): Skill | undefined {
        return _.find(this.skills, (skill: Skill) => skill.type === type);
    }

    /**
     * Shortcut function for grabbing the lumberjacking instance.
     * @returns The lumberjacking class instance.
     */

    public getLumberjacking(): Lumberjacking {
        return this.lumberjacking;
    }

    /**
     * Iterates through all the skills and serializes their data.
     * The data is stored in an array so that it can be parsed.
     * @param includeLevel Whether to include the level in the serialized data.
     * @returns Array containing data for each skill (at each index).
     */

    public serialize(includeLevel = false): SerializedSkills {
        let skills: SkillData[] = [];

        this.forEachSkill((skill: Skill) => skills.push(skill.serialize(includeLevel)));

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

    /**
     * Callback for when the skills are loaded from the database,
     * a batch data of skills is sent to the client.
     */

    public onLoaded(callback: () => void): void {
        this.loadCallback = callback;
    }
}
