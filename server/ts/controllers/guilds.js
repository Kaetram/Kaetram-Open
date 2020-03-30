"use strict";
exports.__esModule = true;
var _ = require("underscore");
/**
 * A guild contains the following information:
 *
 * @param name - Identifies the guild
 * @param owner - Indicates who owns the guild
 * @param members - An array containing all the members in the guild.
 */
var Guilds = /** @class */ (function () {
    function Guilds(world) {
        this.world = world;
        this.creator = world.database.creator;
        this.loader = world.database.loader;
        this.guilds = {};
        this.loaded = false;
        this.load();
    }
    Guilds.prototype.load = function () {
        var _this = this;
        this.loader.getGuilds(function (guilds) {
            _.each(guilds, function (guild) {
                _this.guilds[guild.name] = {
                    owner: guild.owner,
                    members: guild.members
                };
            });
            if (_this.guildCount() === guilds.length)
                _this.loaded = true;
        });
    };
    Guilds.prototype.get = function (guild) {
        if (guild in this.guilds)
            return this.guilds[guild];
        return null;
    };
    Guilds.prototype.create = function (name, owner) {
        var _this = this;
        var newGuild = {
            name: name,
            owner: owner.username,
            members: [owner.username]
        };
        this.loader.getGuild(newGuild.name, function (guild) {
            if (guild) {
                owner.notify('A guild with that name already exists.');
                return;
            }
            _this.guilds[name] = newGuild;
            _this.save(newGuild);
        });
    };
    Guilds.prototype.join = function (guild, player) {
        if (player.guild) {
            player.notify('You cannot join another guild. Please leave your current one.');
            player.notify('P.S. If you see this message, please report it as a bug.');
            return;
        }
        this.loader.getGuild(guild.name, function (guildData) {
            //
        });
    };
    Guilds.prototype.leave = function (player) {
        if (!player.guild)
            return;
        var guild = this.guilds[player.guild];
        var index = guild["this"].guilds[player.guild].members;
    };
    Guilds.prototype.save = function (guild) {
        var _this = this;
        if (!this.loaded)
            return;
        if (guild) {
            this.creator.saveGuild(guild);
            return;
        }
        this.forEachGuild(function (guild) {
            _this.creator.saveGuild(guild);
        });
    };
    Guilds.prototype.hasGuild = function (owner) {
        for (var i in this.guilds)
            if (this.guilds.hasOwnProperty(i))
                if (this.guilds[i].owner.toLowerCase() === owner.toLowerCase())
                    return true;
        return false;
    };
    Guilds.prototype.guildCount = function () {
        return Object.keys(this.guilds).length;
    };
    Guilds.prototype.forEachGuild = function (callback) {
        _.each(this.guilds, function (guild) {
            callback(guild);
        });
    };
    return Guilds;
}());
exports["default"] = Guilds;
