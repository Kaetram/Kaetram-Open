let Trees = {

    // The log ids of the tree
    Logs: {
        Oak: 264,
        Palm: 264
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

    Stumps: {
        // Oak Tree
        "846": "651",
        "847": "652",
        "910": "715",
        "911": "716",

        // Palm Tree
        "2134": "2035",
        "2135": "2036",
        "2198": "2099",
        "2199": "2100"
        //Next...
    }

};

module.exports = Trees;
