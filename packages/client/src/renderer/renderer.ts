import _ from 'lodash';

import Tile from './tile';
import Camera from './camera';
import Item from '../entity/objects/item';
import { isMobile, isTablet } from '../utils/detect';
import Character from '../entity/character/character';

import type Player from '../entity/character/player/player';
import type Entity from '../entity/entity';
import type Sprite from '../entity/sprite';
import type Game from '../game';
import type Map from '../map/map';
import type Splat from './infos/splat';

import { RegionTile } from './../../../common/types/region';
import { DarkMask, Lamp, Lighting, RectangleObject, Vec2 } from 'illuminated';

import { Modules } from '@kaetram/common/network';
import { SerializedLight } from '@kaetram/common/types/light';

interface RendererTile {
    relativeTileId: number;
    setWidth: number;
    x: number;
    y: number;
    width: number;
    height: number;
}
interface RendererCell {
    dx: number;
    dy: number;
    width: number;
    height: number;
    flips: number[];
}

interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
}

interface RendererLight {
    origX: number;
    origY: number;
    diff: number;
    relative: boolean;
    computed: boolean;
}

type RendererLamp = RendererLight & Lamp;
// type RendererLighting = RendererLight & Lighting;
interface RendererLighting extends RendererLight, Lighting {
    light: RendererLamp;
}

enum TileFlip {
    Horizontal,
    Vertical,
    Diagonal
}

type ContextCallback = (context: CanvasRenderingContext2D) => void;

export default class Renderer {
    public background = document.querySelector<HTMLCanvasElement>('#background')!;
    private foreground = document.querySelector<HTMLCanvasElement>('#foreground')!;
    private overlay = document.querySelector<HTMLCanvasElement>('#overlay')!;
    private textCanvas = document.querySelector<HTMLCanvasElement>('#text-canvas')!;
    private entitiesCanvas = document.querySelector<HTMLCanvasElement>('#entities')!;
    private cursor = document.querySelector<HTMLCanvasElement>('#cursor')!;

    private entitiesContext: CanvasRenderingContext2D; // Entities

    public backContext: CanvasRenderingContext2D; // Backgrond

    private foreContext: CanvasRenderingContext2D; // Foreground
    private overlayContext: CanvasRenderingContext2D; // Lighting
    private textContext: CanvasRenderingContext2D; // Texts
    private cursorContext: CanvasRenderingContext2D; // Cursor

    private canvases: HTMLCanvasElement[] = [
        this.background,
        this.entitiesCanvas,
        this.foreground,
        this.overlay,
        this.textCanvas,
        this.cursor
    ];

    private allContexts: CanvasRenderingContext2D[]; // All contexts available
    private contexts: CanvasRenderingContext2D[]; // Contexts for drawing mouse, entities, text
    private drawingContexts: CanvasRenderingContext2D[]; // For drawing the map.

    private lightings: RendererLighting[] = [];

    private map: Map = this.game.map;
    private camera: Camera = this.game.camera;

    public tileSize = this.game.map.tileSize;
    private actualTileSize = this.tileSize * this.camera.zoomFactor;
    private fontSize = 10;
    private screenWidth = 0;
    private screenHeight = 0;
    public canvasHeight = 0;
    public canvasWidth = 0;
    private time = Date.now();
    private fps = 0;
    private frameCount = 0;
    private renderedFrame = [0, 0];

    private animatedTiles: { [index: number]: Tile } = {};

    private stopRendering = false;
    private animateTiles = true;
    public debugging = false;
    public autoCentre = false;
    public drawNames = true;
    public drawLevels = true;
    public transitioning = false;

    public mobile = isMobile();
    private tablet = isTablet();

    public forceRendering = (this.mobile || this.tablet) && this.camera.isCentered();

    private tiles: { [id: string]: RendererTile } = {};
    private cells: { [id: number]: RendererCell } = {};

    private darkMask: DarkMask = new DarkMask({
        lights: [],
        color: 'rgba(0, 0, 0, 0.84)'
    });

    private shadowSprite!: Sprite;
    private sparksSprite!: Sprite;

    public constructor(public game: Game) {
        // Grab the Canvas2D context from the HTML canvas.
        this.entitiesContext = this.entitiesCanvas.getContext('2d')!; // Entities;
        this.backContext = this.background.getContext('2d')!; // Background
        this.foreContext = this.foreground.getContext('2d')!; // Foreground
        this.overlayContext = this.overlay.getContext('2d')!; // Lighting
        this.textContext = this.textCanvas.getContext('2d')!; // Texts
        this.cursorContext = this.cursor.getContext('2d')!; // Cursor

        // Store all the contexts in an array so we can parse when needed.
        this.allContexts = [
            this.entitiesContext,
            this.backContext,
            this.foreContext,
            this.overlayContext,
            this.textContext,
            this.cursorContext
        ];

        // We split contexts into two arrays, one for tilemap rendering and one for the rest.
        this.contexts = [this.entitiesContext, this.textContext, this.overlayContext];
        this.drawingContexts = [this.backContext, this.foreContext];

        // Dark mask is used for the lighting system.
        this.darkMask.compute(this.overlay.width, this.overlay.height);

        this.loadSizes();
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
    }

