export default {
    Properties: {},
    Ids: {},
    Plugins: {},

    idToString(id: number) {
        if (id in this.Ids) return this.Ids[id].key;

        return null;
    },

    idToName(id: number) {
        if (id in this.Ids) return this.Ids[id].name;

        return null;
    },

    stringToId(name: string) {
        if (name in this.Properties) return this.Properties[name].id;

        return null;
    },

    getXp(id: number) {
        if (id in this.Ids) return this.Ids[id].xp;

        return -1;
    },

    exists(id: number) {
        return id in this.Ids;
    },

    hasCombatPlugin(id: number) {
        return id in this.Ids && this.Ids[id].combatPlugin in this.Plugins;
    },

    isNewCombatPlugin(id: number) {
        if (id in this.Ids && this.Ids[id].combatPlugin in this.Plugins)
            return this.Plugins[this.Ids[id].combatPlugin];
    },

    isHidden(name: string) {
        if (name in this.Properties) return this.Properties[name].hiddenName;

        return false;
    }
};
