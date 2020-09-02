import $ from 'jquery';
import Camera from './camera';
import Tile from './tile';
import Character from '../entity/character/character';
import Item from '../entity/objects/item';
import Modules from '../utils/modules';
import { Vec2, Lighting, Lamp, DarkMask, RectangleObject } from 'illuminated';
import * as Detect from '../utils/detect';
import _ from 'lodash';
import Game from '../game';
import EntitiesController from '../controllers/entities';
import InputController from '../controllers/input';
import Splat from './infos/splat';
import Entity from '../entity/entity';
import { EntityRenderingData } from '../entity/entity';
import Map from '../../ts/map/map';
import Sprite from '../entity/sprite';
import Player from '../entity/character/player/player';

interface RendererTile {
    relativeTileId: number;
    setWidth: number;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}
interface RendererCell {
    dx: number;
    dy: number;
    width: number;
    height: number;
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

const HORIZONTAL_FLIP_FLAG = 0x80000000,
    VERTICAL_FLIP_FLAG = 0x40000000,
    DIAGONAL_FLIP_FLAG = 0x20000000,
    ROT_90_DEG = Math.PI / 2,
    ROT_NEG_90_DEG = ROT_90_DEG * -1,
    ROT_180_DEG = Math.PI;

export default class Renderer {
    canvas: HTMLCanvasElement;
    background: HTMLCanvasElement;
    entitiesCanvas: HTMLCanvasElement;
    foreground: HTMLCanvasElement;
    overlay: HTMLCanvasElement;
    textCanvas: HTMLCanvasElement;
    cursor: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    backContext: CanvasRenderingContext2D | RenderingContext;
    foreContext: CanvasRenderingContext2D;
    overlayContext: CanvasRenderingContext2D;
    textContext: CanvasRenderingContext2D;
    cursorContext: CanvasRenderingContext2D;
    canvases: HTMLCanvasElement[];
    allContexts: (CanvasRenderingContext2D | RenderingContext)[];
    contexts: CanvasRenderingContext2D[];
    drawingContexts: (CanvasRenderingContext2D | RenderingContext)[];
    lightings: RendererLighting[];
    // textures: { [key: string]: any };
    entities: EntitiesController;
    game: Game;
    camera: Camera;
    input: InputController;
    tileSize: number;
    fontSize: number;
    screenWidth: number;
    screenHeight: number;
    time: Date;
    fps: number;
    frameCount: number;
    renderedFrame: number[];
    lastTarget: number[];
    animatedTiles: { [index: number]: Tile };
    drawnTiles: Tile[];
    resizeTimeout: NodeJS.Timeout;
    autoCentre: boolean;
    drawTarget: boolean;
    selectedCellVisible: boolean;
    stopRendering: boolean;
    animateTiles: boolean;
    debugging: boolean;
    brightness: number;
    drawNames: boolean;
    drawLevels: boolean;
    forceRendering: boolean;
    animatedTilesDrawCalls: number;
    tiles: { [id: string]: RendererTile };
    cells: { [id: number]: RendererCell };
    scale: number;
    superScaling: number;
    lightTileSize: number;
    canvasWidth: number;
    canvasHeight: number;
    webGL: boolean;
    map: Map;
    mEdge: boolean;
    firefox: boolean;
    tablet: boolean;
    mobile: boolean;
    darkMask: DarkMask;
    shadowSprite: Sprite;
    sparksSprite: Sprite;
    realFPS: number;
    transitioning: boolean;
    transitionInterval: NodeJS.Timeout;
    tileset: any;
    constructor(
        background: HTMLCanvasElement,
        entitiesCanvas: HTMLCanvasElement,
        foreground: HTMLCanvasElement,
        overlay: HTMLCanvasElement,
        textCanvas: HTMLCanvasElement,
        cursor: HTMLCanvasElement,
        game: Game
    ) {
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.background = background;
        this.entitiesCanvas = entitiesCanvas;
        this.foreground = foreground;
        this.overlay = overlay;
        this.textCanvas = textCanvas;
        this.cursor = cursor;

        this.context = this.entitiesCanvas.getContext('2d'); // Entities

        if (!Detect.supportsWebGL()) this.backContext = this.background.getContext('2d');
        // Background
        else
            this.backContext =
                this.background.getContext('webgl') ||
                this.background.getContext('experimental-webgl');

        this.foreContext = this.foreground.getContext('2d'); // Foreground
        this.overlayContext = this.overlay.getContext('2d'); // Lighting
        this.textContext = this.textCanvas.getContext('2d'); // Texts
        this.cursorContext = this.cursor.getContext('2d'); // Cursor

        this.canvases = [
            this.background,
            this.entitiesCanvas,
            this.foreground,
            this.overlay,
            this.textCanvas,
            this.cursor
        ];

        this.allContexts = [
            this.context,
            this.backContext,
            this.foreContext,
            this.overlayContext,
            this.textContext,
            this.cursorContext
        ];

        this.contexts = [this.context, this.textContext, this.overlayContext];
        this.drawingContexts = [this.backContext, this.foreContext]; // For drawing the map.

        this.lightings = [];
        // this.textures = {};

        this.game = game;
        this.camera = null;
        this.entities = null;
        this.input = null;

        this.tileSize = 16;
        this.fontSize = 16;

        this.screenWidth = 0;
        this.screenHeight = 0;

        this.time = new Date();

        this.fps = 0;
        this.frameCount = 0;
        this.renderedFrame = [0, 0];
        this.lastTarget = [0, 0];

        this.animatedTiles = {};
        this.drawnTiles = [];

        this.resizeTimeout = null;
        this.autoCentre = false;

        this.drawTarget = false;
        this.selectedCellVisible = false;

        this.stopRendering = false;
        this.animateTiles = true;
        this.debugging = false;
        this.brightness = 100;
        this.drawNames = true;
        this.drawLevels = true;
        this.forceRendering = false;
        this.animatedTilesDrawCalls = 0;

        this.tiles = {};
        this.cells = {};

        this.load();
    }

