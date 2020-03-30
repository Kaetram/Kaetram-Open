"use strict";
exports.__esModule = true;
var Config = {};
// Connectivity/Hosting Configuration
Config.name = 'Kaetram';
Config.host = '0.0.0.0';
Config.port = 5000; // Server port, make sure this matches the client's
Config.ssl = false; // Whether to use `https` module or `http`
Config.devClient = false; // Will be used for local debugging.
// API Configuration
Config.accessToken = 'generate-a-token-with-the-hash-of-your-liking';
Config.enableAPI = false;
Config.apiPort = 5000;
// Database Configuration
Config.database = 'mongodb'; // Used for multiple database support
Config.offlineMode = false; // Skip database checking upon login
Config.mongoHost = '127.0.0.1';
Config.mongoPort = '27017';
Config.mongoUser = 'admin';
Config.mongoPassword = 'password';
Config.mongoDatabase = 'database';
Config.mongoAuth = false; // Use authentication for mongodb connections?
// World Configurations
Config.tutorialEnabled = false; // Players have to finish the tutorial before proceeding.
Config.overrideAuth = false; // !! Allows login with any credentials !!
Config.development = false;
Config.maxPlayers = 200; // Maximum number of players allowed on the server.
Config.updateTime = 20; // 20 updates (ticks) per second.
Config.gver = 1; // Game version
Config.administrators = []; // i.e. ['user1', 'user2', 'user3'] (case-insensitive)
Config.moderators = [];
// Debugging
Config.debug = false;
Config.debugLevel = 'all';
Config.fsDebugging = false; // filestream debugging -> Write to a filestream instead of stdout.
Config.allowConnectionsToggle = false; // Used closing/opening connections
exports["default"] = Config;