    /**
     * Prepares the renderer for screen resizing. This is automatically
     * called through a HTML5 callback for when the screen undergoes a change.
     * We recalculate all the dimensions and positions of the canvas elements.
     * We also request that all cells are redrawn by clearing the cache.
     */

    public resize(): void {
        // Clear cells to be redrawn.
        this.cells = {};

        // Always check if we are on mobile on resizing.
        this.mobile = isMobile();

        // Update camera grid width and height.
        this.camera.update();

        // Recalculate canvas sizes.
        this.loadSizes();

        // Re-calculate visible animated tiles.
        this.updateAnimatedTiles();

        // Cursor may get stuck on when resizing from desktop to mobile proportions.
        this.clearScreen(this.cursorContext);

        // Dimensions may mess with centration, so we force it.
        this.camera.centreOn(this.game.player);

        // Prevents blank screen flickers when resizing.
        this.forceRendering = true;
    }

    /**
     * Stops the rendering loop by setting the stopRendering flag to true.
     * Clears all the contexts and fills them with a black background.
     */

    public stop(): void {
        this.stopRendering = true;

        this.forEachContext((context) => {
            context.fillStyle = 'rgba(18, 16, 13, 1)';
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        });
    }

    /**
     * Image smoothing is automatically applied to a 2D
     * rendering canvas. We must manually disable it for
     * each time we draw onto the context.
     */

    private removeSmoothing(): void {
        this.forAllContexts((context) => {
            context.imageSmoothingQuality = 'low';
            context.imageSmoothingEnabled = false;
        });
    }

    /**
     * The rendering loop that clears all the contexts, and begins
     * a new rendering one. Clear, save, draw, and restore are used
     * when working with Canvas2D.
     */

    public render(): void {
        if (this.stopRendering) return;

        // Clears and saves all the contexts
        this.clear();
        this.save();

        this.removeSmoothing();

        /**
         * Rendering related draws
         */

        this.draw();

        this.drawAnimatedTiles();

        this.drawDebugging();

        this.drawOverlays();

        this.drawHoveringCell();

        this.drawSelectedCell();

        this.drawEntities();

        this.drawInfos();

        this.drawCursor();

        this.restore();
    }

    /**
     * Background and foreground drawing function. Here we iterate
     * through all the tile visibles (every tile in the camera's view)
     * and draw them onto the foreground and background canvases depending
     * on the tileId's property (we compare to see if the tile id is that
     * of a high tile in the map).
     */

    private draw(): void {
        // Skip rendering frame if it has already been drawn.
        if (this.hasRenderedFrame()) return;

        this.clearDrawing();
        this.saveDrawing();

        // Sets the view according to the camera.
        this.updateDrawingView();

        this.forEachVisibleTile((tile: RegionTile, index: number) => {
            // Determine the layer of the tile depending on if it is a high tile or not.
            let isHighTile = this.map.isHighTile(tile),
                context = isHighTile ? this.foreContext : this.backContext;

            // Only do the lighting logic if there is an overlay.
            if (this.game.overlays.hasOverlay()) {
                let isLightTile = this.map.isLightTile(tile);

                context = isLightTile ? this.overlayContext : context;
            }

            let flips: number[] = this.getFlipped(tile);

            // Extract the tileId from the animated region tile.
            if (flips.length > 0) tile = tile.tileId;

            // Skip animated tiles unless we disable animations, then just draw the tile once.
            if (!this.map.isAnimatedTile(tile) || !this.animateTiles)
                this.drawTile(context as CanvasRenderingContext2D, tile - 1, index, flips);
        });

        this.restoreDrawing();

        this.saveFrame();
    }

    /**
     * Draws animated tiles. This function is called for each
     * animated tile that is currently visible and renders them
     * just a little bit outside the camera view.
     *
     * We are using the entities context to draw onto since the
     * background and foreground contexts do not necessarily get
     * refreshed every frame in order to save resources. The entities
     * context however, gets refreshed every frame. This is not
     * the cleanest way of doing it, but creating another canvas is
     * not really worth it.
     */

    private drawAnimatedTiles(): void {
        // Skip if we disable tile animation.
        if (!this.animateTiles) return;

        this.entitiesContext.save();
        this.setCameraView(this.entitiesContext);

        this.forEachAnimatedTile((tile) => {
            /**
             * Draw tiles only visible within the camera boundaries
             * but with an offset of 3 tiles horizontally and 2 tiles
             * vertically.
             */
            if (!this.camera.isVisible(tile.x, tile.y, 3, 2)) return;

            // Update the tile's to the current game time.
            tile.animate(this.game.time);

            // Draw the tile with the current id and index.
            this.drawTile(this.entitiesContext, tile.id, tile.index);
        });

        this.entitiesContext.restore();
    }

    /**
     * Draws the debugging menu when the global variable
     * `debugging` is set to true.
     */

    private drawDebugging(): void {
        if (!this.debugging) return;

        this.drawFPS();
        this.drawPathing();

        if (this.mobile) return;

        // No need to debug this on mobile.
        this.drawPosition();
        this.drawCollisions();
    }

    /**
     * Overlays are images drawn on top of the game. They are generally
     * used in conjunction with the lighting system to give a shadow
     * effect or dark room effect. When overlays are present, the light
     * system is enabled.
     */

