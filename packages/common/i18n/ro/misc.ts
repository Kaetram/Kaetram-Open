export default {
    ACCEPTED_TRADE: 'You have accepted the trade.',
    ACCEPTED_TRADE_OTHER: 'The other player has accepted the trade.',
    CANNOT_ATTACK_CHEATER: 'That player is a cheater, you do not wanna attack someone like that',
    CANNOT_ATTACK_CHEATER_SELF:
        'Sorry but cheaters cannot attack other players, that would not be fair to them!',
    CANNOT_ATTACK_MOB: 'You have no reason to attack these creatures.',
    CANNOT_ATTACK_PET: 'Are you crazy? Are you out of your mind? Why would you attack a pet?',
    CANNOT_ATTACK_PREY: 'You cannot attack while you are the prey.',
    CANNOT_ATTACK_TARGET: 'You cannot attack someone who is not your target.',
    CANNOT_ATTACK_LEVEL_DIFF: 'You cannot attack someone more than 30 levels above or below you.',
    CANNOT_DO_THAT: 'You cannot do that right now.',
    CANNOT_DROP_ITEM_DOOR: 'You cannot drop this item while standing in a door.',
    CANNOT_PICK_UP_ITEM: 'This item can only be picked up by {{username}}.',
    CANNOT_TRADE_ITEM: 'You cannot trade this item.',
    CANNOT_TRADE_CHEATER: 'Sorry but cheaters are not allowed to trade.',
    CANNOT_TRADE_CHEATER_OTHER: 'That player is a cheater, he might sell you contraband!',
    CANNOT_TRADE_ADMIN: 'As an administrator, you cannot influence the economy.',
    CANNOT_TRADE_ADMIN_OTHER: 'The player is an administrator and cannot be traded with.',
    CANNOT_ADD_ITEMS_TRADE: 'You cannot add any more items to the trade.',
    IN_PVP_ZONE: 'You have entered a PvP zone!',
    DOOR_KEY_CRUMBLES: 'The key crumbles to dust as you pass through the door.',
    NO_IDEA: 'I have no idea what that is.',
    NO_ARROWS: 'You do not have any arrows to shoot.',
    NO_ACHIEVEMENT_DOOR:
        'You need to complete the achievement {{achievement}} to pass through this door.',
    NO_COMBAT_DOOR: 'Your combat level must be at least {{level}} to enter.',
    NO_QUEST_DOOR: 'You need to complete the quest {{quest}} to pass through this door.',
    NO_KEY_DOOR: 'You do not have the required key to pass through this door.',
    NO_SKILL_DOOR: 'Your {{skill}} must be at least {{level}} to enter.',
    NOT_IN_PVP_ZONE: 'You are no longer in a PvP zone!',
    NO_KNOWLEDGE_USE: 'You do not have the knowledge to use this.',
    NO_SPACE: 'You do not have enough space in your inventory.',
    NO_SPACE_OTHER: 'The other player does not have enough space in their inventory.',
    NO_SPACE_PET: 'You do not have enough space in your pet inventory.',
    POISONED: 'You have been poisoned!',
    POISON_WORN_OFF: 'The poison has worn off.',
    PLEASE_REPORT_BUG: 'An error has occurred, please report this as a bug.',
    FIRE_IMMUNITY: 'You are now immune to fire effects for {{duration}} seconds.',
    FIRE_IMMUNITY_WORN_OFF: 'Your immunity to fire effects has worn off.',
    FRIENDS_USERNAME_TOO_LONG: 'That username is too long.',
    FRIENDS_ADD_SELF: `Listen, I get it, you're lonely. But you cannot add yourself to the friends list.`,
    FRIENDS_ALREADY_ADDED: 'That player is already on your friends list.',
    FRIENDS_USER_DOES_NOT_EXIST: 'No player with that username exists.',
    FRIENDS_NOT_IN_LIST: 'That player is not on your friends list.',
    PEOPLE_ONLINE: 'There are currently {{population}} people online.',
    SKILL_LEVEL_UP: 'Skill level up!',
    SKILL_LEVEL_UP_DESC: 'Congratulations, your {{name}} has reached level {{level}}!',
    JAILED: 'You are currently jailed for {{duration}}.',
    MUTED: 'You are currently muted.',
    LOW_MANA: 'You are low on mana, your attacks will be weaker.',
    TRADE_REQUEST: 'You have requested to trade with {{username}}.',
    TRADE_REQUEST_OTHER: '{{username}} has requested to trade with you.',
    TRADE_EMPTY: `Yo why are y'all trading nothing?`,
    TRADE_COMPLETE: 'Thank you for using Kaetram trading system!',
    BLACK_POTION: 'You drink the black potion and start feeling unwell.',
    WELCOME: 'Bun venit in {{name}}!',
    WELCOME_BACK: 'Bun venit inapoi in {{name}}!'
} as const;
