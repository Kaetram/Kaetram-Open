/* eslint-disable @typescript-eslint/no-duplicate-enum-values */

import { Pointer } from './opcodes';

export let EmptyPointer = {
    type: Pointer.Remove
};

export enum PacketType {
    Broadcast,
    Player,
    Players,
    Region,
    Regions,
    RegionList
}

export enum ContainerType {
    Bank,
    Inventory,
    Trade
}

export enum Orientation {
    Up,
    Down,
    Left,
    Right
}

export enum EntityType {
    Player,
    NPC,
    Item,
    Mob,
    Chest,
    Projectile,
    Object,
    Pet
}

export enum AbilityType {
    Active,
    Passive
}

export type HealTypes = 'passive' | 'hitpoints' | 'mana';

/**
 * Enumeration of special states that an entity could be. For example,
 * an entity could be a quest-based entity and it has special name colour.
 */

export enum SpecialEntityTypes {
    Achievement,
    Quest,
    Area,
    Boss,
    Miniboss
}

export enum Actions {
    Idle,
    Attack,
    Walk,
    Orientate
}

export enum MenuActions {
    DropOne = 'drop-one',
    DropMany = 'drop-many',
    Wield = 'wield',
    Equip = 'equip',
    Attack = 'attack',
    Eat = 'eat',
    Eat2 = 'eat2',
    Move = 'move',
    Trade = 'trade',
    Potion = 'potion',
    Follow = 'follow',
    Examine = 'examine',
    AddFriend = 'addfriend'
}

export enum InteractActions {}

export enum Hits {
    Normal,
    Poison,
    Heal,
    Mana,
    Experience,
    LevelUp,
    Critical,
    Stun,
    Profession,
    Freezing,
    Burning,
    Terror
}

export enum Equipment {
    Armour,
    Boots,
    Pendant,
    Ring,
    Weapon,
    Arrows,
    WeaponSkin,
    ArmourSkin
}

export enum AttackStyle {
    None,

    // Melee
    Stab, // Accuracy experience and boosts accuracy
    Slash, // Strength experience and boosts maximum damage
    Defensive, // Defense experience and boosts damage absorbed
    Crush, // Accuracy + Strength experience and boosts accuracy/damage
    Shared, // Accuracy + Strength + Defense experience and boosts all
    Hack, // Strength + Defense experience boosts damage and absorbs damage
    Chop, // Accuracy + Defense experience boosts accuracy and absorbs damage

    // Archery
    Accurate, // Higher accuracy but slower
    Fast, // Faster but lower accuracy

    // Magic
    Focused, // Slower but higher damage/accuracy

    // Archery and Magic
    LongRange // Increased attack range and less accurate
}

export enum Hovering {
    Colliding,
    Mob,
    Player,
    Item,
    NPC,
    Chest,
    Object
}

export enum AudioTypes {
    Music,
    SFX
}

export enum PoisonTypes {
    Venom, // When a mob hits you
    Plague, // When entering a poisoned area.
    Persistent // Poison that doesn't wear off until it's cured.
}

export enum Warps {
    Mudwich,
    Aynor,
    Lakesworld,
    Patsow,
    Crullfield,
    Undersea
}

export enum Skills {
    Lumberjacking,
    Accuracy,
    Archery,
    Health,
    Magic,
    Mining,
    Strength,
    Defense,
    Fishing,
    Cooking,
    Smithing,
    Crafting,
    Fletching,
    Smelting, // Not a skill, but used to differntiate smithing from smelting in the crafting.
    Foraging,
    Eating,
    Loitering
}

// It's easier to define and swap order around here.
export let SkillsOrder = [
    Skills.Health,
    Skills.Accuracy,
    Skills.Strength,
    Skills.Defense,
    Skills.Archery,
    Skills.Magic,
    Skills.Lumberjacking,
    Skills.Mining,
    Skills.Fishing,
    Skills.Foraging,
    Skills.Crafting,
    Skills.Cooking,
    Skills.Fletching,
    Skills.Smithing,
    Skills.Eating,
    Skills.Loitering
];

export enum Enchantment {
    Bloodsucking,
    Critical,
    Evasion,
    Thorns,
    Explosive,
    Stun,
    AntiStun,
    Splash,
    DoubleEdged
}

export enum AoEType {
    Character,
    Player,
    Mob
}

