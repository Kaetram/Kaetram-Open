export default {
    // The rock ids of the rock we're mining
    Rocks: {
        BlueSteel: 264 // TODO - Make the item
    },

    // Get the level requirement of the rock
    Levels: {
        BlueSteel: 1
    },

    Experience: {
        BlueSteel: 10
    },

    // Chance of the rock being depleted
    Chances: {
        BlueSteel: 3 // 1 in 3
    },

    // Time (in milliseconds) for the rock to be mineable again.
    Respawn: {
        BlueSteel: 15_000
    },

    EmptyRock: {}
} as const;
