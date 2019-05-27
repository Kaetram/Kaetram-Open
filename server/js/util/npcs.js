/* global module */

let NPCs = {};

NPCs.Properties = {};
NPCs.Ids = {};

NPCs.idToString = function(id) {

    if (id in NPCs.Ids)
        return NPCs.Ids[id].key;

    return null;
};

NPCs.idToName = function(id) {

    if (id in NPCs.Ids)
        return NPCs.Ids[id].name;

    return null;
};

NPCs.getText = function(id) {

    if (id in NPCs.Ids)
        return NPCs.Ids[id].text;

    return null;
};

NPCs.getType = function(id) {

    if (id in NPCs.Ids)
        return NPCs.Ids[id].type;

    return null;
};

module.exports = NPCs;