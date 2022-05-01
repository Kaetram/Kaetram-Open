import { Pointer } from './opcodes';

// Preset objects and values for various usages.
export default {
    EmptyPointer: {
        type: Pointer.Remove
    }
};

export enum PacketType {
    Broadcast,
    Player,
    Region,
    Regions
}

export enum ContainerType {
    Bank,
    Inventory
}

export enum Orientation {
    Up,
    Down,
    Left,
    Right
}

export enum Types {
    Player
}

export enum InputType {
    Key,
    LeftClick,
    RightClick
}

export enum Actions {
    Idle,
    Attack,
    Walk,
    Orientate
}

export enum Hits {
    Damage,
    Poison,
    Heal,
    Mana,
    Experience,
    LevelUp,
    Critical,
    Stun,
    Explosive,
    Profession
}

export enum Infos {
    Countdown
}

export enum Projectiles {
    Arrow,
    Boulder,
    FireBall,
    IceBall,
    Terror,
    Tornado
}

export enum Abilities {
    Freeze,
    Curse,
    Smash,
    Tornado,
    Run,
    Call,
    Evasion
}

export enum Equipment {
    Armour,
    Boots,
    Pendant,
    Ring,
    Weapon
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

export enum Keys {
    One = 49,
    Two,
    Three,
    Four,
    Five,

    W = 87,
    A = 65,
    S = 83,
    D = 68,

    Up = 38,
    Left = 37,
    Down = 40,
    Right = 39,

    Esc = 27,
    Enter = 13,
    Slash = 191,
    Spacebar = 32,

    V = 86,
    U = 85,
    J = 74,
    T = 84,
    I = 73,
    P = 80,
    M = 77
}

export enum AudioTypes {
    Music,
    SFX
}

export enum Trade {
    Request,
    Started,
    Accepted,
    Finished
}

enum Type {
    Killing,
    Scavenge
}
enum Rewards {
    Item,
    Experience,
    Skill
}
export let Achievements = {
    Type,
    Rewards
};

export enum Quests {
    Introduction,
    BulkySituation
}

export enum Languages {
    English,
    Romanian,
    French,
    Spanish,
    German,
    Japanese,
    Chinese
}

export enum Warps {
    Mudwich,
    Southorn,
    Lakesworld,
    Aynor,
    Crullfeld,
    Patsow
}

export enum Professions {
    Lumberjacking,
    Fishing,
    Mining
}

export enum Enchantment {
    Bloodsucking,
    Critical,
    Evasion,
    Spike,
    Explosive,
    Stun,
    AntiStun,
    Splash
}

export let EnchantmentNames = [
    'Bloodsucking',
    'Critical',
    'Evasion',
    'Spike',
    'Explosive',
    'Stun',
    'AntiStun',
    'Splash'
];

export interface Colours {
    fill: string;
    stroke: string;
}

export let DamageColours = {
    received: {
        fill: 'rgb(255, 50, 50)',
        stroke: 'rgb(255, 180, 180)'
    },

    receivedCritical: {
        fill: 'rgb(204, 0, 204)',
        stroke: 'rgb(255, 180, 180)'
    },

    inflicted: {
        fill: 'white',
        stroke: '#373737'
    },

    inflictedCritical: {
        fill: 'rgb(255, 153, 204)',
        stroke: '#373737'
    },

    healed: {
        fill: 'rgb(80, 255, 80)',
        stroke: 'rgb(50, 120, 50)'
    },

    mana: {
        fill: 'rgb(73, 94, 228)',
        stroke: 'rgb(56, 63, 133)'
    },

    health: {
        fill: 'white',
        stroke: '#373737'
    },

    exp: {
        fill: 'rgb(80, 180, 255)',
        stroke: 'rgb(15, 85, 138)'
    },

    poison: {
        fill: 'rgb(66, 183, 77)',
        stroke: 'rgb(50, 120 , 50)'
    },

    profession: {
        fill: 'rgb(204, 0, 153)',
        stroke: 'rgb(112, 17, 112)'
    }
};

export enum NPCRole {
    Banker,
    Enchanter,
    Clerk
}

export const enum Constants {
    MAX_STACK = 2_147_483_647, // Maximum default stack size for a stackable item.
    MAX_LEVEL = 135, // Maximum attainable level.
    INVENTORY_SIZE = 20, // Maximum inventory size
    BANK_SIZE = 52, // Maximum bank size
    HITPOINTS_START = 100, // Default hitpoints start value
    DROP_PROBABILITY = 1000, // 1 in 1000
    MAX_PROFESSION_LEVEL = 99, // Totally not influenced by another game lol
    HEAL_RATE = 10_000, // healing every 10 seconds
    STORE_UPDATE_FREQUENCY = 20_000, // update store every 20 seconds
    MAP_DIVISION_SIZE = 64, // The size of a region the map is split into.
    SPAWN_POINT = '325,86', // Default starting point outside the tutorial
    TUTORIAL_QUEST_KEY = 'tutorial', // key of the tutorial quest
    TUTORIAL_SPAWN_POINT = '375,40', // 'x,y' values
    TREE_REGROW = 30_000
}

export enum APIConstants {
    UNHANDLED_HTTP_METHOD,
    NOT_FOUND_ERROR,
    MALFORMED_PARAMETERS,
    PLAYER_NOT_ONLINE
}

// Defaults that apply to all types of entities
export enum Defaults {
    MANA = 50,
    HITPOINTS = 69, // nice.
    MOVEMENT_SPEED = 250, // 250 pixels per frame?
    ATTACK_RATE = 1000 // every 1 second
}

// Defaults that apply specifically to mobs
export enum MobDefaults {
    EXPERIENCE = 1, // Default 1 exp granted if not specified
    AGGRO_RANGE = 2, // Default aggro range of 2 tiles
    RESPAWN_DELAY = 60_000, // 60 seconds to respawn
    ROAM_DISTANCE = 7, // 7 tiles away from spawn point
    ROAM_FREQUENCY = 7000, // Roam interval every 7 seconds
    DEFENSE_LEVEL = 1,
    ATTACK_LEVEL = 1
}

// Flags used by Tiled to determine tile rotation.
export enum MapFlags {
    DIAGONAL_FLAG = 0x20_00_00_00,
    VERTICAL_FLAG = 0x40_00_00_00,
    HORIZONTAL_FLAG = 0x80_00_00_00
}

export enum EntityType {
    Player,
    NPC,
    Item,
    Mob,
    Chest,
    Projectile,
    Object
}

// States that a tree can be in. We can obviously add more
// as more pixel art is added.
export enum TreeState {
    Default,
    Cut
}
