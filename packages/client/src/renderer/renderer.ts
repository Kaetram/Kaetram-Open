import Tile from './tile';

import Utils from '../utils/util';
import { isMobile, isTablet } from '../utils/detect';

import { DarkMask, Vec2, Lamp, Lighting } from 'illuminated';

import type Game from '../game';
import type Map from '../map/map';
import type Camera from './camera';
import type Entity from '../entity/entity';
import type Sprite from '../entity/sprite';
import type { SerializedLight } from '@kaetram/common/types/light';
import type { RegionTile, RotatedTile } from '@kaetram/common/types/map';

interface RendererLight {
    origX: number;
    origY: number;
    diff: number;
    relative: boolean;
    computed: boolean;
}

type RendererLamp = RendererLight & Lamp;

export interface RendererLighting extends RendererLight, Lighting {
    light: RendererLamp;
}

export type ContextType = '2d' | 'webgl';

export default class Renderer {
    public background = document.querySelector<HTMLCanvasElement>('#background')!;
    protected foreground = document.querySelector<HTMLCanvasElement>('#foreground')!;
    protected overlay = document.querySelector<HTMLCanvasElement>('#overlay')!;
    protected textCanvas = document.querySelector<HTMLCanvasElement>('#text-canvas')!;
    protected entities = document.querySelector<HTMLCanvasElement>('#entities')!;
    protected cursor = document.querySelector<HTMLCanvasElement>('#cursor')!;

    // Store all canvases for easy iteration
    protected canvases: HTMLCanvasElement[] = [
        this.background,
        this.foreground,
        this.overlay,
        this.textCanvas,
        this.entities,
        this.cursor
    ];

    // Zooming buttons
    private zoomIn: HTMLElement = document.querySelector('#zoom-in')!;
    private zoomOut: HTMLElement = document.querySelector('#zoom-out')!;

    protected map: Map;
    protected camera: Camera;

    // Variables used for calculating multiple things
    public tileSize = Utils.tileSize;
    public actualTileSize = Utils.tileSize;

    // Screen dimensions
    public screenWidth = 0;
    public screenHeight = 0;

    // Canvas dimensions
    public canvasWidth = 0;
    public canvasHeight = 0;

    // Animated tiles
    public animateTiles = true;
    protected animatedTiles: { [index: number]: Tile } = {};

    // Lighting
    protected lightings: RendererLighting[] = [];
    protected darkMask: DarkMask = new DarkMask({
        lights: [],
        color: 'rgba(0, 0, 0, 0.84)'
    });

    // Toggles for rendering
    public debugging = false;
    public stopRendering = false;
    public forceRendering = false;
    public drawNames = true;
    public drawLevels = true;

    // Default values
    public fontSize = 10;

    // Detect functions
    public mobile = isMobile();
    public tablet = isTablet();

    // FPS variables
    protected time = Date.now();
    protected fps = 0;
    protected frameCount = 0;

    // Static sprites
    protected shadowSprite!: Sprite;
    protected sparksSprite!: Sprite;
    protected silverMedal!: Sprite;
    protected goldMedal!: Sprite;
    protected crownArtist!: Sprite;
    protected crownTier1!: Sprite;
    protected crownTier2!: Sprite;
    protected crownTier3!: Sprite;
    protected crownTier4!: Sprite;
    protected crownTier5!: Sprite;
    protected crownTier6!: Sprite;
    protected crownTier7!: Sprite;

    public constructor(protected game: Game) {
        this.map = game.map;
        this.camera = game.camera;

        this.tileSize = game.map.tileSize;
        this.actualTileSize = this.tileSize * this.camera.zoomFactor;

        // Load the sizes of the canvases
        this.loadSizes();

        // Load the static sprites
        this.loadStaticSprites();
    }

    /**
     * The screen width/height are calculated according to the dimensions
     * obtained from the camera. The canvas sizes are calculated according
     * to the screen width and height with the zoom factor applied. After
     * calculating the canvas size, we apply that onto each of the canvases.
     */

