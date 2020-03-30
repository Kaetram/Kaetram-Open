"use strict";
exports.__esModule = true;
var Connection = /** @class */ (function () {
    function Connection(id, connection, server) {
        var _this = this;
        this.id = id;
        this.socket = connection;
        this._server = server;
        this.socket.on('message', function (message) {
            if (_this.listenCallback)
                _this.listenCallback(JSON.parse(message));
        });
        this.socket.on('disconnect', function () {
            console.info("Closed socket: " + _this.socket.conn.remoteAddress);
            if (_this.closeCallback)
                _this.closeCallback();
            _this._server.removeConnection(_this.id);
        });
    }
    Connection.prototype.listen = function (callback) {
        this.listenCallback = callback;
    };
    Connection.prototype.onClose = function (callback) {
        this.closeCallback = callback;
    };
    Connection.prototype.send = function (message) {
        this.sendUTF8(JSON.stringify(message));
    };
    Connection.prototype.sendUTF8 = function (data) {
        this.socket.send(data);
    };
    Connection.prototype.close = function (reason) {
        if (reason)
            console.info("[Connection] Closing - " + reason);
        this.socket.conn.close();
    };
    return Connection;
}());
exports["default"] = Connection;
