import { Modules } from '@kaetram/common/network';

export default {
    INVALID_LEVEL(type: Modules.Skills, level: number) {
        switch (type) {
            case Modules.Skills.Fletching: {
                return `You must be level ${level} in order to fletch this.`;
            }

            case Modules.Skills.Chiseling:
            case Modules.Skills.Crafting: {
                return `You must be level ${level} in order to craft this.`;
            }

            case Modules.Skills.Cooking: {
                return `You must be level ${level} in order to cook this.`;
            }

            case Modules.Skills.Smithing: {
                return `You must be level ${level} in order to smith this.`;
            }

            case Modules.Skills.Smelting: {
                return `You must be level ${level} in order to smelt this.`;
            }

            case Modules.Skills.Alchemy: {
                return `You must be level ${level} in order to brew this.`;
            }

            default: {
                return 'INVALID_LEVEL() NOT IMPLEMENTED';
            }
        }
    }
};
