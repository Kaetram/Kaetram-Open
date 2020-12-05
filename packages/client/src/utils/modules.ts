enum Orientation {
    Up,
    Down,
    Left,
    Right
}

enum Types {
    Player
}

enum InputType {
    Key,
    LeftClick,
    RightClick
}

enum Actions {
    Idle,
    Attack,
    Walk,
    Orientate
}

enum Hits {
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

enum Infos {
    Countdown
}

enum Equipment {
    Armour,
    Weapon,
    Pendant,
    Ring,
    Boots
}

enum Hovering {
    Colliding,
    Mob,
    Player,
    Item,
    NPC,
    Chest,
    Object
}

enum Keys {
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

enum AudioTypes {
    Music,
    SFX
}

enum Pointers {
    Entity,
    Position,
    Relative,
    Button
}

enum Enchantment {
    Bloodsucking,
    Critical,
    Evasion,
    Spike,
    Explosive,
    Stun,
    AntiStun,
    Splash
}

const EnchantmentNames = [
    'Bloodsucking',
    'Critical',
    'Evasion',
    'Spike',
    'Explosive',
    'Stun',
    'AntiStun',
    'Splash'
];

const DamageColours = {
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

export default {
    Orientation,
    Types,
    InputType,
    Actions,
    Hits,
    Infos,
    Equipment,
    Hovering,
    Keys,
    AudioTypes,
    Pointers,
    Enchantment,
    EnchantmentNames,
    DamageColours
};
