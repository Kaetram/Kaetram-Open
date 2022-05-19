import { RegionTile } from './../../../common/types/region.d';
import { DarkMask, Lamp, Lighting, RectangleObject, Vec2 } from 'illuminated';
import $ from 'jquery';
import _ from 'lodash';

import { Modules } from '@kaetram/common/network';

import Tile from './tile';
import Camera from './camera';
import Item from '../entity/objects/item';
import * as Detect from '../utils/detect';
import Character from '../entity/character/character';

import type EntitiesController from '../controllers/entities';
import type InputController from '../controllers/input';
import type Player from '../entity/character/player/player';
import type Entity from '../entity/entity';
import type Sprite from '../entity/sprite';
import type Game from '../game';
import type Map from '../map/map';
import type Splat from './infos/splat';

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
    // canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;

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

    private entities!: EntitiesController;
    private input!: InputController;

    private map: Map = this.game.map;
    private camera: Camera = this.game.camera;

    public tileSize = this.game.map.tileSize;
    private fontSize = 10;
    private screenWidth = 0;
    private screenHeight = 0;
    private time = new Date();
    private fps = 0;
    private frameCount = 0;
    private renderedFrame = [0, 0];
    // lastTarget = [0, 0];

    private animatedTiles: { [index: number]: Tile } = {};
    private drawnTiles: Tile[] = [];

    public autoCentre = false;
    // drawTarget = false;
    // selectedCellVisible = false;
    private stopRendering = false;
    private animateTiles = true;
    public debugging = false;
    private brightness = 100;
    public drawNames = true;
    public drawLevels = true;
    // animatedTilesDrawCalls = 0;

    public mobile = Detect.isMobile();
    private mEdge = Detect.isEdge();
    private tablet = Detect.isTablet();

    public forceRendering = (this.mobile || this.tablet) && this.camera.isCentered();

    private tiles: { [id: string]: RendererTile } = {};
    private cells: { [id: number]: RendererCell } = {};

    private darkMask: DarkMask = new DarkMask({
        lights: [],
        color: 'rgba(0, 0, 0, 0.84)'
    });

    private lightTileSize!: number;
    public canvasHeight!: number;
    public canvasWidth!: number;
    private shadowSprite!: Sprite;
    private sparksSprite!: Sprite;
    private realFPS!: number;
    public transitioning!: boolean;
    private transitionInterval!: number;

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
        this.lightTileSize = this.tileSize * this.camera.zoomFactor;

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
        this.mobile = Detect.isMobile();

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
            context.fillStyle = '#12100D';
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

        this.calculateFPS();

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
            if (this.game.overlays.getFog()) {
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
     */

    private drawAnimatedTiles(): void {
        // Skip if we disable tile animation.
        if (!this.animateTiles) return;

        this.backContext.save();
        this.setCameraView(this.backContext);

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
            this.drawTile(this.backContext, tile.id, tile.index);
        });

        this.backContext.restore();
    }

    private drawDebugging(): void {
        if (!this.debugging) return;

        this.drawFPS();

        if (!this.mobile) {
            this.drawPosition();
            this.drawCollisions();
        }

        this.drawPathing();
    }

    private drawOverlays(): void {
        let overlay = this.game.overlays.getFog();

        if (overlay) {
            if (overlay !== 'empty') {
                let img = new Image();
                img.src = overlay;
                this.overlayContext.fillStyle = this.overlayContext.createPattern(img, 'repeat')!;
                this.overlayContext.fillRect(
                    0,
                    0,
                    this.screenWidth * this.camera.zoomFactor,
                    this.screenHeight * this.camera.zoomFactor
                );
                this.overlayContext.fill();
            }

            this.overlayContext.globalCompositeOperation = 'lighter';

            this.forEachLighting((lighting) => {
                if (this.inRadius(lighting)) this.drawLighting(lighting);
            });

            this.overlayContext.globalCompositeOperation = 'source-over';
            this.darkMask.render(this.overlayContext);
        }
    }

    /**
     * Draws the currently highlighted tile cell that the mouse
     * is hovering over. This is feedback to the player so they
     * know what cell will be selected.
     */

    private drawHoveringCell(): void {
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

    private drawEntities(): void {
        if (this.game.player.dead) return;

        this.setCameraView(this.entitiesContext);

        this.forEachVisibleEntity((entity) => {
            if (!entity) return;

            if (entity.spriteLoaded) this.drawEntity(entity);
        });
    }

    /**
     * Draws the cursor at the coordinates extracted from the input
     * controller. The mouse coordinates represent the absolute position
     *  on the screen, not the position relative to the camera.
     */

    private drawCursor(): void {
        if (this.tablet || this.mobile || this.hasRenderedMouse()) return;

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
                this.tileSize * this.camera.zoomFactor,
                this.tileSize * this.camera.zoomFactor
            );

        this.cursorContext.restore();

        this.saveMouse();
    }

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

    private drawEntity(entity: Entity): void {
        let {
            sprite,
            currentAnimation: animation,
            renderingData: data,
            angled,
            angle,
            shadowOffsetY,
            fading,
            fadingAlpha,
            spriteFlipX,
            spriteFlipY,
            customScale,
            x,
            y
        } = entity;

        if (!sprite || !animation || !entity.isVisible()) return;

        let frame = animation.currentFrame,
            dx = x * this.camera.zoomFactor,
            dy = y * this.camera.zoomFactor,
            flipX = dx + this.tileSize * this.camera.zoomFactor,
            flipY = dy + data.height;

        this.entitiesContext.save();

        if (data.sprite !== sprite) {
            data.sprite = sprite;

            data.width = sprite.width;
            data.height = sprite.height;
            data.ox = sprite.offsetX;
            data.oy = sprite.offsetY;

            if (angled && !entity.isProjectile()) data.angle = (angle * Math.PI) / 180;

            if (entity.hasShadow()) {
                data.shadowWidth = this.shadowSprite.width;
                data.shadowHeight = this.shadowSprite.height;

                data.shadowOffsetY = shadowOffsetY;
            }
        }

        if (fading) this.entitiesContext.globalAlpha = fadingAlpha;

        if (spriteFlipX) {
            this.entitiesContext.translate(flipX, dy);
            this.entitiesContext.scale(-1, 1);
        } else if (spriteFlipY) {
            this.entitiesContext.translate(dx, flipY);
            this.entitiesContext.scale(1, -1);
        } else this.entitiesContext.translate(dx, dy);

        this.entitiesContext.scale(this.camera.zoomFactor, this.camera.zoomFactor);

        if (customScale) this.entitiesContext.scale(customScale, customScale);

        if (angled)
            this.entitiesContext.rotate(entity.isProjectile() ? entity.getAngle() : data.angle);

        if (entity.hasShadow()) {
            this.entitiesContext.globalCompositeOperation = 'source-over';

            this.entitiesContext.drawImage(
                this.shadowSprite.image,
                0,
                0,
                data.shadowWidth,
                data.shadowHeight,
                0,
                data.shadowOffsetY,
                data.shadowWidth,
                data.shadowHeight
            );
        }

        // this.drawEntityBack(entity);

        this.entitiesContext.drawImage(
            sprite.image,
            frame.x,
            frame.y,
            data.width,
            data.height,
            data.ox,
            data.oy,
            data.width,
            data.height
        );

        this.drawEntityFore(entity);

        this.entitiesContext.restore();

        this.drawHealth(entity as Character);

        if (!this.game.overlays.getFog()) this.drawName(entity as Player & Item);
    }

    // /**
    //  * Function used to draw special effects prior
    //  * to rendering the entity.
    //  */
    // private drawEntityBack(entity: Entity): void {}

    /**
     * Function used to draw special effects after
     * having rendererd the entity
     */
    private drawEntityFore(entity: Entity): void {
        if (entity instanceof Character) {
            if (entity.hasWeapon() && !entity.dead && !entity.teleporting) {
                let weapon = this.game.sprites.get((entity as Player).getWeapon().key);

                if (weapon) {
                    if (!weapon.loaded) weapon.load();

                    let animation = entity.currentAnimation!,
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
            }

            if (entity.hasEffect()) {
                let sprite = this.game.sprites.get(entity.getActiveEffect());

                if (sprite) {
                    if (!sprite.loaded) sprite.load();

                    let animation = entity.getEffectAnimation()!,
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
            }
        }

        if (entity instanceof Item) {
            let { sparksAnimation } = this.game.entities.sprites,
                sparksFrame = sparksAnimation.currentFrame,
                sparksX = this.sparksSprite.width * sparksFrame.index,
                sparksY = this.sparksSprite.height * sparksAnimation.row;

            this.entitiesContext.drawImage(
                this.sparksSprite.image,
                sparksX,
                sparksY,
                this.sparksSprite.width,
                this.sparksSprite.height,
                0,
                0,
                this.sparksSprite.width,
                this.sparksSprite.height
            );
        }
    }

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
        this.textContext.strokeStyle = '#00000';
        this.textContext.lineWidth = 1;
        this.textContext.strokeRect(
            healthX,
            healthY,
            barLength * this.camera.zoomFactor,
            healthHeight
        );
        this.textContext.fillStyle = '#FD0000';
        this.textContext.fillRect(healthX, healthY, healthWidth, healthHeight);
        this.textContext.restore();
    }

    private drawName(entity: Player & Item): void {
        if (entity.hidden || !entity.drawNames() || (!this.drawNames && !this.drawLevels)) return;

        let colour = entity.wanted ? 'red' : 'white';

        if (entity.rights > 1) colour = '#ba1414';
        else if (entity.rights > 0) colour = '#a59a9a';

        if (entity.instance === this.game.player.instance) colour = '#fcda5c';

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
                    '#000'
                );

            if (this.drawLevels && (entity.isMob() || entity.isPlayer()))
                this.drawText(`Level ${entity.level}`, x, y, true, colour, '#000');

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
            let lightX = (lighting.light.origX - this.camera.x / 16) * this.lightTileSize,
                lightY = (lighting.light.origY - this.camera.y / 16) * this.lightTileSize;

            lighting.light.position = new Vec2(lightX, lightY);
            lighting.compute(this.overlay.width, this.overlay.height);
            this.darkMask.compute(this.overlay.width, this.overlay.height);
        } else if (!lighting.computed) {
            lighting.compute(this.overlay.width, this.overlay.height);
            lighting.computed = true;
        }

        lighting.render(this.overlayContext);
    }

    private calculateFPS(): void {
        if (!this.debugging) return;

        let currentTime = new Date(),
            timeDiff = currentTime.getTime() - this.time.getTime();

        if (timeDiff >= 1000) {
            this.realFPS = this.frameCount;
            this.frameCount = 0;
            this.time = currentTime;
            this.fps = this.realFPS;
        }

        this.frameCount++;
    }

    private drawFPS(): void {
        this.drawText(`FPS: ${this.realFPS}`, 10, 31, false, 'white');
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
                dx: this.getX(cellId + 1, this.map.width) * this.tileSize * this.camera.zoomFactor,
                dy: Math.floor(cellId / this.map.width) * this.tileSize * this.camera.zoomFactor,
                width: this.tileSize * this.camera.zoomFactor,
                height: this.tileSize * this.camera.zoomFactor,
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

        context.strokeStyle = strokeColour || '#373737';
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

    private drawCellRect(x: number, y: number, colour: string): void {
        let multiplier = this.tileSize * this.camera.zoomFactor;

        this.entitiesContext.save();
        this.setCameraView(this.entitiesContext);

        this.entitiesContext.lineWidth = 2 * this.camera.zoomFactor;

        this.entitiesContext.translate(x + 2, y + 2);

        this.entitiesContext.strokeStyle = colour;
        this.entitiesContext.strokeRect(0, 0, multiplier - 4, multiplier - 4);

        this.entitiesContext.restore();
    }

    private drawCellHighlight(x: number, y: number, colour: string): void {
        this.drawCellRect(
            x * this.camera.zoomFactor * this.tileSize,
            y * this.camera.zoomFactor * this.tileSize,
            colour
        );
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

    private save(): void {
        this.forEachContext((context) => context.save());
    }

    private saveDrawing(): void {
        this.forEachDrawingContext((context) => context.save());
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

    private saveFrame(): void {
        if (this.mobile && this.camera.isCentered()) return;

        this.renderedFrame[0] = this.camera.x;
        this.renderedFrame[1] = this.camera.y;

        this.forceRendering = false;
    }

    public transition(duration: number, forward: boolean, callback: () => void): void {
        let textCanvas = $('#text-canvas'),
            hasThreshold = () => (forward ? this.brightness > 99 : this.brightness < 1);
        this.transitioning = true;

        this.transitionInterval = window.setInterval(() => {
            this.brightness += forward ? 6 : -6;

            textCanvas.css('background', `rgba(0,0,0,${1 - this.brightness / 100})`);

            if (hasThreshold()) {
                clearInterval(this.transitionInterval);
                this.transitionInterval = null!;

                this.transitioning = false;

                callback();
            }
        }, duration);
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

    private hasRenderedMouse(): boolean {
        return (
            this.game.input.lastMousePosition.x === this.game.input.mouse.x &&
            this.game.input.lastMousePosition.y === this.game.input.mouse.y
        );
    }

    private saveMouse(): void {
        this.game.input.lastMousePosition.x = this.game.input.mouse.x;
        this.game.input.lastMousePosition.y = this.game.input.mouse.y;
    }

    /**
     * Changes the brightness at a canvas style level for each
     * canvas available.
     * @param level The level of the brightness.
     */

    public adjustBrightness(level: number): void {
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

    public updateDarkMask(color: string): void {
        this.darkMask.color = color;
        this.darkMask.compute(this.overlay.width, this.overlay.height);
    }

    private parseObjects(objects: Position[]): RectangleObject[] {
        let parsedObjects: RectangleObject[] = [];

        if (!objects) return parsedObjects;

        for (let object of objects)
            parsedObjects.push(
                new RectangleObject({
                    topLeft: new Vec2(object.x, object.y),
                    bottomRight: new Vec2(object.x + this.tileSize, object.y + this.tileSize)
                })
            );

        return parsedObjects;
    }

    public addLight(
        x: number,
        y: number,
        distance: number,
        diffuse: number,
        color: string,
        relative: boolean,
        objects?: Position[]
    ): void {
        let light = new Lamp(this.getLightData(x, y, distance, diffuse, color)) as RendererLamp,
            lighting = new Lighting({
                light,
                objects: this.parseObjects(objects!)
                // diffuse: light.diffuse
            }) as RendererLighting;

        light.origX = light.position.x;
        light.origY = light.position.y;

        light.diff = Math.round(light.distance / 16);

        if (this.hasLighting(lighting)) return;

        if (relative) lighting.relative = relative;

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

    public setInput(input: InputController): void {
        this.input = input;
    }

    /** The context `for` functions are used to cut down on code. **/

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
