import { Modules } from '@kaetram/common/network';

export default {
    INVALID_WEAPON(type: Modules.Skills) {
        switch (type) {
            case Modules.Skills.Lumberjacking: {
                return 'You must equip an axe in order to cut trees.';
            }

            case Modules.Skills.Mining: {
                return 'You must be wielding a pickaxe in order to mine rocks.';
            }

            default: {
                return 'INVALID_WEAPON() NOT IMPLEMENTED';
            }
        }
    },
    INVALID_LEVEL(type: Modules.Skills, level: number) {
        switch (type) {
            case Modules.Skills.Lumberjacking: {
                return `You must be level ${level} in order to cut this tree.`;
            }

            case Modules.Skills.Mining: {
                return `You must be level ${level} in order to mine this rock.`;
            }

            default: {
                return 'INVALID_LEVEL() NOT IMPLEMENTED';
            }
        }
    },
    INVENTORY_FULL: 'You do not have enough space in your inventory.',
    UNABLE_TO_INTERACT(type: Modules.Skills) {
        switch (type) {
            case Modules.Skills.Lumberjacking: {
                return 'You are unable to cut this tree at the moment.';
            }

            case Modules.Skills.Mining: {
                return 'You do not have the necessary knowledge to mine this rock.';
            }

            default: {
                return 'UNABLE_TO_INTERACT() NOT IMPLEMENTED';
            }
        }
    },
    NO_REASON: 'There is no reason for you to cut this tree.'
};