    stop(): void {
        this.camera = null;
        this.input = null;
        this.stopRendering = true;

        this.forEachContext((context) => {
            context.fillStyle = '#12100D';
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        });
    }

    load(): void {
        this.scale = this.getScale();
        this.superScaling = this.getSuperScaling();

        this.loadLights();
        this.checkDevice();
    }

    removeSmoothing(): void {
        this.forAllContexts((context) => {
            if (!context) return;

            const ctx = context as SmoothingRenderingContext;

            ctx.imageSmoothingQuality = 'low';

            ctx.imageSmoothingEnabled = false;
            /** @deprecated */
            // ctx.webkitImageSmoothingEnabled = false;
            // ctx.mozImageSmoothingEnabled = false;
            // ctx.msImageSmoothingEnabled = false;
            // ctx.oImageSmoothingEnabled = false;
        });
    }

    loadSizes(): void {
        if (!this.camera) return;

        this.lightTileSize = this.tileSize * this.superScaling;

        this.screenWidth = this.camera.gridWidth * this.tileSize;
        this.screenHeight = this.camera.gridHeight * this.tileSize;

        this.canvasWidth = this.screenWidth * this.superScaling;
        this.canvasHeight = this.screenHeight * this.superScaling;

        this.forEachCanvas((canvas) => {
            canvas.width = this.canvasWidth;
            canvas.height = this.canvasHeight;
        });

        if (this.webGL) this.map.loadWebGL(this.backContext as WebGL2RenderingContext);
    }

    loadCamera(): void {
        const storage = this.game.storage;

        this.camera = new Camera(this);

        this.loadSizes();

        if (!storage.data.new) return;

        if (this.mEdge || this.firefox || Detect.useCenteredCamera()) {
            this.camera.centered = false;

            storage.data.settings.centerCamera = false;
            storage.save();
        }
    }

    loadLights(): void {
        this.darkMask = new DarkMask({
            lights: [],
            color: 'rgba(0, 0, 0, 0.84)'
        });

        this.darkMask.compute(this.overlay.width, this.overlay.height);
    }

    resize(): void {
        this.stopRendering = true;

        this.clear();

        this.checkDevice();

        if (!this.resizeTimeout)
            this.resizeTimeout = setTimeout(() => {
                this.scale = this.getScale();
                this.clearScreen(this.cursorContext);

                if (this.camera) this.camera.update();

                this.loadSizes();

                this.game.sendClientData();

                if (this.entities) this.entities.update();

                if (this.camera) this.camera.centreOn(this.game.player);

                if (this.game.menu) this.game.menu.resize();

                this.stopRendering = false;
                this.resizeTimeout = null;

                this.updateAnimatedTiles();

                this.forceRendering = true;
            }, 500);
    }

    render(): void {
        if (this.stopRendering) return;

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

        this.drawTargetCell();

        this.drawSelectedCell();

        this.drawEntities();

        this.drawInfos();

        this.drawCursor();

        this.calculateFPS();

        this.restore();
    }

    /**
     * Context Drawing
     */

    draw(): void {
        if (this.webGL) {
            // Do the WebGL Rendering here
            this.drawWebGL();
            return;
        }

        // Canvas rendering.
        if (this.hasRenderedFrame()) return;

        this.clearDrawing();
        this.saveDrawing();

        this.updateDrawingView();

        this.forEachVisibleTile((id, index) => {
            const isHighTile = this.map.isHighTile(id);
            let context = isHighTile ? this.foreContext : this.backContext;

            // Only do the lighting logic if there is an overlay.
            if (this.game.overlays.getFog()) {
                const isLightTile = this.map.isLightTile(id);

                context = isLightTile ? this.overlayContext : context;
            }

            if (!this.map.isAnimatedTile(id) || !this.animateTiles)
                this.drawTile(context as CanvasRenderingContext2D, id, index);
        });

        this.restoreDrawing();

        this.saveFrame();
    }

