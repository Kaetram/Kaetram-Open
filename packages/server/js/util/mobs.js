/* global module */

let Mobs = {};

Mobs.Properties = {};
Mobs.Ids = {};
Mobs.Plugins = {};

Mobs.idToString = (id) => {

    if (id in Mobs.Ids)
        return Mobs.Ids[id].key;

    return null;
};

Mobs.idToName = (id) => {
    if (id in Mobs.Ids)
        return Mobs.Ids[id].name;

    return null;
};

Mobs.getXp = (id) => {

    if (id in Mobs.Ids)
        return Mobs.Ids[id].xp;

    return -1;
};

Mobs.exists = (id) => {

    return id in Mobs.Ids;
};

Mobs.hasCombatPlugin = (id) => {
    return id in Mobs.Ids && Mobs.Ids[id].combatPlugin in Mobs.Plugins
};

Mobs.isNewCombatPlugin = (id) => {
    if (id in Mobs.Ids && Mobs.Ids[id].combatPlugin in Mobs.Plugins)
        return Mobs.Plugins[Mobs.Ids[id].combatPlugin];
};

module.exports = Mobs;