// Client sided special effects.
export enum Effects {
    None,
    Critical,
    Terror, // Initial terror effect.
    TerrorStatus, // The terror effect that persists
    Stun,
    Healing,
    Fireball,
    Iceball,
    Poisonball,
    Boulder,
    Running,
    HotSauce,
    DualistsMark,
    ThickSkin,
    SnowPotion,
    FirePotion,
    Burning,
    Freezing,
    Invincible
}

export enum DamageStyle {
    None,
    Crush,
    Slash,
    Stab,
    Magic,
    Archery
}

export enum Medals {
    None,
    Silver,
    Gold,
    Artist,
    Tier1,
    Tier2,
    Tier3,
    Tier4,
    Tier5,
    Tier6,
    Tier7
}

export enum Ranks {
    None,
    Moderator,
    Admin,
    Veteran,
    Patron,
    Artist,
    Cheater,
    TierOne, // Patron tiers
    TierTwo,
    TierThree,
    TierFour,
    TierFive,
    TierSix,
    TierSeven,
    HollowAdmin
}

export let RankColours = {
    [Ranks.None]: '',
    [Ranks.Moderator]: '#02f070',
    [Ranks.Admin]: '#3bbaff',
    [Ranks.Veteran]: '#d84343',
    [Ranks.Patron]: '#db753c',
    [Ranks.Artist]: '#b552f7',
    [Ranks.Cheater]: '#ffffff',
    [Ranks.TierOne]: '#db963c',
    [Ranks.TierTwo]: '#e6c843',
    [Ranks.TierThree]: '#d6e34b',
    [Ranks.TierFour]: '#a9e03a',
    [Ranks.TierFive]: '#7beb65',
    [Ranks.TierSix]: '#77e691',
    [Ranks.TierSeven]: '#77e691',
    [Ranks.HollowAdmin]: '#3bbaff'
};

export let RankTitles = {
    [Ranks.None]: '',
    [Ranks.Moderator]: 'Mod',
    [Ranks.Admin]: 'Admin',
    [Ranks.Veteran]: 'Veteran',
    [Ranks.Patron]: 'Patron',
    [Ranks.Artist]: 'Artist',
    [Ranks.Cheater]: 'Cheater',
    [Ranks.TierOne]: 'T1 Patron',
    [Ranks.TierTwo]: 'T2 Patron',
    [Ranks.TierThree]: 'T3 Patron',
    [Ranks.TierFour]: 'T4 Patron',
    [Ranks.TierFive]: 'T5 Patron',
    [Ranks.TierSix]: 'T6 Patron',
    [Ranks.TierSeven]: 'T7 Patron',
    [Ranks.HollowAdmin]: 'Admin'
};

export interface Colours {
    fill: string;
    stroke: string;
}

export let DamageColours = {
    // Received damage
    [Hits.Normal]: {
        fill: 'rgb(255, 50, 50)',
        stroke: 'rgb(255, 180, 180)',
        inflicted: {
            fill: 'white',
            stroke: '#373737'
        }
    },

    [Hits.Critical]: {
        fill: 'rgb(204, 0, 204)',
        stroke: 'rgb(255, 180, 180)',
        inflicted: {
            fill: 'rgb(255, 153, 204)',
            stroke: '#373737'
        }
    },

    [Hits.Poison]: {
        fill: 'rgb(66, 183, 77)',
        stroke: 'rgb(50, 120 , 50)'
    },

    [Hits.Heal]: {
        fill: 'rgb(80, 255, 80)',
        stroke: 'rgb(50, 120, 50)'
    },

    [Hits.Mana]: {
        fill: 'rgb(73, 94, 228)',
        stroke: 'rgb(56, 63, 133)'
    },

    [Hits.Experience]: {
        fill: 'rgb(80, 180, 255)',
        stroke: 'rgb(15, 85, 138)'
    },

    [Hits.LevelUp]: {
        fill: 'rgb(80, 180, 255)',
        stroke: 'rgb(15, 85, 138)'
    },

    [Hits.Profession]: {
        fill: 'rgb(204, 0, 153)',
        stroke: 'rgb(112, 17, 112)'
    },

    [Hits.Freezing]: {
        fill: 'rgb(52, 195, 235)',
        stroke: 'rgb(14, 138, 227)'
    },

    [Hits.Burning]: {
        fill: 'rgb(227, 170, 14)',
        stroke: 'rgb(235, 135, 52)'
    }
};