    private drawOverlays(): void {
        // Overlay image cold not be found.
        if (!this.game.overlays.hasOverlay()) return;

        let image = this.game.overlays.get();

        // Draw only if there is an overlay image.
        if (image) {
            // Create a repeating pattern using the overlay image.
            this.overlayContext.fillStyle = this.overlayContext.createPattern(image, 'repeat')!;
            this.overlayContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.overlayContext.fill();
        }

        this.overlayContext.globalCompositeOperation = 'lighter';

        // Draw each lighting
        this.forEachLighting((lighting) => {
            if (this.inRadius(lighting)) this.drawLighting(lighting);
        });

        // Essentially makes the overlay be drawn on top of everything.
        this.overlayContext.globalCompositeOperation = 'source-over';
        this.darkMask.render(this.overlayContext);
    }

    /**
     * Draws the currently highlighted tile cell that the mouse
     * is hovering over. This is feedback to the player so they
     * know what cell will be selected.
     */

    private drawHoveringCell(): void {
        if (this.mobile) return;

        let { input } = this.game,
            location = input.getCoords();

        if (this.isSelectedCell(location.x, location.y)) return;

        let isColliding = this.map.isColliding(location.x, location.y);

        this.drawCellHighlight(
            location.x,
            location.y,
            isColliding ? 'rgba(230, 0, 0, 0.7)' : input.targetColour
        );
    }

    /**
     * Highlights a cell at the selected x and y grid
     * coordinates. This is the green or red spinning
     * target animation.
     */

    private drawSelectedCell(): void {
        if (!this.game.input.selectedCellVisible || this.game.input.keyMovement) return;

        // let posX = this.game.input.selectedX,
        //     posY = this.game.input.selectedY,
        let tD = this.game.input.getTargetData(); // target data

        if (tD) {
            this.entitiesContext.save();
            this.setCameraView(this.entitiesContext);

            this.entitiesContext.drawImage(
                tD.sprite.image,
                tD.x,
                tD.y,
                tD.width,
                tD.height,
                tD.dx,
                tD.dy,
                tD.dw,
                tD.dh
            );

            this.entitiesContext.restore();
        }
    }

    /**
     * Iterates through all the visible entities and
     * draws them.
     */

    private drawEntities(): void {
        // Stop drawing entities when dead.
        if (this.game.player.dead) return;

        this.setCameraView(this.entitiesContext);

        this.forEachVisibleEntity((entity: Entity) => {
            // Skip entities that aren't properly loaded or are invisible.
            if (!entity.spriteLoaded || !entity.sprite || !entity.animation || !entity.isVisible())
                return;

            this.drawEntity(entity);
        });
    }

    /**
     * Infos are drawn when a player is in combat and the hitsplat
     * displays on top of it or the targeted entity. They are also
     * used for healing, exp gain, and poison. These are floating
     * pieces of text that slowly fade as time passes.
     */

    private drawInfos(): void {
        if (this.game.info.isEmpty()) return;

        this.game.info.forEachInfo((info: Splat) => {
            this.textContext.save();
            this.setCameraView(this.textContext);
            this.textContext.globalAlpha = info.opacity;
            this.drawText(
                `${info.getText()}`,
                Math.floor(info.x + 8),
                Math.floor(info.y),
                true,
                info.fill,
                info.stroke,
                26
            );
            this.textContext.restore();
        });
    }

    /**
     * Draws the cursor at the coordinates extracted from the input
     * controller. The mouse coordinates represent the absolute position
     *  on the screen, not the position relative to the camera.
     */

    private drawCursor(): void {
        if (this.tablet || this.mobile || this.game.input.isMouseRendered()) return;

        let { cursor, mouse } = this.game.input;

        if (!cursor || !mouse) return;

        // Prepare the context for drawing.
        this.clearScreen(this.cursorContext);
        this.cursorContext.save();

        // Load the mouse if it doesn't exist.
        if (!cursor.loaded) cursor.load();
        else
            this.cursorContext.drawImage(
                cursor.image,
                0,
                0,
                this.tileSize,
                this.tileSize,
                mouse.x,
                mouse.y,
                this.actualTileSize,
                this.actualTileSize
            );

        this.cursorContext.restore();

        this.game.input.saveMouse();
    }

    /**
     * Calculates the FPS and draws it on the top-left of the screen.
     */

    private drawFPS(): void {
        this.calculateFPS();
        this.drawText(`FPS: ${this.fps}`, 10, 31, false, 'white');
    }

    /**
     * Calculates the number of frames that have accrued
     * in one second. We compare the current epoch against
     * the last recorded epoch and measure the amount of
     * frames that pass within a 1 second difference.
     */

    private calculateFPS(): void {
        let currentTime = Date.now(),
            timeDiff = currentTime - this.time;

        // Reset frame count every 1 second and store that as fps.
        if (timeDiff >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.time = currentTime;
        }

        // Increment the frame count.
        this.frameCount++;
    }

    /**
     * Draws debugging inforamtion such as the current grid coordinate,
     * as well as the index of that coordinate. If the player is hovering
     * over an entity, it displays that entity's coordinates and indexes
     * as well as their instance and attack range (if present).
     */

