export default {
    Data: {},

    getObject(id: string) {
        if (id in this.Data) return this.Data[id];

        return null;
    },

    getPosition(id: string) {
        let info = id.split('-');

        return {
            x: parseInt(info[0]),
            y: parseInt(info[1]),
        };
    },

    getCursor(id: string) {
        if (id in this.Data) if (this.Data[id].cursor) return this.Data[id].cursor;

        return null;
    },
};
