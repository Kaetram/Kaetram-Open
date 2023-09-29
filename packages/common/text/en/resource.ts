import { Modules } from '@kaetram/common/network';

export default {
    INVALID_WEAPON(type: Modules.Skills) {
        switch (type) {
            case Modules.Skills.Lumberjacking: {
                return 'resource:MUST_EQUIP_AXE';
            }

            case Modules.Skills.Mining: {
                return 'resource:MUST_EQUIP_PICKAXE';
            }

            case Modules.Skills.Fishing: {
                return 'resource:MUST_EQUIP_FISHING';
            }

            case Modules.Skills.Foraging: {
                return 'resource:MUST_EQUIP_FORAGING';
            }

            default: {
                return 'INVALID_WEAPON() NOT IMPLEMENTED';
            }
        }
    },
    INVALID_LEVEL(type: Modules.Skills, level: number) {
        switch (type) {
            case Modules.Skills.Lumberjacking: {
                return `resource:INVALID_LEVEL_LUMBERJACKING;level=${level}`;
            }

            case Modules.Skills.Mining: {
                return `resource:INVALID_LEVEL_MINING;level=${level}`;
            }

            case Modules.Skills.Fishing: {
                return `resource:INVALID_LEVEL_FISHING;level=${level}`;
            }

            case Modules.Skills.Foraging: {
                return `resource:INVALID_LEVEL_FORAGING;level=${level}`;
            }

            default: {
                return 'INVALID_LEVEL() NOT IMPLEMENTED';
            }
        }
    },
    UNABLE_TO_INTERACT(type: Modules.Skills) {
        switch (type) {
            case Modules.Skills.Lumberjacking: {
                return 'resource:UNABLE_TO_INTERACT_LUMBERJACKING';
            }

            case Modules.Skills.Mining: {
                return 'resource:UNABLE_TO_INTERACT_MINING';
            }

            case Modules.Skills.Fishing: {
                return 'resource:UNABLE_TO_INTERACT_FISHING';
            }

            case Modules.Skills.Foraging: {
                return 'resource:UNABLE_TO_INTERACT_FORAGING';
            }

            default: {
                return 'UNABLE_TO_INTERACT() NOT IMPLEMENTED';
            }
        }
    }
};