    private drawPosition(): void {
        let { player, input } = this.game;

        // Draw our current player's grid coordinates and tile index.
        this.drawText(
            `x: ${player.gridX} y: ${player.gridY} tileIndex: ${this.map.coordToIndex(
                player.gridX,
                player.gridY
            )}`,
            10,
            51,
            false,
            'white'
        );

        // Draw information about the entity we're hovering over.
        if (input.hovering && input.entity) {
            // Draw the entity's grid coordinates and tile index.
            this.drawText(
                `x: ${input.entity.gridX} y: ${input.entity.gridY} instance: ${input.entity.instance}`,
                10,
                71,
                false,
                'white'
            );

            // Draw the entity's attack range.
            if (input.entity.attackRange)
                this.drawText(`att range: ${input.entity.attackRange}`, 10, 91, false, 'white');
        }
    }

    /**
     * Draws a highlight around every tile cell that is colliding.
     */

    private drawCollisions(): void {
        /**
         * Iterate through each visible position within boundaries of the map
         * and determine if the tile is within the map's collision grid.
         */

        this.camera.forEachVisiblePosition((x, y) => {
            if (this.map.isOutOfBounds(x, y)) return;

            // Only draw tiles in the collision grid that are marked as colliding.
            if (this.map.grid[y][x] !== 0) this.drawCellHighlight(x, y, 'rgba(50, 50, 255, 0.5)');
        });
    }

    /**
     * Draws the currently calculated path that the player will
     * be taking. Highlights the upcoming tile cells in the path.
     */

    private drawPathing(): void {
        if (!this.game.player.hasPath()) return;

        _.each(this.game.player.path, (path) =>
            this.drawCellHighlight(path[0], path[1], 'rgba(50, 255, 50, 0.5)')
        );
    }

    /**
     * Renders an entity according to the grid position, and zoom factor.
     * @param entity The entity we are drawing.
     */

    private drawEntity(entity: Entity): void {
        let frame = entity.animation?.currentFrame,
            dx = entity.x * this.camera.zoomFactor,
            dy = entity.y * this.camera.zoomFactor,
            flipX = dx + this.actualTileSize,
            flipY = dy + entity.sprite.height;

        this.entitiesContext.save();

        if (entity.angled && !entity.isProjectile()) entity.angle *= Math.PI / 180;

        // Update the entity fading onto the context.
        if (entity.fading) this.entitiesContext.globalAlpha = entity.fadingAlpha;

        // Handle flipping since we use the same sprite for right/left.
        if (entity.spriteFlipX) {
            this.entitiesContext.translate(flipX, dy);
            this.entitiesContext.scale(-1, 1);
        } else if (entity.spriteFlipY) {
            this.entitiesContext.translate(dx, flipY);
            this.entitiesContext.scale(1, -1);
        } else this.entitiesContext.translate(dx, dy);

        // Scale the entity to the current zoom factor.
        this.entitiesContext.scale(this.camera.zoomFactor, this.camera.zoomFactor);

        // Scale the entity again if it has a custom scaling associated with it.
        if (entity.customScale) this.entitiesContext.scale(entity.customScale, entity.customScale);

        // Rotate using the entity's angle.
        if (entity.angled)
            this.entitiesContext.rotate(entity.isProjectile() ? entity.getAngle() : entity.angle);

        // Draw the entity shadowf
        if (entity.hasShadow()) {
            this.entitiesContext.globalCompositeOperation = 'source-over';

            this.entitiesContext.drawImage(
                this.shadowSprite.image,
                0,
                0,
                this.shadowSprite.width,
                this.shadowSprite.height,
                0,
                entity.shadowOffsetY,
                this.shadowSprite.width,
                this.shadowSprite.height
            );
        }

        // // this.drawEntityBack(entity);

        this.entitiesContext.drawImage(
            entity.sprite.image,
            frame!.x,
            frame!.y,
            entity.sprite.width,
            entity.sprite.height,
            entity.sprite.offsetX,
            entity.sprite.offsetY,
            entity.sprite.width,
            entity.sprite.height
        );

        this.drawEntityFore(entity);

        this.entitiesContext.restore();

        this.drawHealth(entity as Character);

        if (!this.game.overlays.hasOverlay()) this.drawName(entity as Player & Item);
    }

    /**
     * This function is responsible for drawing special effects
     * on top of the entity (after rendering). It will primarily
     * be used for the paper-doll effect of drawing weapon and
     * armour sprites on top of the player characters.
     */

    private drawEntityFore(entity: Entity): void {
        if (entity.isItem()) return this.drawSparks();

        if (!(entity instanceof Character)) return;

        if (entity.isPlayer()) this.drawWeapon(entity as Player);
        if (entity.hasEffect()) this.drawEffect(entity);
    }

    /**
     * Draws the weapon sprite on top of the player entity. We skip
     * this function if there is no weapon, the player is dead, or
     * they are teleporting.
     * @param player The player we are drawing the weapon for.
     */

