/* global module */

export default {
    Properties: {},
    Ids: {},
    Plugins: {},

    idToString(id) {

        if (id in this.Ids)
            return this.Ids[id].key;

        return null;
    },

    idToName(id) {
        if (id in this.Ids)
            return this.Ids[id].name;

        return null;
    },

    getXp(id) {

        if (id in this.Ids)
            return this.Ids[id].xp;

        return -1;
    },

    exists(id) {

        return id in this.Ids;
    },

    hasCombatPlugin(id) {
        return id in this.Ids && this.Ids[id].combatPlugin in this.Plugins
    },

    isNewCombatPlugin(id) {
        if (id in this.Ids && this.Ids[id].combatPlugin in this.Plugins)
            return this.Plugins[this.Ids[id].combatPlugin];
    }
}
