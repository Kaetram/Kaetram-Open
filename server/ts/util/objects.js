"use strict";
exports.__esModule = true;
exports["default"] = {
    Data: {},
    getObject: function (id) {
        if (id in this.Data)
            return this.Data[id];
        return null;
    }
};