    private drawWeapon(player: Player): void {
        if (!player.hasWeapon() || player.dead || player.teleporting) return;

        let weapon = this.game.sprites.get(player.getWeapon().key);

        if (!weapon) return;

        if (!weapon.loaded) weapon.load();

        let animation = player.animation!,
            weaponAnimationData = weapon.animationData[animation.name],
            frame = animation.currentFrame,
            index =
                frame.index < weaponAnimationData.length
                    ? frame.index
                    : frame.index % weaponAnimationData.length,
            weaponX = weapon.width * index,
            weaponY = weapon.height * animation.row,
            weaponWidth = weapon.width,
            weaponHeight = weapon.height;

        this.entitiesContext.drawImage(
            weapon.image,
            weaponX,
            weaponY,
            weaponWidth,
            weaponHeight,
            weapon.offsetX,
            weapon.offsetY,
            weaponWidth,
            weaponHeight
        );
    }

    /**
     * Draws a special effect on top of the character.
     * @param character The character we are drawing the effect of.
     */

    private drawEffect(character: Character): void {
        let sprite = this.game.sprites.get(character.getActiveEffect());

        if (!sprite) return;

        if (!sprite.loaded) sprite.load();

        let animation = character.getEffectAnimation()!,
            { index } = animation.currentFrame,
            x = sprite.width * index,
            y = sprite.height * animation.row;

        this.entitiesContext.drawImage(
            sprite.image,
            x,
            y,
            sprite.width,
            sprite.height,
            sprite.offsetX,
            sprite.offsetY,
            sprite.width,
            sprite.height
        );

        animation.update(this.game.time);
    }

    /**
     * Draws the sprites sparks on top of items
     * to give them the sparkle effect.
     */

    private drawSparks(): void {
        let { sparksAnimation } = this.game.entities.sprites,
            sparksFrame = sparksAnimation.currentFrame;

        this.entitiesContext.drawImage(
            this.sparksSprite.image,
            this.sparksSprite.width * sparksFrame.index,
            this.sparksSprite.height * sparksAnimation.row,
            this.sparksSprite.width,
            this.sparksSprite.height,
            0,
            0,
            this.sparksSprite.width,
            this.sparksSprite.height
        );
    }

    /**
     * Draws the health bar above the entity character provided.
     * @param entity The character we are drawing the health bar for.
     */

    private drawHealth(entity: Character): void {
        if (!entity.hitPoints || entity.hitPoints < 0 || !entity.healthBarVisible) return;

        let barLength = 16,
            healthX = entity.x * this.camera.zoomFactor - barLength / 2 + 8,
            healthY = (entity.y - entity.sprite.height / 4) * this.camera.zoomFactor,
            healthWidth = Math.round(
                (entity.hitPoints / entity.maxHitPoints) * barLength * this.camera.zoomFactor
            ),
            healthHeight = 2 * this.camera.zoomFactor;

        this.textContext.save();
        this.setCameraView(this.textContext);
        this.textContext.strokeStyle = 'rbga(0, 0, 0, 1)';
        this.textContext.lineWidth = 1;
        this.textContext.strokeRect(
            healthX,
            healthY,
            barLength * this.camera.zoomFactor,
            healthHeight
        );
        this.textContext.fillStyle = 'rgba(253, 0, 0, 1)';
        this.textContext.fillRect(healthX, healthY, healthWidth, healthHeight);
        this.textContext.restore();
    }

    /**
     * Draws an itme name for a player or item entity.
     * @param entity The entity we're drawing the name for.
     */

    private drawName(entity: Player & Item): void {
        if (entity.hidden || !entity.drawNames() || (!this.drawNames && !this.drawLevels)) return;

        let colour = entity.wanted ? 'red' : 'white';

        if (entity.rights > 1) colour = 'rgba(186,20,20, 1)';
        else if (entity.rights > 0) colour = 'rgba(165, 154, 154, 1)';

        if (entity.instance === this.game.player.instance) colour = 'rgba(252,218,92, 1)';

        if (entity.nameColour) colour = entity.nameColour;

        this.textContext.save();
        this.setCameraView(this.textContext);
        this.textContext.font = '11px AdvoCut';

        if (!entity.hasCounter) {
            let x = entity.x + 8,
                y = entity.y - Math.floor(entity.sprite.height / 3);

            if (this.drawNames && entity instanceof Character)
                this.drawText(
                    entity.name,
                    x,
                    this.drawLevels && !entity.isNPC() ? y - 8 : y,
                    true,
                    colour,
                    'rbga(0, 0, 0, 1)'
                );

            if (this.drawLevels && (entity.isMob() || entity.isPlayer()))
                this.drawText(`Level ${entity.level}`, x, y, true, colour, 'rbga(0, 0, 0, 1)');

            if (entity.isItem()) {
                if (entity.count > 1) this.drawText(entity.count.toString(), x, y, true, colour);

                if (entity.ability > -1)
                    this.drawText(
                        `${Modules.EnchantmentNames[entity.ability]} [+${entity.abilityLevel}]`,
                        x,
                        entity.y + 20,
                        true,
                        colour
                    );
            }
        } else {
            // TODO - Move this countdown elsewhere.
            if (this.game.time - entity.countdownTime > 1000) {
                entity.countdownTime = this.game.time;
                entity.counter--;
            }

            if (entity.counter <= 0) entity.hasCounter = false;

            this.drawText(entity.counter.toString(), entity.x + 8, entity.y - 10, true, colour);
        }

        this.textContext.restore();
    }

