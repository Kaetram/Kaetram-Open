/* global module */

let Modules = {
    Orientation: {
        Up: 0,
        Down: 1,
        Left: 2,
        Right: 3
    },

    Equipment: {
        Armour: 0,
        Weapon: 1,
        Pendant: 2,
        Ring: 3,
        Boots: 4
    },

    Hits: {
        Damage: 0,
        Poison: 1,
        Heal: 2,
        Mana: 3,
        Experience: 4,
        LevelUp: 5,
        Critical: 6,
        Stun: 7,
        Explosive: 8
    },

    Infos: {
        Countdown: 0
    },

    Projectiles: {
        Arrow: 0,
        Boulder: 1,
        FireBall: 2,
        IceBall: 3,
        Terror: 4,
        Tornado: 5
    },

    Abilities: {
        Freeze: 0,
        Curse: 1,
        Smash: 2,
        Tornado: 3,
        Run: 4,
        Call: 5,
        Evasion: 6
    },

    Enchantment: {
        Bloodsucking: 0,
        Critical: 1,
        Evasion: 2,
        Spike: 3,
        Explosive: 4,
        Stun: 5,
        AntiStun: 6,
        Splash: 7
    },

    Trade: {
        Request: 0,
        Started: 1,
        Accepted: 2,
        Finished: 3
    },

    Achievements: {
        Type: {
            Killing: 0,
            Scavenge: 1
        },

        Rewards: {
            Item: 0,
            Experience: 1,
            Skill: 2
        }
    },

    Quests: {
        Introduction: 0,
        BulkySituation: 1
    },

    Languages: {
        English: 0,
        Romanian: 1,
        French: 2,
        Spanish: 3,
        German: 4,
        Japanese: 5,
        Chinese: 6
    },

    Warps: {
        Mudwich: 0,
        Southorn: 1,
        Lakesworld: 2,
        Aynor: 3,
        Crullfeld: 4,
        Patsow: 5
    },

    Professions: {
        Lumberjacking: 0,
        Fishing: 1,
        Mining: 2
    },

    Trees: {
        Oak: 0,
        Palm: 1,
        IceOak: 2,
        IcePalm: 3
    },

    Rocks: {
        BlueSteel: 0
    },

    Actions: {
        Idle: 0,
        Attack: 1,
        Walk: 2
    }
};

export default Modules;
