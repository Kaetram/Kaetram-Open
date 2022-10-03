import { Modules } from '@kaetram/common/network';

export default class Ability {
    public constructor(
        public type: Modules.AbilityType,
        public key: string,
        public level: number
    ) {}

    /**
     * Updates the ability information.
     * @param level New level to set the ability to.
     */

    public update(level: number): void {
        this.level = level;
    }
}