    private drawLighting(lighting: RendererLighting): void {
        if (lighting.relative) {
            let lightX =
                    (lighting.light.origX - this.camera.x / this.tileSize) * this.actualTileSize,
                lightY =
                    (lighting.light.origY - this.camera.y / this.tileSize) * this.actualTileSize;

            lighting.light.position = new Vec2(lightX, lightY);
            lighting.compute(this.overlay.width, this.overlay.height);
            this.darkMask.compute(this.overlay.width, this.overlay.height);
        } else if (!lighting.computed) {
            lighting.compute(this.overlay.width, this.overlay.height);
            lighting.computed = true;
        }

        lighting.render(this.overlayContext);
    }

    /**
     * Primitive drawing functions
     */

    /**
     * Draws a tile with a specified tileId, at a specified index. The flips
     * represent an array of transformations that the tile can undergo. If the
     * array is empty, then there are no transformations.
     * @param context The canvas that we are drawing the tile on.
     * @param tileId The tile id is used to extract the tile from the tileset.
     * @param cellId The cell id is the index of the tile in the map.
     * @param flips An array containing transformations the tile will undergo.
     */

    private drawTile(
        context: CanvasRenderingContext2D,
        tileId: number,
        cellId: number,
        flips: number[] = []
    ): void {
        if (tileId < 0) return;

        let tileset = this.map.getTilesetFromId(tileId);

        if (!tileset) return;

        /**
         * To prevent redrawing and reculating the same tile, we
         * cache the tileId in our list of tiles. These are heavy
         * calculations that we attempt to prevent from occurring
         * every frame. The same applies for the cells below.
         */

        if (!(tileId in this.tiles)) {
            let setWidth = tileset.width / this.tileSize,
                relativeTileId = tileId - tileset.firstGID;

            this.tiles[tileId] = {
                relativeTileId,
                setWidth,
                x: this.getX(relativeTileId + 1, setWidth) * this.tileSize,
                y: Math.floor(relativeTileId / setWidth) * this.tileSize,
                width: this.tileSize,
                height: this.tileSize
            };
        }

        /**
         * Cell cache stores data about every index coordinate the player
         * has explored. This may create overhead in terms of memory usage,
         * but it is a necessary optimization.
         */

        if (!(cellId in this.cells) || flips.length > 0)
            this.cells[cellId] = {
                dx: this.getX(cellId + 1, this.map.width) * this.actualTileSize,
                dy: Math.floor(cellId / this.map.width) * this.actualTileSize,
                width: this.actualTileSize,
                height: this.actualTileSize,
                flips
            };

        this.drawImage(context, tileset, this.tiles[tileId], this.cells[cellId]);
    }

    /**
     * Responsible for drawing an image at a specified tile index.
     * @param context The Canvas2D context we are drawing the image on.
     * @param image The image source to draw from (tileset).
     * @param tile The renderer tile containing information such as x, y, width, height, etc.
     * @param cell The renderer cell containing information such as dx, dy, width, height, flips.
     */

    private drawImage(
        context: CanvasRenderingContext2D,
        image: CanvasImageSource,
        tile: RendererTile,
        cell: RendererCell
    ): void {
        let dx = 0,
            dy = 0,
            isFlipped = cell.flips.length > 0;

        if (!context) return;

        /**
         * A tile rotation or flip is a combination of horizontal
         * and vertical flips, with a transpose that rotates the tile
         * 90 degrees. A transpose in our case is a rotation, followed by
         * a horizontal flip. When a tile undergoes any transformation,
         * we use these combinations to change its drawing.
         */

        if (isFlipped) {
            ({ dx, dy } = cell);

            // Save the context when we begin tile translations.
            context.save();

            // Store our delta x if we need to transpose.
            let tempX = dx;

            // Iterate through every type of flip in our array.
            for (let index of cell.flips)
                switch (index) {
                    case TileFlip.Horizontal:
                        // Flip the context2d horizontally
                        dx = -dx - cell.width;
                        context.scale(-1, 1);

                        break;

                    case TileFlip.Vertical:
                        // Flip the context2d vertically
                        dy = -dy - cell.height;
                        context.scale(1, -1);

                        break;

                    case TileFlip.Diagonal:
                        // A diagonal flip is actually a transpose of 90deg clockwise.
                        context.rotate(Math.PI / 2);
                        context.translate(0, -cell.height);

                        (dx = dy), (dy = -tempX);

                        // Flip horizontall to arrange tiles after transposing.
                        cell.flips.push(TileFlip.Horizontal);

                        break;
                }
        }

        context.drawImage(
            image,
            tile.x, // Source X
            tile.y, // Source Y
            tile.width, // Source Width
            tile.height, // Source Height
            dx || cell.dx, // Destination X
            dy || cell.dy, // Destination Y
            cell.width, // Destination Width
            cell.height // Destination Height
        );

        if (isFlipped) context.restore();
    }

