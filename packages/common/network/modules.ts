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
    Weapon,
    Pendant,
    Ring,
    Boots
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

export enum Pointers {
    Entity,
    Position,
    Relative,
    Button
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

export enum Trees {
    Oak,
    Palm,
    IceOak,
    IcePalm
}

export enum Rocks {
    BlueSteel
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
