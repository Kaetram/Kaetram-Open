let _ = require('underscore');

/**
 * Global Values
 */

let collisions = {},
    entities = {},
    mobsFirstGid = -1,
    map, mode;

module.exports = function parse(json, options) {
    let self = this;

    self.json = json;
    self.options = options;
    self.ignoredTiles = [1079, 1098, 1099, 1070, 1090, 1091, 930, 931,
                        950, 938, 939, 959, 203, 204, 223, 208, 209,
                        229, 1186, 1206, 1207, 1218, 1219, 1199, 1369,
                        1389, 1388, 1360, 1380, 1381, 1220, 1221, 1240,
                        1228, 1229, 1249, 3590, 3610, 3611, 3599, 3618,
                        3619, 3450, 3451, 3470, 3458, 3459, 3479, 781,
                        383, 384, 388, 389]; //Blank Tiles

    mode = self.options.mode;

    map = {
        width: 0,
        height: 0,
        collisions: [],
        version: new Date().getTime()
    };

    switch (mode) {
        case 'info':

            map.lights = [];
            map.high = [];
            map.animated = {};
            map.tilesets = [];
            map.animations = {};

            break;

        case 'client':

            map.lights = [];
            map.data = [];
            map.high = [];

            map.animated = {};

            break;

        case 'server':

            map.tilesets = [];
            map.roamingAreas = [];
            map.pvpAreas = [];
            map.gameAreas = [];
            map.doors = {};
            map.musicAreas = [];

            map.staticEntities = {};
            map.chestAreas = [];
            map.chests = [];

            map.overlayAreas = [];
            map.cameraAreas = [];

            map.lights = [];

            break;
    }

    map.width = self.json.width;
    map.height = self.json.height;

    map.tilesize = self.json.tilewidth;

    let handleProperty = function(property, value, id) {
        if (property === 'c')
            collisions[id] = true;

        if (mode === 'client' || mode === 'info') {
            if (property === 'v')
                map.high.push(id);

            if (property === 'l')
                map.lights.push(id);

            if (property === 'length') {
                if (!map.animated[id])
                    map.animated[id] = {};

                map.animated[id].l = value;
            }

            if (property === 'delay') {
                if (!map.animated[id])
                    map.animated[id] = {};

                map.animated[id].d = value;
            }
        }
    };

    let handleAnimation = function(id, firstGID, tile) {
        let animationData = [];

        _.each(tile.animation, function(animation) {
            animationData.push({
                duration: animation.duration,
                tileID: parseInt(firstGID) + parseInt(animation.tileid)
            })
        });

        map.animations[id] = animationData;
    };

    if (self.json.tilesets instanceof Array) {
        _.each(self.json.tilesets, function(tileset) {
            let name = tileset.name.toLowerCase();

            if (mode === 'info' || mode === 'server')
                if (tileset.name !== 'Mobs')
                    map.tilesets.push({
                        name: tileset.name,
                        firstGID: tileset.firstgid,
                        lastGID: tileset.firstgid + tileset.tilecount - 1,
                        imageName: tileset.image.includes('/') ? tileset.image.split('/')[2] : tileset.image,
                        scale: tileset.name === 'tilesheet' ? 2 : 1
                    });

            if (name === 'mobs' && mode === 'server') {
                mobsFirstGid = tileset.firstgid;

                _.each(tileset.tiles, function(tile) {
                    _.each(tile.properties, function(property) {
                        entities[parseInt(tile.id) + 1] = property.value;
                    });
                });
            }

            _.each(tileset.tiles, function(tile) {
                let id = parseInt(tileset.firstgid) + parseInt(tile.id);

                if (self.ignoredTiles.indexOf(tile.id) > -1)
                    return;

                if (tile.animation && mode === 'info')
                    handleAnimation(id, tileset.firstgid, tile);
                else
                    _.each(tile.properties, function(data) {
                        handleProperty(data.name, (isValid(parseInt(data.value, 10))) ?
                            parseInt(data.value, 10) : data.value, id);
                    });
            });
        });
    }

    _.each(self.json.layers, function(layer) {
        let name = layer.name.toLowerCase();

        if (mode === 'server')
            switch (name) {

                case 'doors':

                    let doors = layer.objects;

                    _.each(doors, function(door) {
                        if (door.properties.length > 2) {
                            map.doors[door.id] = {
                                o: door.properties[0].value,
                                tx: parseInt(door.properties[1].value),
                                ty: parseInt(door.properties[2].value),
                                x: door.x / 16,
                                y: door.y / 16
                            };
                        }
                    });

                    break;

                case 'roaming':

                    let areas = layer.objects;

                    for (let a = 0; a < areas.length; a++) {
                        let count = 1;

                        if (areas[a].properties)
                            count = parseInt(areas[a].properties.count, 10);

                        map.roamingAreas[a] = {
                            id: a,
                            x: areas[a].x / map.tilesize,
                            y: areas[a].y / map.tilesize,
                            width: areas[a].width / map.tilesize,
                            height: areas[a].height / map.tilesize,
                            type: areas[a].type,
                            count: count
                        }

                    }

                    break;

                case 'chestareas':

                    let cAreas = layer.objects;

                    _.each(cAreas, function(area) {
                        let chestArea = {
                            x: area.x / map.tilesize,
                            y: area.y / map.tilesize,
                            width: area.width / map.tilesize,
                            height: area.height / map.tilesize
                        };

                        _.each(area.properties, function(property) {
                            chestArea['t' + property.name] = property.value;
                        });

                        map.chestAreas.push(chestArea);
                    });

                    break;

                case 'chests':

                    let chests = layer.objects;

                    _.each(chests, function(chest) {
                        let oChest = {
                            x: chest.x / map.tilesize,
                            y: chest.y / map.tilesize
                        };

                        oChest['i'] = _.map(chest.properties[0].value.split(','), function(name) {
                            return name;
                        });

                        map.chests.push(oChest);
                    });

                    break;

                case 'lights':

                    let lights = layer.objects;

                    _.each(lights, function(lightObject) {
                        let light = {
                            x: (lightObject.x / 16) + 0.5,
                            y: (lightObject.y / 16) + 0.5
                        };

                        _.each(lightObject.properties, function(property) {
                            light[property.name] = property.value;
                        });

                        map.lights.push(light);
                    });

                    break;

                case 'music':

                    let mAreas = layer.objects;

                    _.each(mAreas, function(area) {
                        let musicArea = {
                            x: area.x / map.tilesize,
                            y: area.y / map.tilesize,
                            width: area.width / map.tilesize,
                            height: area.height / map.tilesize
                        };

                        _.each(area.properties, function(property) {
                            musicArea[property.name] = property.value;
                        });

                        map.musicAreas.push(musicArea);
                    });

                    break;

                case 'pvp':

                    let pAreas = layer.objects;

                    _.each(pAreas, function(area) {
                        let pvpArea = {
                            x: area.x / map.tilesize,
                            y: area.y / map.tilesize,
                            width: area.width / map.tilesize,
                            height: area.height / map.tilesize
                        };

                        map.pvpAreas.push(pvpArea);
                    });

                    break;

                case 'overlays':

                    let overlayAreas = layer.objects;

                    _.each(overlayAreas, function(area) {

                        let oArea = {
                            id: area.id,
                            x: area.x / map.tilesize,
                            y: area.y / map.tilesize,
                            width: area.width / map.tilesize,
                            height: area.height / map.tilesize
                        };

                        _.each(area.properties, function(property) {
                            oArea[property.name] = isNaN(property.value) ? property.value : parseFloat(property.value);
                        });

                        map.overlayAreas.push(oArea);
                    });

                    break;

                case 'camera':

                    let cameraAreas = layer.objects;

                    _.each(cameraAreas, function(area) {
                        let cArea = {
                            id: area.id,
                            x: area.x / map.tilesize,
                            y: area.y / map.tilesize,
                            width: area.width / map.tilesize,
                            height: area.height / map.tilesize,
                            type: area.properties[0].value
                        };

                        map.cameraAreas.push(cArea);
                    });

                    break;

                case 'games':

                    let gAreas = layer.objects;

                    _.each(gAreas, function(area) {
                        let gameArea = {
                            x: area.x / map.tilesize,
                            y: area.y / map.tilesize,
                            width: area.width / map.tilesize,
                            height: area.height / map.tilesize
                        };

                        map.gameAreas.push(gameArea);
                    });

                    break;
            }
    });

    for (let l = self.json.layers.length - 1; l > 0; l--)
        parseLayer(self.json.layers[l]);

    if (mode === 'client')
        for (let i = 0, max = map.data.length; i < max; i++)
            if (!map.data[i])
                map.data[i] = 0;

    if (mode === 'info')
        map.collisions = [];

    return map;
};