    private drawText(
        text: string,
        x: number,
        y: number,
        centered: boolean,
        colour: string,
        strokeColour?: string,
        fontSize: number = this.fontSize
    ): void {
        let strokeSize = 3,
            context = this.textContext;

        context.save();

        if (centered) context.textAlign = 'center';

        // Decrease font size relative to zoom out.
        fontSize += this.camera.zoomFactor * 2;

        context.strokeStyle = strokeColour || 'rgba(55, 55, 55, 1)';
        context.lineWidth = strokeSize;
        context.font = `${fontSize}px AdvoCut`;
        context.strokeText(text, x * this.camera.zoomFactor, y * this.camera.zoomFactor);
        context.fillStyle = colour || 'white';
        context.fillText(text, x * this.camera.zoomFactor, y * this.camera.zoomFactor);

        context.restore();
    }

    /**
     * Iterates through all the currently visible tiles and appends tiles
     * that are animated to our list of animated tiles. This function ensures
     * that animated tiles are initialzied only once and stored for the
     * duration of the client's session.
     */

    public updateAnimatedTiles(): void {
        if (!this.animateTiles) return;

        this.forEachVisibleTile((id, index) => {
            /**
             * We don't want to reinitialize animated tiles that already exist
             * and are within the visible camera proportions. This way we can parse
             * it every time the tile moves slightly.
             */

            if (!this.map.isAnimatedTile(id)) return;

            /**
             * Push the pre-existing tiles.
             */

            if (!(index in this.animatedTiles)) {
                let tile = new Tile(id, index, this.map.getTileAnimation(id)),
                    position = this.map.indexToCoord(tile.index);

                tile.setPosition(position);

                this.animatedTiles[index] = tile;
            }
        }, 2);
    }

    /**
     * Temporary solution for synchronizing animated tiles.
     */

    public resetAnimatedTiles(): void {
        _.each(this.animatedTiles, (tile: Tile) => {
            tile.animationIndex = 0;
        });
    }

    private drawCellRect(x: number, y: number, colour: string): void {
        this.entitiesContext.save();
        this.setCameraView(this.entitiesContext);

        this.entitiesContext.lineWidth = 2 * this.camera.zoomFactor;

        this.entitiesContext.translate(x + 2, y + 2);

        this.entitiesContext.strokeStyle = colour;
        this.entitiesContext.strokeRect(0, 0, this.actualTileSize - 4, this.actualTileSize - 4);

        this.entitiesContext.restore();
    }

    private drawCellHighlight(x: number, y: number, colour: string): void {
        this.drawCellRect(x * this.actualTileSize, y * this.actualTileSize, colour);
    }

    /**
     * Calculates the dark mask effect for the overlay.
     * @param color What colour we want the overlay to have, generally this is
     * a black rgb(0,0,0) with an alpha to give the effect of darkness.
     */

    public updateDarkMask(color = 'rgba(0, 0, 0, 0.5)'): void {
        this.darkMask.color = color;
        this.darkMask.compute(this.overlay.width, this.overlay.height);
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

        light.diff = Math.round(light.distance / 16);

        if (this.hasLighting(lighting)) return;

        lighting.relative = true;

        this.lightings.push(lighting);
        this.darkMask.lights.push(light);

        this.drawLighting(lighting);
        this.darkMask.compute(this.overlay.width, this.overlay.height);
    }

    public removeAllLights(): void {
        this.lightings = [];
        this.darkMask.lights = [];

        this.darkMask.compute(this.overlay.width, this.overlay.height);
    }

    public removeNonRelativeLights(): void {
        _.each(this.lightings, (lighting, index) => {
            if (!lighting.light.relative) {
                this.lightings.splice(index, 1);
                this.darkMask.lights.splice(index, 1);
            }
        });

        this.darkMask.compute(this.overlay.width, this.overlay.height);
    }

    private hasLighting(lighting: RendererLighting): boolean {
        for (let index = 0; index < this.lightings.length; index++) {
            let { light } = this.lightings[index];

            if (
                lighting.light.origX === light.origX &&
                lighting.light.origY === light.origY &&
                lighting.light.distance === light.distance
            )
                return true;
        }

        return false;
    }

    /**
     * Primordial Rendering functions
     */

    private clear(): void {
        this.forEachContext((context) =>
            context.clearRect(0, 0, context.canvas.width, context.canvas.height)
        );
    }

    private clearDrawing(): void {
        this.forEachDrawingContext((context) =>
            context.clearRect(0, 0, context.canvas.width, context.canvas.height)
        );
    }

    private restore(): void {
        this.forEachContext((context) => context.restore());
    }

    private restoreDrawing(): void {
        this.forEachDrawingContext((context) => context.restore());
    }

    private hasRenderedFrame(): boolean {
        if (this.forceRendering || (this.mobile && this.camera.isCentered())) return false;

        if (this.stopRendering) return true;

        return this.renderedFrame[0] === this.camera.x && this.renderedFrame[1] === this.camera.y;
    }

    private save(): void {
        this.forEachContext((context) => context.save());
    }

    private saveDrawing(): void {
        this.forEachDrawingContext((context) => context.save());
    }

    private saveFrame(): void {
        if (this.mobile && this.camera.isCentered()) return;

        this.renderedFrame[0] = this.camera.x;
        this.renderedFrame[1] = this.camera.y;

        this.forceRendering = false;
    }

    /**
     * Rendering Functions
     */

    private updateDrawingView(): void {
        this.forEachDrawingContext((context) => this.setCameraView(context));
    }

