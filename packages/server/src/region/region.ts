import _ from 'lodash';

import { Opcodes } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import Player from '../game/entity/character/player/player';
import Messages, { Packet } from '../network/messages';

import type { RegionTileData, TilesetData } from '@kaetram/common/types/info';
import type Entity from '../game/entity/entity';
import type World from '../game/world';

interface Bounds {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export type Tile = number | number[];

interface RegionData {
    entities: { [instance: string]: Entity };
    players: string[];
    incoming: Entity[];
}

interface DynamicTiles {
    [index: number]: RegionTileData;
}

type AddCallback = (entity: Entity, regionId: string | null) => void;
type RemoveCallback = (entity: Entity, oldRegions: string[]) => void;
type IncomingCallback = (entity: Entity, regionId: string) => void;

/**
 * Region Generation.
 * This is used in order to send the client data about the new region
 * it is about to enter. This has to be greatly expanded to generated
 * instanced areas where other entities will not be pushed to surrounding
 * players, even if they share the same coordinates.
 */
export default class Region {
    public map;
    private mapRegions;

    private entities;

    public regions: { [id: string]: RegionData } = {};

    private loaded = false;

    private addCallback?: AddCallback;
    private removeCallback?: RemoveCallback;
    private incomingCallback?: IncomingCallback;

    public constructor(private world: World) {
        this.map = world.map;
        this.mapRegions = world.map.regions;

        this.entities = world.entities;

        this.onAdd((entity, regionId) => {
            if (!entity || !entity.username) return;

            log.debug(`Entity - ${entity.username} has entered region - ${regionId}`);

            if (entity instanceof Player) {
                if (!entity.questsLoaded) return;

                if (!entity.achievementsLoaded) return;

                this.sendRegion(entity, regionId);
            }
        });

        this.onRemove((entity: Entity, oldRegions: string[]) => {
            if (!oldRegions || oldRegions.length === 0 || !entity || !entity.username) return;
        });

        this.onIncoming((entity: Entity, regionId: string) => {
            if (!entity || !entity.username) return;

            log.debug(`Entity - ${entity.username} is incoming into region - ${regionId}`);
        });

        this.load();
    }

    private load(): void {
        this.mapRegions.forEachRegion((regionId: string) => {
            this.regions[regionId] = {
                entities: {},
                players: [],
                incoming: []
            };
        });

        this.loaded = true;

        log.info('Finished loading regions!');
    }

    private addEntityToInstance(entity: Entity, player: Player): void {
        if (!entity) return;

        this.add(entity, player.region);

        player.updateRegion();
    }

    /**
     * We create an instance at the player's current surrounding
     * region IDs. These will have to be disposed of whenever we're done.
     */
    public createInstance(player: Player, regionId: string | null): void {
        player.instanced = true;

        this.mapRegions.forEachSurroundingRegion(regionId, (region: string) => {
            this.regions[Region.regionIdToInstance(player, region)] = {
                entities: {},
                players: [],
                incoming: []
            };
        });

        this.handle(player, regionId);
        this.push(player);

        this.world.push(Opcodes.Push.OldRegions, {
            player,
            message: new Messages.Region(Opcodes.Region.Update, {
                id: player.instance,
                type: 'remove'
            })
        });
    }

    public deleteInstance(player: Player): void {
        player.instanced = false;

        this.handle(player);
        this.push(player);

        this.mapRegions.forEachSurroundingRegion(player.region, (regionId: string) => {
            let instancedRegion = Region.regionIdToInstance(player, regionId);

            if (instancedRegion in this.regions) delete this.regions[instancedRegion];
        });
    }

    public parseRegions(): void {
        if (!this.loaded) return;

        this.mapRegions.forEachRegion((regionId: string) => {
            if (this.regions[regionId].incoming.length === 0) return;

            this.sendSpawns(regionId);

            this.regions[regionId].incoming = [];
        });
    }

    public syncRegions(player: Player): void {
        this.handle(player);
        this.push(player);

        this.sendTilesetInfo(player);
    }

    // If `regionId` is not null, we update adjacent regions
    public updateRegions(regionId?: string): void {
        if (regionId)
            this.mapRegions.forEachSurroundingRegion(regionId, (id: string) => {
                let region = this.regions[id];

                _.each(region.players, (instance: string) => {
                    let player = this.entities.players[instance];

                    if (player) this.sendRegion(player, player.region);
                });
            });
        else
            this.entities.forEachPlayer((player: Player) => {
                player.regionsLoaded = [];

                this.sendRegion(player, player.region, true);
                this.sendTilesetInfo(player);
            });
    }

