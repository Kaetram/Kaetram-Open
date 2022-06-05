import { Modules } from '@kaetram/common/network';

export default class Skill {
    public name = Modules.Skills[this.type];
    public percentage = 0;

    public constructor(public type: Modules.Skills, public experience = 0, public level = 1) {}

    /**
     * Updates the current skill's experience and level.
     * @param experience Experience we are updating to.
     * @param level Level we are updating to.
     */

    public update(experience: number, level: number, percentage: number): void {
        this.experience = experience;
        this.level = level || this.level;
        this.percentage = percentage || this.percentage;
    }
}
