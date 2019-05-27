/* global module */

let Mobs = {};

Mobs.Properties = {};
Mobs.Ids = {};
Mobs.Plugins = {};

Mobs.idToString = function(id) {

    if (id in Mobs.Ids)
        return Mobs.Ids[id].key;

    return null;
};

Mobs.idToName = function(id) {
    if (id in Mobs.Ids)
        return Mobs.Ids[id].name;

    return null;
};

Mobs.getXp = function(id) {

    if (id in Mobs.Ids)
        return Mobs.Ids[id].xp;

    return -1;
};

Mobs.exists = function(id) {

    return id in Mobs.Ids;
};

Mobs.hasCombatPlugin = function(id) {
    return id in Mobs.Ids && Mobs.Ids[id].combatPlugin in Mobs.Plugins
};

Mobs.isNewCombatPlugin = function(id) {
    if (id in Mobs.Ids && Mobs.Ids[id].combatPlugin in Mobs.Plugins)
        return Mobs.Plugins[Mobs.Ids[id].combatPlugin];
};

module.exports = Mobs;