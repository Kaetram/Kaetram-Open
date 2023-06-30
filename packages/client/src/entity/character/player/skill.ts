import { Modules } from '@kaetram/common/network';

export default class Skill {
    public name: string;
    public percentage = 0;
    public nextExperience = 0;

    public constructor(public type: Modules.Skills, public experience = 0, public level = 1) {
        this.name = Modules.Skills[type];
    }

    /**
     * Updates the current skill's experience and level.
     * @param experience Experience we are updating to.
     * @param level Level we are updating to.
     */

    public update(
        experience: number,
        nextExperience: number,
        level: number,
        percentage: number
    ): void {
        this.experience = experience;
        this.nextExperience = nextExperience;
        this.level = level || this.level;
        this.percentage = percentage || 0;
    }
}