    private loadSizes(): void {
        // Actual tile size is the tile size times the zoom factor.
        this.actualTileSize = this.tileSize * this.camera.zoomFactor;

        // Screen width in pixels is the amount of grid spaces times the tile size.
        this.screenWidth = this.camera.gridWidth * this.tileSize;
        this.screenHeight = this.camera.gridHeight * this.tileSize;

        // Canvas width is the screen width multiplied by the zoom factor.
        this.canvasWidth = this.screenWidth * this.camera.zoomFactor;
        this.canvasHeight = this.screenHeight * this.camera.zoomFactor;

        // Update the dark mask sizes
        this.darkMask.compute(this.canvasWidth, this.canvasHeight);

        // Iterate through the canvases and apply the new size.
        this.forEachCanvas((canvas: HTMLCanvasElement) => {
            canvas.width = this.canvasWidth;
            canvas.height = this.canvasHeight;
        });
    }

    /**
     * Loads statically used sprites that are only necessary
     * in the renderer. The shadow gets displayed under each
     * entity, and the sparks are displayed around items.
     */

    public loadStaticSprites(): void {
        this.shadowSprite = this.game.sprites.get('shadow16')!;

        if (!this.shadowSprite.loaded) this.shadowSprite.load();

        this.sparksSprite = this.game.sprites.get('sparks')!;

        if (!this.sparksSprite.loaded) this.sparksSprite.load();

        this.silverMedal = this.game.sprites.get('silvermedal')!;

        if (!this.silverMedal.loaded) this.silverMedal.load();

        this.goldMedal = this.game.sprites.get('goldmedal')!;

        if (!this.goldMedal.loaded) this.goldMedal.load();

        this.crownArtist = this.game.sprites.get('crown-artist')!;

        if (!this.crownArtist.loaded) this.crownArtist.load();

        this.crownTier1 = this.game.sprites.get('crown-tier1')!;

        if (!this.crownTier1.loaded) this.crownTier1.load();

        this.crownTier2 = this.game.sprites.get('crown-tier2')!;

        if (!this.crownTier2.loaded) this.crownTier2.load();

        this.crownTier3 = this.game.sprites.get('crown-tier3')!;

        if (!this.crownTier3.loaded) this.crownTier3.load();

        this.crownTier4 = this.game.sprites.get('crown-tier4')!;

        if (!this.crownTier4.loaded) this.crownTier4.load();

        this.crownTier5 = this.game.sprites.get('crown-tier5')!;

        if (!this.crownTier5.loaded) this.crownTier5.load();

        this.crownTier6 = this.game.sprites.get('crown-tier6')!;

        if (!this.crownTier6.loaded) this.crownTier6.load();

        this.crownTier7 = this.game.sprites.get('crown-tier7')!;

        if (!this.crownTier7.loaded) this.crownTier7.load();
    }

    /**
     * Prepares the renderer for screen resizing. This is automatically
     * called through a HTML5 callback for when the screen undergoes a change.
     * We recalculate all the dimensions and positions of the canvas elements.
     * We also request that all cells are redrawn by clearing the cache.
     */

    public resize(): void {
        // Always check if we are on mobile on resizing.
        this.mobile = isMobile();

        // Update camera grid width and height.
        this.camera.update();

        // Update the camera minimum zoom limits.
        this.camera.updateMinimumZoom(this.mobile);

        // Recalculate canvas sizes.
        this.loadSizes();

        // Re-calculate visible animated tiles.
        this.updateAnimatedTiles();

        // Dimensions may mess with centration, so we force it.
        this.camera.centreOn(this.game.player);

        // Prevents blank screen flickers when resizing.
        this.forceRendering = true;
    }

    /**
     * Rendering function is implemented by each subclass implementation of the
     * renderer class. This is called by the game loop to render the game.
     */

    public render(): void {
        //
    }

    // -------------- Drawing Functions --------------

    protected drawLighting(_lighting: RendererLighting): void {
        //
    }

    // -------------- Light Management --------------

    /**
     * Calculates the dark mask effect for the overlay.
     * @param color What colour we want the overlay to have, generally this is
     * a black rgb(0,0,0) with an alpha to give the effect of darkness.
     */

