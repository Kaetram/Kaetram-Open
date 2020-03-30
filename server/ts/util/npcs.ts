export default {
    Properties: {},
    Ids: {},

    idToString(id: number) {
        if (id in this.Ids) return this.Ids[id].key;

        return null;
    },

    idToName(id: number) {
        if (id in this.Ids) return this.Ids[id].name;

        return null;
    },

    getText(id: number) {
        if (id in this.Ids) return this.Ids[id].text;

        return null;
    },

    getType(id: number) {
        if (id in this.Ids) return this.Ids[id].type;

        return null;
    }
};