let isValid = function(number) {
    return number && !isNaN(number - 0) && number !== null && number !== '' && number !== false;
};

let parseLayer = function(layer) {
    let name = layer.name.toLowerCase(),
        type = layer.type;

    if (name === 'entities' && mode === 'server') {
        let tiles = layer.data;

        for (let i = 0; i < tiles.length; i++) {
            let gid = tiles[i] - mobsFirstGid + 1;

            if (gid && gid > 0)
                map.staticEntities[i] = entities[gid];
        }
    }

    let tiles = layer.data;

    if (name === 'blocking' && mode === 'client') {
        for (let j = 0; j < tiles.length; j++) {
            let bGid = tiles[j];

            if (bGid && bGid > 0)
                map.collisions.push(j);
        }
    } else if (type === 'tilelayer' && layer.visible !== 0 && name !== 'entities') {

        for (let k = 0; k < tiles.length; k++) {
            let tGid = tiles[k];

            if (mode === 'client') {
                if (tGid > 0) {
                    if (map.data[k] === undefined)
                        map.data[k] = tGid;
                    else if (map.data[k] instanceof Array)
                        map.data[k].unshift(tGid);
                    else
                        map.data[k] = [tGid, map.data[k]];
                }
            }

            if (tGid in collisions)
                map.collisions.push(k);
        }

    }

};