    private setCameraView(context: CanvasRenderingContext2D): void {
        if (!this.camera || this.stopRendering) return;

        context.translate(
            -this.camera.x * this.camera.zoomFactor,
            -this.camera.y * this.camera.zoomFactor
        );
    }

    private clearScreen(context: CanvasRenderingContext2D): void {
        context.clearRect(
            0,
            0,
            this.entitiesContext.canvas.width,
            this.entitiesContext.canvas.height
        );
    }

    /**
     * Changes the brightness at a canvas style level for each
     * canvas available.
     * @param level The level of the brightness.
     */

    public setBrightness(level: number): void {
        if (level < 0 || level > 100) return;

        this.forEachCanvas((canvas: HTMLCanvasElement) => {
            canvas.style.background = `rgba(0,0,0,${0.25 - level / 200})`;
        });
    }

    /**
     * Miscellaneous functions
     */

    private getX(index: number, width: number): number {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }

    /**
     * A flipped tile is any tile that contains a flip
     * flag or transpose flag.
     * @param tileInfo Tile data received from the server.
     * @returns Whether or not the tile contains and flip flags.
     */

    private isFlipped(tileInfo: RegionTile): boolean {
        return tileInfo.v || tileInfo.h || tileInfo.d;
    }

    /**
     * Checks if the currently request coordinates are that of a cell
     * that was already selected (has the animation onto it). We want
     * to prevent drawing a target cell onto a cell that's being selected.
     * @param x The x grid coordinate we are checking.
     * @param y The y grid coordinate we are checking.
     * @returns Whether the x and y coordinates are the same as the input
     * selected x and y coordinates.
     */

    private isSelectedCell(x: number, y: number): boolean {
        return this.game.input.selectedX === x && this.game.input.selectedY === y;
    }

    private inRadius(lighting: RendererLighting): boolean {
        let position = {
            x: lighting.light.origX,
            y: lighting.light.origY,
            diff: lighting.light.diff
        };

        return (
            position.x > this.camera.gridX - position.diff &&
            position.x < this.camera.gridX + this.camera.gridWidth + position.diff &&
            position.y > this.camera.gridY - position.diff &&
            position.y < this.camera.gridY + this.camera.gridHeight + position.diff
        );
    }

    public getMiddle(): Position {
        return {
            x: this.overlay.width / 2,
            y: this.overlay.height / 2
        };
    }

    /**
     * Checks if a tile is a flipped tile and extracts
     * all the flags based on the tile data. Returns an
     * array containing all the flip flags.
     * @param tile The region tile we are checking.
     * @returns An array containing all flip flags in order.
     */

    public getFlipped(tile: RegionTile): number[] {
        let flips: number[] = [];

        // Return empty if tile doesn't contain flip flags.
        if (!this.isFlipped(tile)) return flips;

        if (tile.d) flips.push(TileFlip.Diagonal);
        if (tile.v) flips.push(TileFlip.Vertical);
        if (tile.h) flips.push(TileFlip.Horizontal);

        return flips;
    }

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

    /**
     * Setters
     */

    /**
     * Iterates through all the available contexts and returns them.
     * @param callback THe context current being iterated.
     */

    private forAllContexts(callback: ContextCallback): void {
        _.each(this.allContexts, callback);
    }

    /**
     * Iterates through all of the contexts used for drawing mouse, entities, and text.
     * @param callback The context being iterated.
     */

    private forEachContext(callback: ContextCallback): void {
        _.each(this.contexts, callback);
    }

    /**
     * Iterates through all the drawing contexts (backContext and foreContext);
     * @param callback The context being iterated.
     */

    private forEachDrawingContext(callback: ContextCallback): void {
        _.each(this.drawingContexts, callback);
    }

    /**
     * Iterates through all of the canvases available. Generally used for
     * updating dimensions.
     * @param callback Canvas currently being iterated.
     */

    private forEachCanvas(callback: (canvas: HTMLCanvasElement) => void): void {
        _.each(this.canvases, callback);
    }

    /**
     * Iterates through each light currently loaded.
     * @param callback The light currently being iterated.
     */

    private forEachLighting(callback: (lighting: RendererLighting) => void): void {
        _.each(this.lightings, callback);
    }

    /**
     * Iterates through each of the animated tiles.
     * @param callback Returns the tile object for that animated tile.
     */

    private forEachAnimatedTile(callback: (tile: Tile) => void): void {
        _.each(this.animatedTiles, callback);
    }

    /**
     * Iterates through all the indexes in the current camera view. The offset
     * is used to look `offset` amount of tiles outside the camera view.
     * @param callback The current index that is being parsed in the view.
     * @param offset How much to look outside the boundaries of the map.
     */

    private forEachVisibleIndex(callback: (index: number) => void, offset?: number): void {
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

    private forEachVisibleTile(
        callback: (data: RegionTile, index: number) => void,
        offset?: number
    ): void {
        if (!this.map || !this.map.mapLoaded) return;

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

    private forEachVisibleEntity(callback: (entity: Entity) => void): void {
        let { grids } = this.game.entities;

        this.camera.forEachVisiblePosition((x, y) => {
            if (!this.map.isOutOfBounds(x, y) && grids.renderingGrid[y][x])
                _.each(grids.renderingGrid[y][x], (entity: Entity) => callback(entity));
        });
    }
}
