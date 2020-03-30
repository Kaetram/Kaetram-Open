"use strict";
exports.__esModule = true;
exports["default"] = {
    Properties: {},
    Ids: {},
    Plugins: {},
    idToString: function (id) {
        if (id in this.Ids)
            return this.Ids[id].key;
        return null;
    },
    idToName: function (id) {
        if (id in this.Ids)
            return this.Ids[id].name;
        return null;
    },
    getXp: function (id) {
        if (id in this.Ids)
            return this.Ids[id].xp;
        return -1;
    },
    exists: function (id) {
        return id in this.Ids;
    },
    hasCombatPlugin: function (id) {
        return id in this.Ids && this.Ids[id].combatPlugin in this.Plugins;
    },
    isNewCombatPlugin: function (id) {
        if (id in this.Ids && this.Ids[id].combatPlugin in this.Plugins)
            return this.Plugins[this.Ids[id].combatPlugin];
    }
};
