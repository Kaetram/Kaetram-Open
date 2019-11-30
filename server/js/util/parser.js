/* global module */

let _ = require('underscore'),
    NPCData = require('../../data/npcs'),
    ItemData = require('../../data/items'),
    MobData = require('../../data/mobs'),
    AbilityData = require('../../data/abilities'),
    ShopsData = require('../../data/shops'),
    Mobs = require('./mobs'),
    NPCs = require('./npcs'),
    Items = require('./items'),
    Abilities = require('./abilities'),
    Shops = require('./shops'),
    Formulas = require('./formulas'),
    Constants = require('./constants');

class Parser {

    constructor() {
        let self = this;

        self.load();

        self.loadMobData();
        self.loadNPCData();
        self.loadItemData();
        self.loadAbilityData();
        self.loadShops();
        self.loadLevels();
    }

    load() {
        let self = this;

        self.onReady(() => {
            Mobs.Plugins = require ('../util/plugins')(__dirname + '/../../data/combat/');

            log.info(`Loaded ${Object.keys(Mobs.Plugins).length} combat plugins.`);
            log.info(`Loaded ${Object.keys(Items.Plugins).length} item plugins.`);
        });
    }

    loadMobData() {
        let mobCounter = 0;

        _.each(MobData, (value, key) => {
            key = key.toLowerCase();

            Mobs.Properties[key] = {
                key: key,
                id: value.id,
                name: value.name || key,
                drops: value.drops || null,
                hitPoints: value.hitPoints || 10,
                armour: value.armour || 0,
                weapon: value.weapon || 0,
                xp: value.xp || 0,
                level: value.level || 0,
                aggroRange: value.aggroRange || 2,
                attackRange: value.attackRange || 1,
                aggressive: value.aggressive || false,
                isPoisonous: value.isPoisonous || false,
                attackRate: value.attackRate || 1000,
                movementSpeed: value.movementSpeed || 200,
                projectileName: value.projectileName || null,
                spawnDelay: value.spawnDelay || 60000,
                combatPlugin: value.combatPlugin || null,
                hiddenName: value.hiddenName || false
            };

            Mobs.Ids[value.id] = Mobs.Properties[key];

            mobCounter++;
        });

        log.info('Finished loading ' + mobCounter + ' mobs.');
    }

    loadNPCData() {
        let npcCounter = 0;

        _.each(NPCData, (value, key) => {
            key = key.toLowerCase();

            NPCs.Properties[key] = {
                key: key,
                id: value.id,
                name: value.name || key,
                text: value.text || null,
                type: value.type || null
            };

            NPCs.Ids[value.id] = NPCs.Properties[key];

            npcCounter++;
        });

        log.info('Finished loading ' + npcCounter + ' NPCs.');
    }

    loadItemData() {
        let itemCounter = 0;

        _.each(ItemData, (value, key) => {
            key = key.toLowerCase();

            Items.Data[key] = {
                key: key,
                id: value.id || -1,
                type: value.type || 'object',
                attack: value.attack || 0,
                defense: value.defense || 0,
                pendantLevel: value.pendantLevel || null,
                ringLevel: value.ringLevel || null,
                bootsLevel: value.bootsLevel || null,
                name: value.name || key,
                price: value.price || 1,
                storeCount: value.storeCount || 1,
                stackable: value.stackable || 0,
                edible: value.edible || 0,
                healsHealth: value.healsHealth || 0,
                healsMana: value.healsMana || 0,
                maxStackSize: value.maxStackSize || -1,
                plugin: value.plugin || null,
                customData: value.customData || null,
                requirement: value.requirement || null
            };

            Items.Ids[value.id] = Items.Data[key];

            if (value.plugin)
                Items.Plugins[value.id] = require('../../data/items/' + value.plugin);

            itemCounter++;
        });

        log.info('Finished loading ' + itemCounter + ' items.');
    }

    loadAbilityData() {
        let skillCounter = 0;

        _.each(AbilityData, (value, key) => {
            key = key.toLowerCase();

            Abilities.Data[key] = {
                key: key,
                id: value.id,
                type: value.type,
                mana: value.mana || 0,
                cooldown: value.cooldown || null
            };

            Abilities.Ids[value.id] = Abilities.Data[key];

            skillCounter++;
        });

        log.info('Finished loading ' + skillCounter + ' skills.')
    }

    loadShops() {
        let shopCounter = 0;

        _.each(ShopsData, (value, key) => {
            key = key.toLowerCase();

            Shops.Data[key] = {
                key: key,
                npcId: value.npcId,
                items: value.items,
                count: value.count,
                originalCount: value.count,
                prices: value.prices,
                currency: value.currency,
                stockDuration: value.stockDuration
            };

            Shops.Ids[value.npcId] = Shops.Data[key];

            shopCounter++;
        });

        log.info('Finished loading ' + shopCounter + ' shops.');
    }

    loadLevels() {
        let self = this;

        Formulas.LevelExp[0] = 0;

        for (let i = 1; i < Constants.MAX_LEVEL; i++) {
            let points = Math.floor(0.25 * Math.floor(i + 300 * Math.pow(2, i / 7)));
            Formulas.LevelExp[i] = points + Formulas.LevelExp[i - 1];
        }

        if (self.readyCallback)
            self.readyCallback();
    }

    onReady(callback) {
        this.readyCallback = callback;
    }
}

module.exports = Parser;