    public updateDarkMask(color = 'rgba(0, 0, 0, 0.5)'): void {
        this.darkMask.color = color;
        this.darkMask.compute(this.canvasWidth, this.canvasHeight);
    }

    /**
     * Adds a new light to the rendering screen.
     * @param info Contains information about the light we are adding.
     */

    public addLight(info: SerializedLight): void {
        let light = new Lamp(
                this.getLightData(info.x, info.y, info.distance, info.diffuse, info.colour)
            ) as RendererLamp,
            lighting = new Lighting({
                light
                // diffuse: light.diffuse
            }) as RendererLighting;

        light.origX = light.position.x;
        light.origY = light.position.y;

        light.diff = Math.round(light.distance / this.tileSize);

        if (this.hasLighting(lighting)) return;

        lighting.relative = true;

        this.lightings.push(lighting);
        this.darkMask.lights.push(light);

        this.drawLighting(lighting);
        this.darkMask.compute(this.canvasWidth, this.canvasHeight);
    }

    public removeAllLights(): void {
        this.lightings = [];
        this.darkMask.lights = [];

        this.darkMask.compute(this.canvasWidth, this.canvasHeight);
    }

    public removeNonRelativeLights(): void {
        for (let i in this.lightings)
            if (!this.lightings[i].light.relative) {
                let index = parseInt(i);

                this.lightings.splice(index, 1);
                this.darkMask.lights.splice(index, 1);
            }

        this.darkMask.compute(this.canvasWidth, this.canvasHeight);
    }

    private hasLighting(lighting: RendererLighting): boolean {
        for (let { light } of this.lightings)
            if (
                lighting.light.origX === light.origX &&
                lighting.light.origY === light.origY &&
                lighting.light.distance === light.distance
            )
                return true;

        return false;
    }

    // -------------- Setters --------------

    /**
     * Changes the brightness at a canvas style level for each canvas available.
     * @param level The level of the brightness.
     */

    public setBrightness(level: number): void {
        if (level < 0 || level > 100) return;

        this.forEachCanvas((canvas: HTMLCanvasElement) => {
            canvas.style.background = `rgba(0,0,0,${0.25 - level / 200})`;
        });
    }

    // -------------- Getters and Checkers --------------

    protected getX(index: number, width: number): number {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }

    /**
     * A flipped tile is any tile that contains a flip
     * flag or transpose flag.
     * @param tileInfo Tile data received from the server.
     * @returns Whether or not the tile contains and flip flags.
     */

    protected isFlipped(tileInfo: RotatedTile): boolean {
        return tileInfo.v || tileInfo.h || tileInfo.d;
    }

    /**
     * Low power mode is activated when both the camera centration and
     * animated tiles are turned off. This is for devices that cannot
     * sustain the constant re-drawing of the frame every second.
     */

    protected isLowPowerMode(): boolean {
        return !this.camera.isCentered() && !this.animateTiles;
    }

    /**
     * Given a key we return the sprite associated with the medal.
     * @param key The key of the medal.
     * @returns A sprite element or undefined if the key is invalid.
     */

    protected getMedal(key: string): Sprite | undefined {
        switch (key) {
            case 'goldmedal': {
                return this.goldMedal;
            }

            case 'silvermedal': {
                return this.silverMedal;
            }

            case 'crown-artist': {
                return this.crownArtist;
            }

            case 'crown-tier1': {
                return this.crownTier1;
            }

            case 'crown-tier2': {
                return this.crownTier2;
            }

            case 'crown-tier3': {
                return this.crownTier3;
            }

            case 'crown-tier4': {
                return this.crownTier4;
            }

            case 'crown-tier5': {
                return this.crownTier5;
            }

            case 'crown-tier6': {
                return this.crownTier6;
            }

            case 'crown-tier7': {
                return this.crownTier7;
            }
        }
    }

    /**
     * Creates a partial lamp object given the specified data.
     * @param x The x grid position of the light.
     * @param y The y grid position of the light.
     * @param distance How far the light can reach.
     * @param diffuse How much the light can diffuse.
     * @param color The color of the light.
     * @returns A partial lamp object.
     */