    public sendRegion(player: Player, region: string | null, force = false): void {
        let tileData = this.getRegionData(region, player, force);

        // No need to send empty data...
        if (tileData.length > 0) player.send(new Messages.Region(Opcodes.Region.Render, tileData));
    }

    // TODO - Format dynamic tiles to follow same structure as `getRegionData()`
    private getDynamicTiles(player: Player): DynamicTiles {
        let dynamicTiles: DynamicTiles = {},
            doors = player.doors.getAllTiles(),
            trees = player.getSurroundingTrees();

        doors.indexes.push(...trees.indexes);
        doors.data.push(...trees.data);
        doors.collisions.push(...trees.collisions);
        if (trees.objectData) doors.objectData = trees.objectData;

        for (let i in doors.indexes) {
            let tile = {
                    data: doors.data[i],
                    c: doors.collisions[i]
                } as RegionTileData,
                index = doors.indexes[i];

            if (!doors.objectData) break;

            if (index in doors.objectData) {
                tile.isObject = doors.objectData[index].isObject;

                if (doors.objectData[index].cursor) tile.cursor = doors.objectData[index].cursor;
            }

            dynamicTiles[index] = tile;
        }

        return dynamicTiles;
    }

    private sendTilesetInfo(player: Player): void {
        let tilesetData: TilesetData = {};

        for (let i in this.map.high)
            if (i in tilesetData) tilesetData[i].h = this.map.high[i];
            else tilesetData[i] = { h: this.map.high[i] };

        player.send(new Messages.Region(Opcodes.Region.Tileset, tilesetData));
    }

    private sendSpawns(regionId: string): void {
        if (!regionId) return;

        _.each(this.regions[regionId].incoming, (entity: Entity) => {
            if (!entity || !entity.instance || entity.instanced) return;

            this.world.push(Opcodes.Push.Regions, {
                regionId,
                message: new Messages.Spawn(entity),
                ignoreId: entity.isPlayer() ? entity.instance : null
            });
        });
    }

    private add(entity: Entity, regionId: string | null): string[] {
        let newRegions: string[] = [];

        if (entity && regionId && regionId in this.regions) {
            this.mapRegions.forEachSurroundingRegion(regionId, (id: string) => {
                if (entity.instanced) id = Region.regionIdToInstance(entity, id);

                let region = this.regions[id];

                if (region && region.entities) {
                    region.entities[entity.instance] = entity;
                    newRegions.push(id);
                }
            });

            entity.region = regionId;

            if (entity instanceof Player) this.regions[regionId].players.push(entity.instance);
        }

        this.addCallback?.(entity, regionId);

        return newRegions;
    }

    public remove(entity: Entity): string[] {
        let oldRegions: string[] = [];

        if (entity && entity.region) {
            let region = this.regions[entity.region];

            if (entity instanceof Player)
                region.players = _.reject(region.players, (id) => {
                    return id === entity.instance;
                });

            this.mapRegions.forEachSurroundingRegion(entity.region, (id: string) => {
                if (this.regions[id] && entity.instance in this.regions[id].entities) {
                    delete this.regions[id].entities[entity.instance];
                    oldRegions.push(id);
                }
            });

            entity.region = null;
        }

        this.removeCallback?.(entity, oldRegions);

        return oldRegions;
    }

    private incoming(entity: Entity, regionId: string): void {
        if (!entity || !regionId) return;

        let region = this.regions[regionId];

        if (region && !(entity.instance in region.entities)) region.incoming.push(entity);

        this.incomingCallback?.(entity, regionId);
    }

    public handle(entity: Entity, region: string | null = null): boolean {
        let regionsChanged = false;

        if (!entity) return regionsChanged;

        let regionId = region || this.mapRegions.regionIdFromPosition(entity.x, entity.y);

        if (entity.instanced) regionId = Region.regionIdToInstance(entity, regionId);

        if (!entity.region || (entity.region && entity.region !== regionId)) {
            regionsChanged = true;

            this.incoming(entity, regionId);

            let oldRegions = this.remove(entity),
                newRegions = this.add(entity, regionId);

            if (_.size(oldRegions) > 0) entity.recentRegions = _.difference(oldRegions, newRegions);
        }

        return regionsChanged;
    }

