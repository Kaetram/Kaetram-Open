/* global module */

let _ = require('underscore'),
    NPCData = require('../../data/npcs'),
    ItemData = require('../../data/items'),
    MobData = require('../../data/mobs'),
    AbilityData = require('../../data/abilities'),
    ShopsData = require('../../data/shops'),
    ObjectData = require('../../data/objects'),
    Mobs = require('./mobs'),
    NPCs = require('./npcs'),
    Items = require('./items'),
    Abilities = require('./abilities'),
    Shops = require('./shops'),
    Objects = require('./objects'),
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
        self.loadObjects();
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
                movementSpeed: value.movementSpeed || null,
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

    /**

    0,       83,     174,     275,     387,      511,      648,            - Lvl 0-6
    799,      966,    1151,    1355,    1580,     1829,     2103,          - Lvl 7-13
    2406,     2740,    3109,    3517,    3967,     4463,     5011,         - Lvl 14-20
    5616,     6283,    7020,    7833,    8730,     9720,    10813,         - Lvl 21-27
    12020,    13352,   14822,   16444,   18235,    20212,    22394,        - Lvl 28-34
    24802,    27460,   30394,   33633,   37209,    41156,    45513,        - Lvl 35-41
    50323,    55633,   61495,   67966,   75110,    82996,    91702,        - Lvl 42-48
    101314,   111925,  123640,  136573,  150851,   166614,   184017,       - Lvl 49-55
    203231,   224443,  247862,  273718,  302264,   333780,   368575,       - Lvl 56-62
    406990,   449403,  496229,  547928,  605006,   668024,   737600,       - Lvl 63-69
    814417,   899228,  992866, 1096249, 1210391,  1336413,  1475551,       - Lvl 70-76
    1629170,  1798777, 1986037, 2192787, 2421055,  2673082,  2951341,      - Lvl 77-83
    3258562,  3597759, 3972261, 4385743, 4842262,  5346298,  5902797,      - Lvl 83-89
    6517219,  7195594, 7944579, 8771523, 9684541, 10692593, 11805570,      - Lvl 90-96
    13034394, 14391123, 15889071, 17542938, 19368953, 21385034, 23610966,  - Lvl 97-103
    26068592, 28782028, 31777902, 35085613, 38737619, 42769758, 47221598,  - Lvl 104-110
    52136826, 57563675, 63555399, 70170796, 77474784, 85539037, 94442692,  - Lvl 111-117
    104273121, 115126792, 127110214, 140340981, 154948930, 171077410,      - Lvl 118-123
    188884693, 208545524, 230252838, 254219653, 280681159, 309897028,      - Lvl 124-129
    342153959, 377768495, 417090128, 460504727                             - Lvl 130-134

    **/

    loadLevels() {
        let self = this;

        Formulas.LevelExp[0] = 0;

        for (let i = 1; i < Constants.MAX_LEVEL; i++) {
            let points = Math.floor(0.25 * Math.floor(i + 300 * Math.pow(2, i / 7)));
            Formulas.LevelExp[i] = points + Formulas.LevelExp[i - 1];
        }

    }

    loadObjects() {
        let self = this,
            objectCounter = 0;

        _.each(ObjectData, (value, key) => {

            Objects.Data[key] = {
                x: value.x,
                y: value.y,
                type: value.type,
                messages: value.messages
            };

            objectCounter++;
        });

        log.info('Finished loading ' + objectCounter + ' global objects.');

        if (self.readyCallback)
            self.readyCallback();
    }

    onReady(callback) {
        this.readyCallback = callback;
    }
}

module.exports = Parser;