    private getLightData(
        x: number,
        y: number,
        distance: number,
        diffuse: number,
        color: string
    ): Partial<Lamp> {
        return {
            position: new Vec2(x, y),
            distance,
            diffuse,
            color,
            radius: 0,
            samples: 2,
            roughness: 0,
            angle: 0
        };
    }

    // -------------- Update functions --------------

    /**
     * Used for synchronization of all animated tiles when the player
     * stops moving or every couple of steps.
     */

    public resetAnimatedTiles(): void {
        // Reset the animation frame index for each animated tile.
        for (let tile in this.animatedTiles) this.animatedTiles[tile].animationIndex = 0;
    }

    /**
     * Iterates through all the currently visible tiles and appends tiles
     * that are animated to our list of animated tiles. This function ensures
     * that animated tiles are initialzied only once and stored for the
     * duration of the client's session.
     */

    public updateAnimatedTiles(): void {
        if (!this.animateTiles) return;

        this.forEachVisibleTile((tile: RegionTile, index: number) => {
            let isFlipped = this.isFlipped(tile as RotatedTile);

            if (isFlipped) tile = (tile as RotatedTile).tileId;

            /**
             * We don't want to reinitialize animated tiles that already exist
             * and are within the visible camera proportions. This way we can parse
             * it every time the tile moves slightly.
             */

            if (!this.map.isAnimatedTile(tile as number)) return;

            /**
             * Push the pre-existing tiles.
             */

            if (!(index in this.animatedTiles))
                this.animatedTiles[index] = new Tile(
                    tile as number,
                    index,
                    this.map.getTileAnimation(tile as number),
                    isFlipped
                );
        }, 2);
    }

    /**
     * Iterates through each of the animated tiles.
     * @param callback Returns the tile object for that animated tile.
     */

    protected forEachAnimatedTile(callback: (tile: Tile) => void): void {
        for (let tile in this.animatedTiles) callback(this.animatedTiles[tile]);
    }

    /**
     * Iterates through all the indexes in the current camera view. The offset
     * is used to look `offset` amount of tiles outside the camera view.
     * @param callback The current index that is being parsed in the view.
     * @param offset How much to look outside the boundaries of the map.
     */

    protected forEachVisibleIndex(callback: (index: number) => void, offset?: number): void {
        this.camera.forEachVisiblePosition((x, y) => {
            if (!this.map.isOutOfBounds(x, y)) callback(this.map.coordToIndex(x, y));
        }, offset);
    }

    /**
     * Iterates through all the indexes and extracts the tile data at that
     * specified index by iterating through each tile array (if present) or
     * returning the tile data from the map.
     * @param callback Returns a region tile object containing rendering information
     * such as tileId, x, y, and flip flags. The index is the positioning in the map.
     * @param offset How much to look outside the visible camera proportions.
     */

    protected forEachVisibleTile(
        callback: (data: RegionTile, index: number) => void,
        offset?: number
    ): void {
        if (!this.map?.mapLoaded) return;

        this.forEachVisibleIndex((index) => {
            let indexData = this.map.data[index];

            if (Array.isArray(indexData)) for (let data of indexData) callback(data, index);
            else if (this.map.data[index]) callback(this.map.data[index], index);
        }, offset);
    }

    /**
     * Iterates through each visible entity in the map boundaries and that
     * is present on the rendering grid.
     * @param callback The entity object currently being iterated.
     */

    protected forEachVisibleEntity(callback: (entity: Entity) => void): void {
        let { grids } = this.game.entities;

        this.camera.forEachVisiblePosition((x, y) => {
            if (!this.map.isOutOfBounds(x, y) && grids.renderingGrid[y][x])
                for (let entity of Object.values(grids.renderingGrid[y][x])) callback(entity);
        });
    }

    /**
     * Iterates through all of the canvases available. Generally used for
     * updating dimensions.
     * @param callback Canvas currently being iterated.
     */

    protected forEachCanvas(callback: (canvas: HTMLCanvasElement) => void): void {
        for (let canvas in this.canvases) callback(this.canvases[canvas]);
    }
}
