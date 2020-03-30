"use strict";
exports.__esModule = true;
var packets_1 = require("./packets");
exports["default"] = {
    Handshake: /** @class */ (function () {
        function class_1(info) {
            this.info = info;
        }
        class_1.prototype.serialize = function () {
            return [packets_1["default"].Handshake, this.info];
        };
        return class_1;
    }()),
    Welcome: /** @class */ (function () {
        function class_2(data) {
            this.info = data; // array of info
        }
        class_2.prototype.serialize = function () {
            return [packets_1["default"].Welcome, this.info];
        };
        return class_2;
    }()),
    Spawn: /** @class */ (function () {
        function class_3(entity) {
            this.entity = entity;
        }
        class_3.prototype.serialize = function () {
            return [packets_1["default"].Spawn, this.entity.getState()];
        };
        return class_3;
    }()),
    List: /** @class */ (function () {
        function class_4(list) {
            this.list = list;
        }
        class_4.prototype.serialize = function () {
            return [packets_1["default"].List, this.list];
        };
        return class_4;
    }()),
    Sync: /** @class */ (function () {
        function class_5(data) {
            this.info = data;
        }
        class_5.prototype.serialize = function () {
            return [packets_1["default"].Sync, this.info];
        };
        return class_5;
    }()),
    Equipment: /** @class */ (function () {
        function class_6(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }
        class_6.prototype.serialize = function () {
            return [packets_1["default"].Equipment, this.opcode, this.info];
        };
        return class_6;
    }()),
    Movement: /** @class */ (function () {
        function class_7(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }
        class_7.prototype.serialize = function () {
            return [packets_1["default"].Movement, this.opcode, this.info];
        };
        return class_7;
    }()),
    Teleport: /** @class */ (function () {
        function class_8(info) {
            this.info = info;
        }
        class_8.prototype.serialize = function () {
            return [packets_1["default"].Teleport, this.info];
        };
        return class_8;
    }()),
    Despawn: /** @class */ (function () {
        function class_9(id) {
            this.id = id;
        }
        class_9.prototype.serialize = function () {
            return [packets_1["default"].Despawn, this.id];
        };
        return class_9;
    }()),
    Animation: /** @class */ (function () {
        function class_10(id, data) {
            this.id = id;
            this.info = data;
        }
        class_10.prototype.serialize = function () {
            return [packets_1["default"].Animation, this.id, this.info];
        };
        return class_10;
    }()),
    // TODO: Revise this when going over combat.
    Combat: /** @class */ (function () {
        function class_11(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }
        class_11.prototype.serialize = function () {
            return [packets_1["default"].Combat, this.opcode, this.info];
        };
        return class_11;
    }()),
    Projectile: /** @class */ (function () {
        function class_12(opcode, data) {
            this.opcode = opcode;
            this.info = data;
        }
        class_12.prototype.serialize = function () {
            return [packets_1["default"].Projectile, this.opcode, this.info];
        };
        return class_12;
    }()),
    Population: /** @class */ (function () {
        function class_13(playerCount) {
            this.playerCount = playerCount;
        }
        class_13.prototype.serialize = function () {
            return [packets_1["default"].Population, this.playerCount];
        };
        return class_13;
    }()),
    Points: /** @class */ (function () {
        function class_14(data) {
            this.info = data;
        }
        class_14.prototype.serialize = function () {
            return [packets_1["default"].Points, this.info];
        };
        return class_14;
    }()),
    Network: /** @class */ (function () {
        function class_15(opcode) {
            this.opcode = opcode;
        }
        class_15.prototype.serialize = function () {
            return [packets_1["default"].Network, this.opcode];
        };
        return class_15;
    }()),
    Chat: /** @class */ (function () {
        function class_16(data) {
            this.info = data;
        }
        class_16.prototype.serialize = function () {
            return [packets_1["default"].Chat, this.info];
        };
        return class_16;
    }()),
    Command: /** @class */ (function () {
        function class_17(data) {
            this.info = data;
        }
        class_17.prototype.serialize = function () {
            return [packets_1["default"].Command, this.info];
        };
        return class_17;
    }()),
    /**
     * Should we just have a packet that represents containers
     * as a whole or just send it separately for each?
     */
    Inventory: /** @class */ (function () {
        function class_18(opcode, data) {
            this.opcode = opcode;
            this.info = data;
        }
        class_18.prototype.serialize = function () {
            return [packets_1["default"].Inventory, this.opcode, this.info];
        };
        return class_18;
    }()),
    Bank: /** @class */ (function () {
        function class_19(opcode, data) {
            this.opcode = opcode;
            this.info = data;
        }
        class_19.prototype.serialize = function () {
            return [packets_1["default"].Bank, this.opcode, this.info];
        };
        return class_19;
    }()),
    Ability: /** @class */ (function () {
        function class_20(opcode, data) {
            this.opcode = opcode;
            this.info = data;
        }
        class_20.prototype.serialize = function () {
            return [packets_1["default"].Ability, this.opcode, this.info];
        };
        return class_20;
    }()),
    Quest: /** @class */ (function () {
        function class_21(opcode, data) {
            this.opcode = opcode;
            this.info = data;
        }
        class_21.prototype.serialize = function () {
            return [packets_1["default"].Quest, this.opcode, this.info];
        };
        return class_21;
    }()),
    Notification: /** @class */ (function () {
        function class_22(opcode, message) {
            this.opcode = opcode;
            this.message = message;
        }
        class_22.prototype.serialize = function () {
            return [packets_1["default"].Notification, this.opcode, this.message];
        };
        return class_22;
    }()),
    Blink: /** @class */ (function () {
        function class_23(instance) {
            this.instance = instance;
        }
        class_23.prototype.serialize = function () {
            return [packets_1["default"].Blink, this.instance];
        };
        return class_23;
    }()),
    Heal: /** @class */ (function () {
        function class_24(info) {
            this.info = info;
        }
        class_24.prototype.serialize = function () {
            return [packets_1["default"].Heal, this.info];
        };
        return class_24;
    }()),
    Experience: /** @class */ (function () {
        function class_25(info) {
            this.info = info;
        }
        class_25.prototype.serialize = function () {
            return [packets_1["default"].Experience, this.info];
        };
        return class_25;
    }()),
    Death: /** @class */ (function () {
        function class_26(id) {
            this.id = id;
        }
        class_26.prototype.serialize = function () {
            return [packets_1["default"].Death, this.id];
        };
        return class_26;
    }()),
    Audio: /** @class */ (function () {
        function class_27(song) {
            this.song = song;
        }
        class_27.prototype.serialize = function () {
            return [packets_1["default"].Audio, this.song];
        };
        return class_27;
    }()),
    NPC: /** @class */ (function () {
        function class_28(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }
        class_28.prototype.serialize = function () {
            return [packets_1["default"].NPC, this.opcode, this.info];
        };
        return class_28;
    }()),
    Respawn: /** @class */ (function () {
        function class_29(instance, x, y) {
            this.instance = instance;
            this.x = x;
            this.y = y;
        }
        class_29.prototype.serialize = function () {
            return [packets_1["default"].Respawn, this.instance, this.x, this.y];
        };
        return class_29;
    }()),
    Enchant: /** @class */ (function () {
        function class_30(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }
        class_30.prototype.serialize = function () {
            return [packets_1["default"].Enchant, this.opcode, this.info];
        };
        return class_30;
    }()),
    Guild: /** @class */ (function () {
        function class_31(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }
        class_31.prototype.serialize = function () {
            return [packets_1["default"].Guild, this.opcode, this.info];
        };
        return class_31;
    }()),
    Pointer: /** @class */ (function () {
        function class_32(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }
        class_32.prototype.serialize = function () {
            return [packets_1["default"].Pointer, this.opcode, this.info];
        };
        return class_32;
    }()),
    PVP: /** @class */ (function () {
        function class_33(id, pvp) {
            this.id = id;
            this.pvp = pvp;
        }
        class_33.prototype.serialize = function () {
            return [packets_1["default"].PVP, this.id, this.pvp];
        };
        return class_33;
    }()),
    Shop: /** @class */ (function () {
        function class_34(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }
        class_34.prototype.serialize = function () {
            return [packets_1["default"].Shop, this.opcode, this.info];
        };
        return class_34;
    }()),
    Minigame: /** @class */ (function () {
        function class_35(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }
        class_35.prototype.serialize = function () {
            return [packets_1["default"].Minigame, this.opcode, this.info];
        };
        return class_35;
    }()),
    Region: /** @class */ (function () {
        function class_36(opcode, info, force) {
            this.opcode = opcode;
            this.info = info;
        }
        class_36.prototype.serialize = function () {
            return [packets_1["default"].Region, this.opcode, this.info];
        };
        return class_36;
    }()),
    Overlay: /** @class */ (function () {
        function class_37(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }
        class_37.prototype.serialize = function () {
            return [packets_1["default"].Overlay, this.opcode, this.info];
        };
        return class_37;
    }()),
    Camera: /** @class */ (function () {
        function class_38(opcode, info) {
            this.opcode = opcode;
            this.info = info;
        }
        class_38.prototype.serialize = function () {
            return [packets_1["default"].Camera, this.opcode, this.info];
        };
        return class_38;
    }()),
    Bubble: /** @class */ (function () {
        function class_39(info) {
            this.info = info;
        }
        class_39.prototype.serialize = function () {
            return [packets_1["default"].Bubble, this.info];
        };
        return class_39;
    }())
};
