/**
 * - Oak trees are considered the green trees in the starting area,
 * as well as any dead trees found throughout the world. The same
 * applies for the ice oak trees (i.e. ice dead trees are still ice oak).
 */
export default {
    // The log ids of the tree
    Logs: {
        Oak: 264,
        Palm: 269,
        IceOak: 270,
        IcePalm: 271
    },

    // Get the level requirement of the tree
    Levels: {
        Oak: 1,
        Palm: 5,
        IceOak: 20,
        IcePalm: 25
    },

    Experience: {
        Oak: 10,
        Palm: 25,
        IceOak: 70,
        IcePalm: 105
    },

    // Chance of cutting a tree
    Chances: {
        Oak: 3, // 1 in 3
        Palm: 5, // 1 in 5
        IceOak: 5, // 1 in 5,
        IcePalm: 7 // 1 in 7
    },

    Regrowth: {
        Oak: 15_000,
        Palm: 30_000,
        IceOak: 60_000,
        IcePalm: 72_000
    },

    // TODO - Move this to the tilemap instead?
    Stumps: {
        // Oak Tree
        846: 651,
        847: 652,
        910: 715,
        911: 716,

        1575: 2141,
        1639: 2205,

        2130: 2143,
        2131: 2144,
        2194: 2207,
        2195: 2208,

        2703: 2142,
        2767: 2206,

        // Palm Tree
        2134: 2035,
        2135: 2036,
        2198: 2099,
        2199: 2100,

        // Ice Oak

        2742: 2173,
        2743: 2174,
        2806: 2237,
        2807: 2238,

        3171: 2175,
        3235: 2239,

        6035: 2301,
        6099: 2365,

        // Ice Palm

        6594: 2176,
        6658: 2240
    }
} as const;