export let SkillExpColours = {
    [Skills.Lumberjacking]: {
        fill: 'rgb(132, 57, 45)',
        stroke: 'rgb(101, 48, 35)'
    },

    [Skills.Accuracy]: {
        fill: 'rgb(6, 191, 188)',
        stroke: 'rgb(2, 94, 93)'
    },

    [Skills.Archery]: {
        fill: 'rgb(34, 214, 130)',
        stroke: 'rgb(7, 184, 101)'
    },

    [Skills.Health]: {
        fill: 'rgb(239, 90, 90)',
        stroke: 'rgb(255, 0, 0)'
    },

    [Skills.Magic]: {
        fill: 'rgb(37, 124, 210)',
        stroke: 'rgb(12, 55, 208)'
    },

    [Skills.Mining]: {
        fill: 'rgb(105, 106, 107)',
        stroke: 'rgb(45, 45, 46)'
    },

    [Skills.Strength]: {
        fill: 'rgb(232, 211, 185)',
        stroke: 'rgb(189, 172, 151)'
    },

    [Skills.Defense]: {
        fill: 'rgb(110, 158, 255)',
        stroke: 'rgb(7, 63, 176)'
    },

    [Skills.Fishing]: {
        fill: 'rgb(0, 255, 255)',
        stroke: 'rgb(0, 255, 255)'
    },

    [Skills.Cooking]: {
        fill: 'rgb(255, 0, 0)',
        stroke: 'rgb(255, 0, 0)'
    },

    [Skills.Smithing]: {
        fill: 'rgb(132, 57, 45)',
        stroke: 'rgb(101, 48, 35)'
    },

    [Skills.Crafting]: {
        fill: 'rgb(255, 255, 0)',
        stroke: 'rgb(255, 255, 0)'
    },

    [Skills.Fletching]: {
        fill: 'rgb(255, 255, 0)',
        stroke: 'rgb(255, 255, 0)'
    },

    [Skills.Smelting]: {
        fill: 'rgb(255, 255, 0)',
        stroke: 'rgb(255, 255, 0)'
    },

    [Skills.Eating]: {
        fill: 'rgb(255, 0, 0)',
        stroke: 'rgb(255, 0, 0)'
    },

    [Skills.Loitering]: {
        fill: 'rgb(255, 0, 0)',
        stroke: 'rgb(255, 0, 0)'
    },

    [Skills.Foraging]: {
        fill: 'rgb(255, 0, 0)',
        stroke: 'rgb(255, 0, 0)'
    }
};

export let NameColours = {
    [SpecialEntityTypes.Achievement]: 'rgb(60, 179, 113)',
    [SpecialEntityTypes.Quest]: 'rgb(106, 90, 205)',
    [SpecialEntityTypes.Area]: 'rgb(255, 165, 0)',
    [SpecialEntityTypes.Boss]: 'rgb(150, 0, 51)',
    [SpecialEntityTypes.Miniboss]: 'rgb(204, 51, 0)'
};

export let EntityScale = {
    [SpecialEntityTypes.Miniboss]: 1.2
};

export let PoisonInfo = {
    [PoisonTypes.Venom]: {
        name: 'Venom',
        damage: 5,
        duration: 30,
        rate: 2 // every 2 seconds
    },
    [PoisonTypes.Plague]: {
        name: 'Plague',
        damage: 5,
        duration: 60,
        rate: 1
    },
    [PoisonTypes.Persistent]: {
        name: 'Persistent',
        damage: 2,
        duration: -1,
        rate: 1
    }
};

export enum NPCRole {
    Banker,
    Enchanter,
    Clerk
}

export enum GuildRank {
    Fledgling,
    Emergent,
    Established,
    Adept,
    Veteran,
    Elite,
    Master,
    Landlord
}

export enum BannerColour {
    Green = 'green',
    Blue = 'blue',
    Red = 'red',
    Grey = 'grey',
    Black = 'black',
    Tangerine = 'tangerine',
    Yellow = 'yellow',
    Purple = 'purple',
    Pink = 'pink'
}

export enum BannerOutline {
    Green = 'green',
    Blue = 'blue',
    Orange = 'orange',
    White = 'white',
    Grey = 'grey',
    Tangerine = 'tangerine',
    Yellow = 'yellow',
    Purple = 'purple',
    Pink = 'pink'
}

export enum BannerCrests {
    None = 'none',
    Star = 'star',
    Hawk = 'hawk',
    Phoenix = 'phoenix'
}

