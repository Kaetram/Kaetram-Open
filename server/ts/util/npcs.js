"use strict";
exports.__esModule = true;
exports["default"] = {
    Properties: {},
    Ids: {},
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
    getText: function (id) {
        if (id in this.Ids)
            return this.Ids[id].text;
        return null;
    },
    getType: function (id) {
        if (id in this.Ids)
            return this.Ids[id].type;
        return null;
    }
};
