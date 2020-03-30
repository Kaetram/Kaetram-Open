export default {
    Data: {},

    getObject(id) {
        if (id in this.Data) return this.Data[id];

        return null;
    }
};
