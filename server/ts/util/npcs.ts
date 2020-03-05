export default {
    Properties: {},
    Ids: {},

    idToString(id) {
        if (id in this.Ids) return this.Ids[id].key;

        return null;
    },

    idToName(id) {
        if (id in this.Ids) return this.Ids[id].name;

        return null;
    },

    getText(id) {
        if (id in this.Ids) return this.Ids[id].text;

        return null;
    },

    getType(id) {
        if (id in this.Ids) return this.Ids[id].type;

        return null;
    }
};