    drawWebGL(): void {
        const dt = this.game.time - this.game.lastTime;

        this.game.lastTime = this.game.time;

        this.map.webGLMap.tileScale = 3;

        this.map.webGLMap.update(dt);
        this.map.webGLMap.draw(this.camera.x, this.camera.y);

        // This is a janky and temporary solution to drawing high tiles
        // on the WebGL context.

        this.foreContext.clearRect(0, 0, this.foreground.width, this.foreground.height);
        this.foreContext.save();

        this.setCameraView(this.foreContext);

        this.forEachVisibleTile((id, index) => {
            if (this.map.isHighTile(id)) this.drawTile(this.foreContext, id, index);
        });

        this.foreContext.restore();
    }

    drawAnimatedTiles(): void {
        if (!this.animateTiles || this.webGL) return;

        this.context.save();
        this.setCameraView(this.context);

        this.forEachAnimatedTile((tile) => {
            if (!this.camera.isVisible(tile.x, tile.y, 3, 1)) return;

            tile.animate(this.game.time);

            this.drawTile(this.context, tile.id, tile.index);
        });

        this.context.restore();
    }

    drawOverlays(): void {
        const overlay = this.game.overlays.getFog();

        if (overlay) {
            if (overlay !== 'empty') {
                const img = new Image();
                img.src = overlay;
                this.overlayContext.fillStyle = this.overlayContext.createPattern(img, 'repeat');
                this.overlayContext.fillRect(
                    0,
                    0,
                    this.screenWidth * this.superScaling,
                    this.screenHeight * this.superScaling
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

    drawInfos(): void {
        if (this.game.info.getCount() === 0) return;

        this.game.info.forEachInfo((info) => {
            const { opacity, text, x, y, fill, stroke } = info as Splat;

            this.textContext.save();
            this.setCameraView(this.textContext);
            this.textContext.globalAlpha = opacity;
            this.drawText(`${text}`, Math.floor(x + 8), Math.floor(y), true, fill, stroke, 26);
            this.textContext.restore();
        });
    }

    drawDebugging(): void {
        if (!this.debugging) return;

        this.drawFPS();

        if (!this.mobile) {
            this.drawPosition();
            this.drawCollisions();
        }

        this.drawPathing();
    }

    drawEntities(): void {
        if (this.game.player.dead) return;

        this.setCameraView(this.context);

        this.forEachVisibleEntity((entity) => {
            if (!entity) return;

            if (entity.spriteLoaded) this.drawEntity(entity);
        });
    }

    drawEntity(entity: Entity): void {
        const sprite = entity.sprite,
            animation = entity.currentAnimation,
            data: EntityRenderingData = entity.renderingData;

        if (!sprite || !animation || !entity.isVisible()) return;

        const frame = animation.currentFrame,
            x = frame.x * this.superScaling,
            y = frame.y * this.superScaling,
            dx = entity.x * this.superScaling,
            dy = entity.y * this.superScaling,
            flipX = dx + this.tileSize * this.superScaling,
            flipY = dy + data.height;

        this.context.save();

        if (data.sprite !== sprite) {
            data.sprite = sprite;

            data.width = sprite.width * this.superScaling;
            data.height = sprite.height * this.superScaling;
            data.ox = sprite.offsetX * this.superScaling;
            data.oy = sprite.offsetY * this.superScaling;

            if (entity.angled) data.angle = (entity.angle * Math.PI) / 180;

            if (entity.hasShadow()) {
                data.shadowWidth = this.shadowSprite.width * this.superScaling;
                data.shadowHeight = this.shadowSprite.height * this.superScaling;

                data.shadowOffsetY = entity.shadowOffsetY * this.superScaling;
            }
        }

        if (entity.fading) this.context.globalAlpha = entity.fadingAlpha;

        if (entity.spriteFlipX) {
            this.context.translate(flipX, dy);
            this.context.scale(-1, 1);
        } else if (entity.spriteFlipY) {
            this.context.translate(dx, flipY);
            this.context.scale(1, -1);
        } else this.context.translate(dx, dy);

        if (entity.customScale) this.context.scale(entity.customScale, entity.customScale);

        if (entity.angled) this.context.rotate(data.angle);

        if (entity.hasShadow()) {
            this.context.globalCompositeOperation = 'source-over';

            this.context.drawImage(
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

        this.drawEntityBack(entity);

        this.context.drawImage(
            sprite.image,
            x,
            y,
            data.width,
            data.height,
            data.ox,
            data.oy,
            data.width,
            data.height
        );

        this.drawEntityFore(entity);

        this.context.restore();

        this.drawHealth(entity as Character);

        if (!this.game.overlays.getFog()) this.drawName(entity as Player & Item);
    }

    /**
     * Function used to draw special effects prior
     * to rendering the entity.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    drawEntityBack(_entity: Entity): void {
        //
    }

    /**
     * Function used to draw special effects after
     * having rendererd the entity
     */
    drawEntityFore(entity: Entity): void {
        if (entity instanceof Character) {
            if (entity.hasWeapon() && !entity.dead && !entity.teleporting) {
                const weapon = this.entities.getSprite(entity.weapon.getString());

                if (weapon) {
                    if (!weapon.loaded) weapon.load();

                    const animation = entity.currentAnimation;
                    const weaponAnimationData = weapon.animationData[animation.name];
                    const frame = entity.currentAnimation.currentFrame;
                    const index =
                        frame.index < weaponAnimationData.length
                            ? frame.index
                            : frame.index % weaponAnimationData.length;
                    const weaponX = weapon.width * index * this.superScaling;
                    const weaponY = weapon.height * animation.row * this.superScaling;
                    const weaponWidth = weapon.width * this.superScaling;
                    const weaponHeight = weapon.height * this.superScaling;

                    this.context.drawImage(
                        weapon.image,
                        weaponX,
                        weaponY,
                        weaponWidth,
                        weaponHeight,
                        weapon.offsetX * this.superScaling,
                        weapon.offsetY * this.superScaling,
                        weaponWidth,
                        weaponHeight
                    );
                }
            }

            if (entity.hasEffect()) {
                const sprite = this.entities.getSprite(entity.getActiveEffect());

                if (!sprite.loaded) sprite.load();

                if (sprite) {
                    const animation = entity.getEffectAnimation(),
                        index = animation.currentFrame.index,
                        x = sprite.width * index * this.superScaling,
                        y = sprite.height * animation.row * this.superScaling,
                        width = sprite.width * this.superScaling,
                        height = sprite.height * this.superScaling,
                        offsetX = sprite.offsetX * this.superScaling,
                        offsetY = sprite.offsetY * this.superScaling;

                    this.context.drawImage(
                        sprite.image,
                        x,
                        y,
                        width,
                        height,
                        offsetX,
                        offsetY,
                        width,
                        height
                    );

                    animation.update(this.game.time);
                }
            }
        }

        if (entity instanceof Item) {
            const sparksAnimation = this.entities.sprites.sparksAnimation,
                sparksFrame = sparksAnimation.currentFrame,
                sparksX = this.sparksSprite.width * sparksFrame.index * this.superScaling,
                sparksY = this.sparksSprite.height * sparksAnimation.row * this.superScaling,
                sparksWidth = this.sparksSprite.width * this.superScaling,
                sparksHeight = this.sparksSprite.height * this.superScaling;

            this.context.drawImage(
                this.sparksSprite.image,
                sparksX,
                sparksY,
                sparksWidth,
                sparksHeight,
                0,
                0,
                sparksWidth,
                sparksHeight
            );
        }
    }

    drawHealth(entity: Character): void {
        if (!entity.hitPoints || entity.hitPoints < 0 || !entity.healthBarVisible) return;

        const barLength = 16,
            healthX = entity.x * this.superScaling - barLength / 2 + 8,
            healthY = (entity.y - entity.sprite.height / 4) * this.superScaling,
            healthWidth = Math.round(
                (entity.hitPoints / entity.maxHitPoints) * barLength * this.superScaling
            ),
            healthHeight = 2 * this.superScaling;

        this.textContext.save();
        this.setCameraView(this.textContext);
        this.textContext.strokeStyle = '#00000';
        this.textContext.lineWidth = 1;
        this.textContext.strokeRect(healthX, healthY, barLength * this.superScaling, healthHeight);
        this.textContext.fillStyle = '#FD0000';
        this.textContext.fillRect(healthX, healthY, healthWidth, healthHeight);
        this.textContext.restore();
    }

    drawName(entity: Player & Item): void {
        if (entity.hidden || !entity.drawNames() || (!this.drawNames && !this.drawLevels)) return;

        let colour = entity.wanted ? 'red' : 'white';

        if (entity.rights > 1) colour = '#ba1414';
        else if (entity.rights > 0) colour = '#a59a9a';

        if (entity.id === this.game.player.id) colour = '#fcda5c';

        if (entity.nameColour) colour = entity.nameColour;

        this.textContext.save();
        this.setCameraView(this.textContext);
        this.textContext.font = '11px AdvoCut';

        if (!entity.hasCounter) {
            const x = entity.x + 8;
            const y = entity.y - Math.floor(entity.sprite.height / 3);

            if (this.drawNames && entity instanceof Character)
                this.drawText(
                    entity.name,
                    x,
                    this.drawLevels && entity.type !== 'npc' ? y - 8 : y,
                    true,
                    colour,
                    '#000'
                );

            if (this.drawLevels && (entity.type === 'mob' || entity.type === 'player'))
                this.drawText(`Level ${entity.level}`, x, y, true, colour, '#000');

            if (entity.type === 'item') {
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
            //TODO - Move this countdown elsewhere.
            if (this.game.time - entity.countdownTime > 1000) {
                entity.countdownTime = this.game.time;
                entity.counter--;
            }

            if (entity.counter <= 0) entity.hasCounter = false;

            this.drawText(entity.counter.toString(), entity.x + 8, entity.y - 10, true, colour);
        }

        this.textContext.restore();
    }

    drawLighting(lighting: RendererLighting): void {
        if (lighting.relative) {
            const lightX = (lighting.light.origX - this.camera.x / 16) * this.lightTileSize,
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

    drawCursor(): void {
        if (this.tablet || this.mobile || this.hasRenderedMouse() || this.input.cursorMoved) return;

        const cursor = this.input.cursor,
            scaling = 14 * this.superScaling;

        this.clearScreen(this.cursorContext);
        this.cursorContext.save();

        if (cursor) {
            if (!cursor.loaded) cursor.load();

            if (cursor.loaded)
                this.cursorContext.drawImage(
                    cursor.image,
                    0,
                    0,
                    scaling,
                    scaling,
                    this.input.mouse.x,
                    this.input.mouse.y,
                    scaling,
                    scaling
                );
        }

        this.cursorContext.restore();

        this.saveMouse();
    }

    calculateFPS(): void {
        if (!this.debugging) return;

        const currentTime = new Date();
        const timeDiff = currentTime.getTime() - this.time.getTime();

        if (timeDiff >= 1000) {
            this.realFPS = this.frameCount;
            this.frameCount = 0;
            this.time = currentTime;
            this.fps = this.realFPS;
        }

        this.frameCount++;
    }

    drawFPS(): void {
        this.drawText(`FPS: ${this.realFPS}`, 10, 31, false, 'white');
    }

    drawPosition(): void {
        const player = this.game.player;

        this.drawText(
            `x: ${player.gridX} y: ${player.gridY} tileIndex: ${this.map.gridPositionToIndex(
                player.gridX,
                player.gridY
            )}`,
            10,
            51,
            false,
            'white'
        );

        if (this.input.hoveringEntity) {
            this.drawText(
                `x: ${this.input.getCoords().x} y: ${this.input.getCoords().y} instance: ${
                    this.input.hoveringEntity.id
                }`,
                10,
                71,
                false,
                'white'
            );
            this.drawText(
                `attack range: ${this.input.hoveringEntity.attackRange}`,
                10,
                91,
                false,
                'white'
            );
        }
    }

    drawCollisions(): void {
        const pathingGrid = this.entities.grids.pathingGrid;

        if (!pathingGrid) return;

        this.camera.forEachVisiblePosition((x, y) => {
            if (x < 0 || y < 0 || x > this.map.width - 1 || y > this.map.height - 1) return;

            if (pathingGrid[y][x] !== 0) this.drawCellHighlight(x, y, 'rgba(50, 50, 255, 0.5)');
        });
    }

    drawPathing(): void {
        if (!this.game.player.hasPath()) return;

        _.each(this.game.player.path, (path) => {
            this.drawCellHighlight(path[0], path[1], 'rgba(50, 255, 50, 0.5)');
        });
    }

    drawSelectedCell(): void {
        if (!this.input.selectedCellVisible || this.input.keyMovement) return;

        // const posX = this.input.selectedX,
        //     posY = this.input.selectedY,
        const tD = this.input.getTargetData(); // target data

        if (tD) {
            this.context.save();
            this.setCameraView(this.context);

            this.context.drawImage(
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

            this.context.restore();
        }
    }

    /**
     * Primitive drawing functions
     */

    drawTile(context: CanvasRenderingContext2D, tileId: number, cellId: number): void {
        const originalTileId = tileId;
        let rotation;

        /**
         * `originalTileId` is the tileId prior to doing any
         * bitwise operations (for rotations).
         */

        if (tileId < 0) return;

        if (tileId > DIAGONAL_FLIP_FLAG) {
            if (!(tileId & HORIZONTAL_FLIP_FLAG)) rotation = ROT_NEG_90_DEG;

            if (!(tileId & VERTICAL_FLIP_FLAG)) rotation = ROT_90_DEG;

            if (!(tileId & DIAGONAL_FLIP_FLAG)) rotation = ROT_180_DEG;

            tileId &= ~(HORIZONTAL_FLIP_FLAG | VERTICAL_FLIP_FLAG | DIAGONAL_FLIP_FLAG);
        }

        const tileset = this.map.getTilesetFromId(tileId);

        if (!tileset) return;

        /**
         * Removed tilesetScale (tileset.scale) variables since it
         * is generally always 1. The reason for the variable was
         * due to the usage of the large PNG file, which Chrome
         * split up and messed with.
         */

        if (!(originalTileId in this.tiles)) {
            const setWidth = tileset.width / this.tileSize,
                relativeTileId = tileId - tileset.firstGID + 1;

            this.tiles[originalTileId] = {
                relativeTileId: relativeTileId,
                setWidth: setWidth,
                x: this.getX(relativeTileId + 1, setWidth) * this.tileSize,
                y: Math.floor(relativeTileId / setWidth) * this.tileSize,
                width: this.tileSize,
                height: this.tileSize,
                rotation: rotation
            };
        }

        if (!(cellId in this.cells)) {
            const scale = this.superScaling;

            this.cells[cellId] = {
                dx: this.getX(cellId + 1, this.map.width) * this.tileSize * scale,
                dy: Math.floor(cellId / this.map.width) * this.tileSize * scale,
                width: this.tileSize * scale,
                height: this.tileSize * scale
            };
        }

        this.drawImage(context, tileset, this.tiles[originalTileId], this.cells[cellId]);
    }

    drawImage(
        context: CanvasRenderingContext2D,
        image: CanvasImageSource,
        tile: RendererTile,
        cell: RendererCell
    ): void {
        // const scale = this.superScaling;
        let dx, dy; // this.superScaling * 1.5;

        if (!context) return;

        if (tile.rotation) {
            context.save();
            context.rotate(tile.rotation);

            dx = cell.dx;
            dy = cell.dy;

            const temp = cell.dx;

            switch (tile.rotation) {
                case ROT_180_DEG:
                    context.translate(-cell.width, -cell.height);

                    (dx = -dx), (dy = -dy);

                    break;

                case ROT_90_DEG:
                    context.translate(0, -cell.height);

                    (dx = dy), (dy = -temp);

                    break;

                case ROT_NEG_90_DEG:
                    context.translate(-cell.width, 0);

                    (dx = -dy), (dy = temp);

                    break;
            }
        }

        context.drawImage(
            image,
            tile.x, // Source X
            tile.y, // Source Y
            tile.width, // Source Width
            tile.height, // Source Height
            tile.rotation ? dx : cell.dx, // Destination X
            tile.rotation ? dy : cell.dy, // Destination Y
            cell.width, // Destination Width
            cell.height
        ); // Destination Height

        if (tile.rotation) context.restore();
    }

    drawText(
        text: string,
        x: number,
        y: number,
        centered: boolean,
        colour: string,
        strokeColour?: string,
        fontSize?: number
    ): void {
        const strokeSize = 3,
            context = this.textContext;

        if (text && x && y) {
            context.save();

            if (centered) context.textAlign = 'center';

            context.strokeStyle = strokeColour || '#373737';
            context.lineWidth = strokeSize;
            context.font = `${fontSize || this.fontSize}px AdvoCut`;
            context.strokeText(text, x * this.superScaling, y * this.superScaling);
            context.fillStyle = colour || 'white';
            context.fillText(text, x * this.superScaling, y * this.superScaling);

            context.restore();
        }
    }

    updateAnimatedTiles(): void {
        if (!this.animateTiles || this.webGL) return;

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
                const tile = new Tile(id, index, this.map),
                    position = this.map.indexToGridPosition(tile.index);

                tile.setPosition(position);

                this.animatedTiles[index] = tile;
            }
        }, 2);
    }

    drawCellRect(x: number, y: number, colour: string): void {
        const multiplier = this.tileSize * this.superScaling;

        this.context.save();
        this.setCameraView(this.context);

        this.context.lineWidth = 2 * this.superScaling;

        this.context.translate(x + 2, y + 2);

        this.context.strokeStyle = colour;
        this.context.strokeRect(0, 0, multiplier - 4, multiplier - 4);

        this.context.restore();
    }

    drawCellHighlight(x: number, y: number, colour: string): void {
        this.drawCellRect(
            x * this.superScaling * this.tileSize,
            y * this.superScaling * this.tileSize,
            colour
        );
    }

    drawTargetCell(): void {
        if (
            this.mobile ||
            this.tablet ||
            !this.input.targetVisible ||
            !this.input ||
            !this.camera ||
            !this.map ||
            this.input.keyMovement
        )
            return;

        const location = this.input.getCoords();

        if (!(location.x === this.input.selectedX && location.y === this.input.selectedY)) {
            const isColliding = this.map.isColliding(location.x, location.y);

            this.drawCellHighlight(
                location.x,
                location.y,
                isColliding ? 'rgba(230, 0, 0, 0.7)' : this.input.targetColour
            );
        }
    }

    /**
     * Primordial Rendering functions
     */

    forEachVisibleIndex(callback: (index: number) => void, offset: number): void {
        this.camera.forEachVisiblePosition((x, y) => {
            if (!this.map.isOutOfBounds(x, y)) callback(this.map.gridPositionToIndex(x, y) - 1);
        }, offset);
    }

    forEachVisibleTile(callback: (data: number, index: number) => void, offset?: number): void {
        if (!this.map || !this.map.mapLoaded) return;

        this.forEachVisibleIndex((index) => {
            const indexData = this.map.data[index];

            if (Array.isArray(indexData))
                for (const i in indexData) callback(indexData[i] - 1, index);
            else if (!isNaN(this.map.data[index] - 1)) callback(this.map.data[index] - 1, index);
        }, offset);
    }

    forEachAnimatedTile(callback: (tile: Tile) => void): void {
        _.each(this.animatedTiles, (tile) => {
            callback(tile);
        });
    }

    forEachVisibleEntity(callback: (entity: Entity) => void): void {
        if (!this.entities || !this.camera) return;

        const grids = this.entities.grids;

        this.camera.forEachVisiblePosition((x, y) => {
            if (!this.map.isOutOfBounds(x, y) && grids.renderingGrid[y][x])
                _.each(grids.renderingGrid[y][x], (entity: Entity) => {
                    callback(entity);
                });
        });
    }

    getScale(): number {
        return this.game.getScaleFactor();
    }

    getSuperScaling(): number {
        return 3;
    }

    clear(): void {
        this.forEachContext((context) => {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        });
    }

    clearText(): void {
        this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        this.overlayContext.clearRect(0, 0, this.overlay.width, this.overlay.height);
    }

    clearDrawing(): void {
        this.forEachDrawingContext((context) => {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        });
    }

    save(): void {
        this.forEachContext((context) => {
            context.save();
        });
    }

    saveDrawing(): void {
        this.forEachDrawingContext((context) => {
            context.save();
        });
    }

    restore(): void {
        this.forEachContext((context) => {
            context.restore();
        });
    }

    restoreDrawing(): void {
        this.forEachDrawingContext((context) => {
            context.restore();
        });
    }

    hasRenderedFrame(): boolean {
        if (this.forceRendering || (this.mobile && this.camera.centered)) return false;

        if (!this.camera || this.stopRendering || !this.input) return true;

        return this.renderedFrame[0] === this.camera.x && this.renderedFrame[1] === this.camera.y;
    }

    saveFrame(): void {
        if (this.mobile && this.camera.centered) return;

        this.renderedFrame[0] = this.camera.x;
        this.renderedFrame[1] = this.camera.y;

        this.forceRendering = false;
    }

    transition(duration: number, forward: boolean, callback: () => void): void {
        const textCanvas = $('#textCanvas'),
            hasThreshold = () => {
                return forward ? this.brightness > 99 : this.brightness < 1;
            };

        this.transitioning = true;

        this.transitionInterval = setInterval(() => {
            this.brightness += forward ? 6 : -6;

            textCanvas.css('background', `rgba(0,0,0,${1 - this.brightness / 100})`);

            if (hasThreshold()) {
                clearInterval(this.transitionInterval);
                this.transitionInterval = null;

                this.transitioning = false;

                callback();
            }
        }, duration);
    }

    /**
     * Rendering Functions
     */

    updateView(): void {
        this.forEachContext((context) => {
            this.setCameraView(context);
        });
    }

    updateDrawingView(): void {
        this.forEachDrawingContext((context) => {
            this.setCameraView(context);
        });
    }

    setCameraView(context: CanvasRenderingContext2D): void {
        if (!this.camera || this.stopRendering) return;

        context.translate(-this.camera.x * this.superScaling, -this.camera.y * this.superScaling);
    }

    clearScreen(context: CanvasRenderingContext2D): void {
        context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }

    hasRenderedMouse(): boolean {
        return (
            this.input.lastMousePosition.x === this.input.mouse.x &&
            this.input.lastMousePosition.y === this.input.mouse.y
        );
    }

    saveMouse(): void {
        this.input.lastMousePosition.x = this.input.mouse.x;
        this.input.lastMousePosition.y = this.input.mouse.y;
    }

    adjustBrightness(level: number): void {
        if (level < 0 || level > 100) return;

        $('#textCanvas').css('background', `rgba(0, 0, 0, ${0.5 - level / 200})`);
    }

    loadStaticSprites(): void {
        this.shadowSprite = this.entities.getSprite('shadow16');

        if (!this.shadowSprite.loaded) this.shadowSprite.load();

        this.sparksSprite = this.entities.getSprite('sparks');

        if (!this.sparksSprite.loaded) this.sparksSprite.load();
    }

    hasDrawnTile(id: Tile): boolean {
        return this.drawnTiles.indexOf(id) > -1;
    }

    /**
     * Miscellaneous functions
     */

    forAllContexts(callback: (context: CanvasRenderingContext2D) => void): void {
        _.each(this.allContexts, (context) => {
            callback(context as CanvasRenderingContext2D);
        });
    }

    forEachContext(callback: (context: CanvasRenderingContext2D) => void): void {
        _.each(this.contexts, (context) => {
            callback(context);
        });
    }

    forEachDrawingContext(callback: (context: CanvasRenderingContext2D) => void): void {
        _.each(this.drawingContexts, (context) => {
            callback(context as CanvasRenderingContext2D);
        });
    }

    forEachCanvas(callback: (canvas: HTMLCanvasElement) => void): void {
        _.each(this.canvases, (canvas) => {
            callback(canvas);
        });
    }

    forEachLighting(callback: (lighting: RendererLighting) => void): void {
        _.each(this.lightings, (lighting) => {
            callback(lighting);
        });
    }

    getX(index: number, width: number): number {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }

    checkDevice(): void {
        this.mobile = Detect.isMobile();
        this.tablet = Detect.isTablet();
        this.firefox = Detect.isFirefox();
        this.mEdge = Detect.isEdge();
        this.webGL = Detect.supportsWebGL();

        //this.animateTiles = !this.firefox && !this.mEdge;
    }

    verifyCentration(): void {
        this.forceRendering = (this.mobile || this.tablet) && this.camera.centered;
    }

    isPortableDevice(): boolean {
        return this.mobile || this.tablet;
    }

    updateDarkMask(color: string): void {
        this.darkMask.color = color;
        this.darkMask.compute(this.overlay.width, this.overlay.height);
    }

    parseObjects(objects: Pos[]): RectangleObject[] {
        const parsedObjects = [];

        if (!objects) return parsedObjects;

        for (let i = 0; i < objects.length; i++) {
            const object = objects[i];

            parsedObjects.push(
                new RectangleObject({
                    topleft: new Vec2(object.x, object.y),
                    bottomright: new Vec2(object.x + this.tileSize, object.y + this.tileSize)
                })
            );
        }

        return parsedObjects;
    }

    addLight(
        x: number,
        y: number,
        distance: number,
        diffuse: number,
        color: string,
        relative: boolean,
        objects?: Pos[]
    ): void {
        const light = new Lamp(this.getLightData(x, y, distance, diffuse, color)) as RendererLamp,
            lighting = new Lighting({
                light: light,
                objects: this.parseObjects(objects)
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

    removeAllLights(): void {
        this.lightings = [];
        this.darkMask.lights = [];

        this.darkMask.compute(this.overlay.width, this.overlay.height);
    }

    removeNonRelativeLights(): void {
        _.each(this.lightings, (lighting, i) => {
            if (!lighting.light.relative) {
                this.lightings.splice(i, 1);
                this.darkMask.lights.splice(i, 1);
            }
        });

        this.darkMask.compute(this.overlay.width, this.overlay.height);
    }

    getLightData(
        x: number,
        y: number,
        distance: number,
        diffuse: number,
        color: string
    ): Partial<Lamp> {
        return {
            position: new Vec2(x, y),
            distance: distance,
            diffuse: diffuse,
            color: color,
            radius: 0,
            samples: 2,
            roughness: 0,
            angle: 0
        };
    }

    hasLighting(lighting: RendererLighting): boolean {
        for (let i = 0; i < this.lightings.length; i++) {
            const light = this.lightings[i].light;

            if (
                lighting.light.origX === light.origX &&
                lighting.light.origY === light.origY &&
                lighting.light.distance === light.distance
            )
                return true;
        }

        return false;
    }

    inRadius(lighting: RendererLighting): boolean {
        const position = {
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

    getMiddle(): Pos {
        return {
            x: this.overlay.width / 2,
            y: this.overlay.height / 2
        };
    }

    /**
     * Setters
     */

    setTileset(tileset): void {
        this.tileset = tileset;
    }

    setMap(map: Map): void {
        this.map = map;
    }

    setEntities(entities: EntitiesController): void {
        this.entities = entities;
    }

    setInput(input: InputController): void {
        this.input = input;
    }

    /**
     * Getters
     */

    getTargetBounds(x: number, y: number): Bounds {
        const bounds: Partial<Bounds> = {},
            tx = x || this.input.selectedX,
            ty = y || this.input.selectedY;

        bounds.x = (tx * this.tileSize - this.camera.x) * this.superScaling;
        bounds.y = (ty * this.tileSize - this.camera.y) * this.superScaling;
        bounds.width = this.tileSize * this.superScaling;
        bounds.height = this.tileSize * this.superScaling;
        bounds.left = bounds.x;
        bounds.right = bounds.x + bounds.width;
        bounds.top = bounds.y;
        bounds.bottom = bounds.y + bounds.height;

        return bounds as Bounds;
    }

    getTileset() {
        return this.tileset;
    }
}
