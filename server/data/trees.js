let Trees = {

    /**
     * Oak trees are considered the green trees in the starting area,
     * as well as any dead trees found throughout the world. The same
     * applies for the ice oak trees (i.e. ice dead trees are still ice oak).
     */


    // The log ids of the tree
    Logs: {
        Oak: 264,
        Palm: 269
    },

    // Get the level requirement of the tree
    Levels: {
        Oak: 1,
        Palm: 5
    },

    Experience: {
        Oak: 10,
        Palm: 25
    },

    // Chance of cutting a tree
    Chances: {
        Oak: 4, // 1 in 4
        Palm: 7 // 1 in 7
    },

    Regrowth: {
        Oak: 15000,
        Palm: 30000
    },

    // TODO - Move this to the tilemap instead?
    Stumps: {
        // Oak Tree
        "846": "651",
        "847": "652",
        "910": "715",
        "911": "716",

        "1575": "2141",
        "1639": "2205",

        "2130": "2143",
        "2131": "2144",
        "2194": "2207",
        "2195": "2208",

        "2703": "2142",
        "2767": "2206",

        // Palm Tree
        "2134": "2035",
        "2135": "2036",
        "2198": "2099",
        "2199": "2100"
        //Next...
    }

};

module.exports = Trees;