    public push(player: Player): void {
        let entities: string[];

        if (!player || !(player.region! in this.regions)) return;

        entities = _.keys(this.regions[player.region!].entities);

        entities = _.reject(entities, (instance) => {
            return instance === player.instance; // TODO //|| player.isInvisible(instance);
        });

        entities = _.map(entities, (instance: string) => {
            return instance;
        });

        player.send(new Messages.List(entities));
    }

    private changeTileAt(player: Player, newTile: Tile, x: number, y: number): void {
        let index = this.gridPositionToIndex(x, y);

        player.send(Region.getModify(index, newTile));
    }

    private changeGlobalTile(newTile: Tile, x: number, y: number): void {
        let index = this.gridPositionToIndex(x, y);

        this.map.data[index] = newTile;

        this.world.push(Opcodes.Push.Broadcast, {
            message: Region.getModify(index, newTile)
        });
    }

    private getRegionData(region: string | null, player: Player, force = false): RegionTileData[] {
        let data: RegionTileData[] = [];

        if (!player) return data;

        let dynamicTiles = this.getDynamicTiles(player);

        this.mapRegions.forEachSurroundingRegion(region, (regionId: string) => {
            if (player.hasLoadedRegion(regionId) && !force) return;

            player.loadRegion(regionId);

            let bounds = this.getRegionBounds(regionId);

            this.forEachTile(bounds, player.webSocketClient, dynamicTiles, (tile) => {
                data.push(tile);
            });
        });

        return data;
    }

    private forEachTile(
        bounds: Bounds,
        webSocket: boolean,
        dynamicTiles: DynamicTiles,
        callback: (tile: RegionTileData) => void
    ): void {
        this.forEachGrid(bounds, (x: number, y: number) => {
            let index = this.gridPositionToIndex(x - 1, y),
                tileData = this.map.data[index],
                isCollision = this.map.collisions.includes(index) || !tileData,
                objectId!: number;

            if (tileData !== 0)
                if (Array.isArray(tileData)) {
                    for (let tile of tileData)
                        if (this.map.isObject(tile)) {
                            objectId = tile;
                            break;
                        }
                } else if (this.map.isObject(tileData)) objectId = tileData;

            let info: Partial<RegionTileData> = {
                index
            };

            if (info.index! in dynamicTiles) {
                let dynamicTile = dynamicTiles[info.index!];

                info.data = dynamicTile.data;
                info.c = dynamicTile.c;

                if (dynamicTile.isObject) info.isObject = dynamicTile.isObject;
                if (dynamicTile.cursor) info.cursor = dynamicTile.cursor;
            } else {
                if (tileData) info.data = tileData as number[];
                if (isCollision) info.c = isCollision;
                if (objectId) {
                    info.isObject = !!objectId;
                    let cursor = this.map.getCursor(info.index!, objectId);
                    if (cursor) info.cursor = cursor;
                }
            }

            if (webSocket) {
                delete info.index;

                info.position = { x, y };
            }

            callback(info as RegionTileData);
        });
    }

    private forEachGrid(bounds: Bounds, callback: (x: number, y: number) => void): void {
        for (let y = bounds.startY; y < bounds.endY; y++)
            for (let x = bounds.startX; x < bounds.endX; x++) callback(x, y);
    }

    public getRegionBounds(regionId: string): Bounds {
        let regionCoordinates = this.mapRegions.regionIdToCoordinates(regionId);

        return {
            startX: regionCoordinates.x,
            startY: regionCoordinates.y,
            endX: regionCoordinates.x + this.map.regionWidth,
            endY: regionCoordinates.y + this.map.regionHeight
        };
    }

    private static getModify(index: number, newTile: Tile): Packet {
        return new Messages.Region(Opcodes.Region.Modify, {
            index,
            newTile
        });
    }

    private static instanceToRegionId(instancedRegionId: string): string {
        let region = instancedRegionId.split('-');

        return `${region[0]}-${region[1]}`;
    }

    private static regionIdToInstance(entity: Entity, regionId: string): string {
        return `${regionId}-${entity.instance}`;
    }

    public gridPositionToIndex(x: number, y: number): number {
        return y * this.map.width + x + 1;
    }

    private onAdd(callback: AddCallback): void {
        this.addCallback = callback;
    }

    private onRemove(callback: RemoveCallback): void {
        this.removeCallback = callback;
    }

    private onIncoming(callback: IncomingCallback): void {
        this.incomingCallback = callback;
    }
}
