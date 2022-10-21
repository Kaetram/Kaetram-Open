import { Modules } from '@kaetram/common/network';

export default class Ability {
    public constructor(
        public type: Modules.AbilityType,
        public key: string,
        public level: number,
        public quickSlot = -1
    ) {}

    /**
     * Updates the ability information.
     * @param level New level to set the ability to.
     */

    public update(level: number, quickSlot = this.quickSlot): void {
        this.level = level;
        this.quickSlot = quickSlot;
    }
}
