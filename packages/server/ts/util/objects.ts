export default {
    Data: {},

    getObject(id) {
        if (id in this.Data)
            return this.Data[id];

        return null;
    },

    getPosition(id) {
        let info = id.split('-');

        return {
            x: parseInt(info[0]),
            y: parseInt(info[1])
        }
    },

    getCursor(id) {
        if (id in this.Data)
            if (this.Data[id].cursor)
                return this.Data[id].cursor;

        return null;
    }
}