export const Constants = {
    MAX_STACK: 2_147_483_647, // Maximum default stack size for a stackable item.
    MAX_LEVEL: 135, // Maximum attainable level.
    INVENTORY_SIZE: 25, // Maximum inventory size
    BANK_SIZE: 420, // Maximum bank size
    DROP_PROBABILITY: 10_000, // 1 in 10000
    MAX_PROFESSION_LEVEL: 99, // Totally not influenced by another game lol
    HEAL_RATE: 7000, // healing every 7 seconds
    EFFECT_RATE: 10_000, // effects every 10 seconds
    STORE_UPDATE_FREQUENCY: 20_000, // update store every 20 seconds
    MAP_DIVISION_SIZE: 48, // The size of a region the map is split into.
    SPAWN_POINT: '405,27', // Default starting point outside the tutorial
    TUTORIAL_QUEST_KEY: 'tutorial', // key of the tutorial quest
    TUTORIAL_SPAWN_POINT: '579,7', // 'x,y' values
    RESOURCE_RESPAWN: 30_000,
    TREE_RESPAWN: 25_000,
    CHEST_RESPAWN: 50_000, // 50 seconds
    SKILL_LOOP: 1000, // How often we check the loop of a skill
    MAX_ACCURACY: 0.45, // Maximum attainable accuracy for a character.
    EDIBLE_COOLDOWN: 1500, // 1.5 seconds between eating foods to prevent spam.
    CRAFT_COOLDOWN: 1500, // 1.5 seconds between crafting items to prevent spam.
    INVALID_MOVEMENT_THRESHOLD: 3, // Amount of invalid movements before ignoring packets.
    ARCHER_ATTACK_RANGE: 8, // Default attack range for bows if no other range is specified.
    MAX_CONNECTIONS: 16, // Maximum number of connections per IP address.
    EXPERIENCE_PER_HIT: 4, // Amount of experinece received per 1 damage dealt.
    SNOW_POTION_DURATION: 60_000, // 60 seconds
    FIRE_POTION_DURATION: 60_000, // 60 seconds
    FREEZING_DURATION: 60_000, // 60 seconds
    BURNING_DURATION: 60_000, // 60 seconds
    TERROR_DURATION: 60_000, // 60 seconds
    LOITERING_THRESHOLD: 90_000, // 90 seconds until loitering activates
    STUN_DURATION: 10_000, // 10 seconds
    COLD_EFFECT_DAMAGE: 10,
    BURNING_EFFECT_DAMAGE: 20,
    ATTACKER_TIMEOUT: 20_000, // 20 seconds
    MAX_GUILD_MEMBERS: 40, // Maximum number of members in a guild
    EVENTS_CHECK_INTERVAL: 3_600_000 // Every 1 hour
};

export enum MinigameConstants {
    TEAM_WAR_COUNTDOWN = 240, // 240 seconds (4 minutes) in the lobby
    TEAM_WAR_MIN_PLAYERS = 2 // Minimum number of players to start a team war
}

export enum APIConstants {
    UNHANDLED_HTTP_METHOD,
    NOT_FOUND_ERROR,
    MALFORMED_PARAMETERS,
    PLAYER_NOT_ONLINE
}

// Defaults that apply to all types of entities
export enum Defaults {
    MOVEMENT_SPEED = 250, // 250 milliseconds to traverse one tile
    ATTACK_RATE = 1000, // every 1 second
    POISON_CHANCE = 15 // 15 in (235 - level) chance to poison
}

export enum ItemDefaults {
    RESPAWN_DELAY = 30_000, // 30 seconds
    DESPAWN_DURATION = 34_000, // 34 seconds of blinking before despawning
    BLINK_DELAY = 30_000 // 40 seconds until item starts blinking.
}

// Defaults that apply specifically to mobs
export enum MobDefaults {
    AGGRO_RANGE = 2, // Default aggro range of 2 tiles
    RESPAWN_DELAY = 60_000, // 60 seconds to respawn
    ROAM_DISTANCE = 7, // 7 tiles away from spawn point
    ROAM_FREQUENCY = 17_000, // Roam interval every 35 seconds
    DEFENSE_LEVEL = 1,
    ATTACK_LEVEL = 1
}

// Flags used by Tiled to determine tile rotation.
export enum MapFlags {
    DIAGONAL_FLAG = 0x20_00_00_00,
    VERTICAL_FLAG = 0x40_00_00_00,
    HORIZONTAL_FLAG = 0x80_00_00_00
}

// Handles the two states of a resource, default or depleted.
export enum ResourceState {
    Default,
    Depleted
}
