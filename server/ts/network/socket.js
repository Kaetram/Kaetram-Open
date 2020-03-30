"use strict";
exports.__esModule = true;
var Socket = /** @class */ (function () {
    function Socket(port) {
        this.port = port;
        this._connections = {};
        this._counter = 0;
    }
    Socket.prototype.addConnection = function (connection) {
        this._connections[connection.id] = connection;
    };
    Socket.prototype.removeConnection = function (id) {
        delete this._connections[id];
    };
    Socket.prototype.getConnection = function (id) {
        return this._connections[id];
    };
    return Socket;
}());
exports["default"] = Socket;
