/* global module */

let NPCs = {};

NPCs.Properties = {};
NPCs.Ids = {};

NPCs.idToString = (id) => {

    if (id in NPCs.Ids)
        return NPCs.Ids[id].key;

    return null;
};

NPCs.idToName = (id) => {

    if (id in NPCs.Ids)
        return NPCs.Ids[id].name;

    return null;
};

NPCs.getText = (id) => {

    if (id in NPCs.Ids)
        return NPCs.Ids[id].text;

    return null;
};

NPCs.getType = (id) => {

    if (id in NPCs.Ids)
        return NPCs.Ids[id].type;

    return null;
};

module.exports = NPCs;