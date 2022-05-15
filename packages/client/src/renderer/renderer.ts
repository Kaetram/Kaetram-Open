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

const MAXIMUM_ZOOM = 6,
    MINIMUM_ZOOM = 2.6;

export default class Renderer {
    // canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;

    public background = document.querySelector<HTMLCanvasElement>('#background')!;
    private foreground = document.querySelector<HTMLCanvasElement>('#foreground')!;
    private overlay = document.querySelector<HTMLCanvasElement>('#overlay')!;
    private textCanvas = document.querySelector<HTMLCanvasElement>('#text-canvas')!;
    private entitiesCanvas = document.querySelector<HTMLCanvasElement>('#entities')!;
    private cursor = document.querySelector<HTMLCanvasElement>('#cursor')!;

    private context: CanvasRenderingContext2D;

    public backContext: CanvasRenderingContext2D;

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

    private allContexts: RenderingContext[];

    private contexts: CanvasRenderingContext2D[];
    private drawingContexts: RenderingContext[]; // For drawing the map.

    private lightings: RendererLighting[] = [];

    private entities!: EntitiesController;
    public camera!: Camera;
    private input!: InputController;

    public tileSize = this.game.map.tileSize;
    private fontSize = 16;
    private screenWidth = 0;
    private screenHeight = 0;
    private time = new Date();
    private fps = 0;
    private frameCount = 0;
    private renderedFrame = [0, 0];
    // lastTarget = [0, 0];

    private animatedTiles: { [index: number]: Tile } = {};
    private drawnTiles: Tile[] = [];

    private resizeTimeout: number | null = null;

    public autoCentre = false;
    // drawTarget = false;
    // selectedCellVisible = false;
    private stopRendering = false;
    private animateTiles = true;
    public debugging = false;
    private brightness = 100;
    public drawNames = true;
    public drawLevels = true;
    public forceRendering = false;
    // animatedTilesDrawCalls = 0;

    private tiles: { [id: string]: RendererTile } = {};
    private cells: { [id: number]: RendererCell } = {};

    public zoomFactor = 3;

    private lightTileSize!: number;
    public canvasHeight!: number;
    public canvasWidth!: number;
    public map!: Map;
    private mEdge!: boolean;
    private tablet!: boolean;
    public mobile!: boolean;
    private darkMask!: DarkMask;
    private shadowSprite!: Sprite;
    private sparksSprite!: Sprite;
    private realFPS!: number;
    public transitioning!: boolean;
    private transitionInterval!: number;
    private tileset: unknown;

    public constructor(public game: Game) {
        this.context = this.entitiesCanvas.getContext('2d')!; // Entities;
        this.backContext = this.background.getContext('2d')!; // Background
        this.foreContext = this.foreground.getContext('2d')!; // Foreground
        this.overlayContext = this.overlay.getContext('2d')!; // Lighting
        this.textContext = this.textCanvas.getContext('2d')!; // Texts
        this.cursorContext = this.cursor.getContext('2d')!; // Cursor

        let { context, backContext, foreContext, overlayContext, textContext, cursorContext } =
            this;

        this.allContexts = [
            context,
            backContext,
            foreContext,
            overlayContext,
            textContext,
            cursorContext
        ];

        this.contexts = [context, textContext, overlayContext];
        this.drawingContexts = [backContext, foreContext];

        this.load();
    }

    public stop(): void {
        this.camera = null!;
        this.input = null!;
        this.stopRendering = true;

        this.forEachContext((context) => {
            context.fillStyle = '#12100D';
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        });
    }

    private load(): void {
        this.loadLights();
        this.checkDevice();
    }

    private removeSmoothing(): void {
        this.forAllContexts((context) => {
            if (!context) return;

            context.imageSmoothingQuality = 'low';

            context.imageSmoothingEnabled = false;
            /** @deprecated */
            // ctx.webkitImageSmoothingEnabled = false;
            // ctx.mozImageSmoothingEnabled = false;
            // ctx.msImageSmoothingEnabled = false;
            // ctx.oImageSmoothingEnabled = false;
        });
    }

    private loadSizes(): void {
        if (!this.camera) return;

        this.lightTileSize = this.tileSize * this.zoomFactor;

        this.screenWidth = this.camera.gridWidth * this.tileSize;
        this.screenHeight = this.camera.gridHeight * this.tileSize;

        this.canvasWidth = this.screenWidth * this.zoomFactor;
        this.canvasHeight = this.screenHeight * this.zoomFactor;

        this.forEachCanvas((canvas) => {
            canvas.width = this.canvasWidth;
            canvas.height = this.canvasHeight;
        });
    }

    public loadCamera(): void {
        let { storage } = this.game;

        this.camera = new Camera(this);

        this.loadSizes();

        if (!storage.data.new) return;

        if (this.mEdge || Detect.useCenteredCamera()) {
            this.camera.centered = false;

            storage.data.settings.centerCamera = false;
            storage.save();
        }
    }

    private loadLights(): void {
        this.darkMask = new DarkMask({
            lights: [],
            color: 'rgba(0, 0, 0, 0.84)'
        });

        this.darkMask.compute(this.overlay.width, this.overlay.height);
    }

    public resize(): void {
        //this.stopRendering = true;

        //this.clear();

        this.checkDevice();

        this.cells = {};

        this.clearScreen(this.cursorContext);

        this.camera.update();

        this.camera.centreOn(this.game.player);

        this.loadSizes();

        this.game.menu.resize();

        //this.stopRendering = false;
        this.resizeTimeout = null;

        this.updateAnimatedTiles();

        this.forceRendering = true;
    }

    public render(): void {
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

    private draw(): void {
        // Canvas rendering.
        if (this.hasRenderedFrame()) return;

        this.clearDrawing();
        this.saveDrawing();

        this.updateDrawingView();

        this.forEachVisibleTile((tile: RegionTile, index: number) => {
            let isHighTile = this.map.isHighTile(tile),
                context = isHighTile ? this.foreContext : this.backContext;

            // Only do the lighting logic if there is an overlay.
            if (this.game.overlays.getFog()) {
                let isLightTile = this.map.isLightTile(tile);

                context = isLightTile ? this.overlayContext : context;
            }

            let flips: number[] = [];

            if (this.isFlipped(tile)) {
                if (tile.d) flips.push(TileFlip.Diagonal);
                if (tile.v) flips.push(TileFlip.Vertical);
                if (tile.h) flips.push(TileFlip.Horizontal);

                if (index === 97_207) flips.push();

                //if (tile.h && tile.d) flips.push(TileFlip.Vertical);

                tile = tile.tileId;
            }

            if (!this.map.isAnimatedTile(tile) || !this.animateTiles)
                this.drawTile(context as CanvasRenderingContext2D, tile - 1, index, flips);
        });

        this.restoreDrawing();

        this.saveFrame();
    }

    private drawAnimatedTiles(): void {
        if (!this.animateTiles) return;

        this.context.save();
        this.setCameraView(this.context);

        this.forEachAnimatedTile((tile) => {
            if (!this.camera.isVisible(tile.x, tile.y, 3, 1)) return;

            tile.animate(this.game.time);

            this.drawTile(this.context, tile.id, tile.index);
        });

        this.context.restore();
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
                    this.screenWidth * this.zoomFactor,
                    this.screenHeight * this.zoomFactor
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

    private drawInfos(): void {
        if (this.game.info.getCount() === 0) return;

        this.game.info.forEachInfo((info) => {
            let { opacity, text, x, y, fill, stroke } = info as Splat;

            this.textContext.save();
            this.setCameraView(this.textContext);
            this.textContext.globalAlpha = opacity;
            this.drawText(`${text}`, Math.floor(x + 8), Math.floor(y), true, fill, stroke, 26);
            this.textContext.restore();
        });
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

    private drawEntities(): void {
        if (this.game.player.dead) return;

        this.setCameraView(this.context);

        this.forEachVisibleEntity((entity) => {
            if (!entity) return;

            if (entity.spriteLoaded) this.drawEntity(entity);
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
            dx = x * this.zoomFactor,
            dy = y * this.zoomFactor,
            flipX = dx + this.tileSize * this.zoomFactor,
            flipY = dy + data.height;

        this.context.save();

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

        if (fading) this.context.globalAlpha = fadingAlpha;

        if (spriteFlipX) {
            this.context.translate(flipX, dy);
            this.context.scale(-1, 1);
        } else if (spriteFlipY) {
            this.context.translate(dx, flipY);
            this.context.scale(1, -1);
        } else this.context.translate(dx, dy);

        this.context.scale(this.zoomFactor, this.zoomFactor);

        if (customScale) this.context.scale(customScale, customScale);

        if (angled) this.context.rotate(entity.isProjectile() ? entity.getAngle() : data.angle);

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

        // this.drawEntityBack(entity);

        this.context.drawImage(
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

        this.context.restore();

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
                let weapon = this.entities.getSprite((entity as Player).getWeapon().key);

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

                    this.context.drawImage(
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
                let sprite = this.entities.getSprite(entity.getActiveEffect());

                if (sprite) {
                    if (!sprite.loaded) sprite.load();

                    let animation = entity.getEffectAnimation()!,
                        { index } = animation.currentFrame,
                        x = sprite.width * index,
                        y = sprite.height * animation.row;

                    this.context.drawImage(
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
            let { sparksAnimation } = this.entities.sprites,
                sparksFrame = sparksAnimation.currentFrame,
                sparksX = this.sparksSprite.width * sparksFrame.index,
                sparksY = this.sparksSprite.height * sparksAnimation.row;

            this.context.drawImage(
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
            healthX = entity.x * this.zoomFactor - barLength / 2 + 8,
            healthY = (entity.y - entity.sprite.height / 4) * this.zoomFactor,
            healthWidth = Math.round(
                (entity.hitPoints / entity.maxHitPoints) * barLength * this.zoomFactor
            ),
            healthHeight = 2 * this.zoomFactor;

        this.textContext.save();
        this.setCameraView(this.textContext);
        this.textContext.strokeStyle = '#00000';
        this.textContext.lineWidth = 1;
        this.textContext.strokeRect(healthX, healthY, barLength * this.zoomFactor, healthHeight);
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

    private drawCursor(): void {
        let { input, cursorContext, tablet, mobile } = this;

        if (tablet || mobile || this.hasRenderedMouse() || input.cursorMoved) return;

        let { cursor, mouse } = input;

        this.clearScreen(cursorContext);
        cursorContext.save();

        if (cursor) {
            if (!cursor.loaded) cursor.load();

            if (cursor.loaded)
                cursorContext.drawImage(cursor.image, 0, 0, 16, 16, mouse.x, mouse.y, 48, 48);
        }

        cursorContext.restore();

        this.saveMouse();
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

    private drawPosition(): void {
        let { player } = this.game;

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

        if (this.input.hovering === Modules.Hovering.Mob) {
            let { x, y } = this.input.getCoords()!;

            if (!this.input.entity) return;

            this.drawText(
                `x: ${x} y: ${y} instance: ${this.input.entity.instance}`,
                10,
                71,
                false,
                'white'
            );
            this.drawText(`att range: ${this.input.entity!.attackRange}`, 10, 91, false, 'white');
        }
    }

    private drawCollisions(): void {
        let { width, height, grid } = this.map;

        if (!grid) return;

        this.camera.forEachVisiblePosition((x, y) => {
            if (x < 0 || y < 0 || x > width - 1 || y > height - 1) return;

            if (grid[y][x] !== 0) this.drawCellHighlight(x, y, 'rgba(50, 50, 255, 0.5)');
        });
    }

    private drawPathing(): void {
        if (!this.game.player.hasPath()) return;

        _.each(this.game.player.path, (path) =>
            this.drawCellHighlight(path[0], path[1], 'rgba(50, 255, 50, 0.5)')
        );
    }

    private drawSelectedCell(): void {
        if (!this.input.selectedCellVisible || this.input.keyMovement) return;

        // let posX = this.input.selectedX,
        //     posY = this.input.selectedY,
        let tD = this.input.getTargetData(); // target data

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

    private isFlipped(tileInfo: RegionTile): boolean {
        return tileInfo.v || tileInfo.h || tileInfo.d;
    }

    /**
     * Primitive drawing functions
     */

    //TODO - Refactor types
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
         * Removed tilesetScale (tileset.scale) variables since it
         * is generally always 1. The reason for the variable was
         * due to the usage of the large PNG file, which Chrome
         * split up and messed with.
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

        if (!(cellId in this.cells) || flips.length > 0)
            this.cells[cellId] = {
                dx: this.getX(cellId + 1, this.map.width) * this.tileSize * this.zoomFactor,
                dy: Math.floor(cellId / this.map.width) * this.tileSize * this.zoomFactor,
                width: this.tileSize * this.zoomFactor,
                height: this.tileSize * this.zoomFactor,
                flips
            };

        this.drawImage(context, tileset, this.tiles[tileId], this.cells[cellId]);
    }

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

        if (isFlipped) {
            ({ dx, dy } = cell);

            context.save();

            let tempX = dx;

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

        fontSize += this.zoomFactor * 2;

        context.strokeStyle = strokeColour || '#373737';
        context.lineWidth = strokeSize;
        context.font = `${fontSize}px AdvoCut`;
        context.strokeText(text, x * this.zoomFactor, y * this.zoomFactor);
        context.fillStyle = colour || 'white';
        context.fillText(text, x * this.zoomFactor, y * this.zoomFactor);

        context.restore();
    }

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
        let multiplier = this.tileSize * this.zoomFactor;

        this.context.save();
        this.setCameraView(this.context);

        this.context.lineWidth = 2 * this.zoomFactor;

        this.context.translate(x + 2, y + 2);

        this.context.strokeStyle = colour;
        this.context.strokeRect(0, 0, multiplier - 4, multiplier - 4);

        this.context.restore();
    }

    private drawCellHighlight(x: number, y: number, colour: string): void {
        this.drawCellRect(
            x * this.zoomFactor * this.tileSize,
            y * this.zoomFactor * this.tileSize,
            colour
        );
    }

    private drawTargetCell(): void {
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

        let location = this.input.getCoords()!;

        if (!(location.x === this.input.selectedX && location.y === this.input.selectedY)) {
            let isColliding = this.map.isColliding(location.x, location.y);

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

    private forEachVisibleIndex(callback: (index: number) => void, offset?: number): void {
        this.camera.forEachVisiblePosition((x, y) => {
            if (!this.map.isOutOfBounds(x, y)) callback(this.map.coordToIndex(x, y));
        }, offset);
    }

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

    private forEachAnimatedTile(callback: (tile: Tile) => void): void {
        _.each(this.animatedTiles, callback);
    }

    private forEachVisibleEntity(callback: (entity: Entity) => void): void {
        if (!this.entities || !this.camera) return;

        let { grids } = this.entities;

        this.camera.forEachVisiblePosition((x, y) => {
            if (!this.map.isOutOfBounds(x, y) && grids.renderingGrid[y][x])
                _.each(grids.renderingGrid[y][x], (entity: Entity) => callback(entity));
        });
    }

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
        if (this.forceRendering || (this.mobile && this.camera.centered)) return false;

        if (!this.camera || this.stopRendering || !this.input) return true;

        return this.renderedFrame[0] === this.camera.x && this.renderedFrame[1] === this.camera.y;
    }

    private saveFrame(): void {
        if (this.mobile && this.camera.centered) return;

        this.renderedFrame[0] = this.camera.x;
        this.renderedFrame[1] = this.camera.y;

        this.forceRendering = false;
    }

    /**
     * Zooms in our out the camera. Depending on the zoomAmount, if it's negative
     * we zoom out, if it's positive we zoom in. The function also checks
     * maximum zoom.
     * @param zoomAmount Float value we are zooming by.
     */

    public zoom(zoomAmount: number): void {
        this.zoomFactor += zoomAmount;

        if (this.zoomFactor > MAXIMUM_ZOOM) this.zoomFactor = MAXIMUM_ZOOM;
        if (this.zoomFactor < MINIMUM_ZOOM) this.zoomFactor = MINIMUM_ZOOM;

        this.zoomFactor = parseFloat(this.zoomFactor.toFixed(1));

        this.resize();
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

    private updateView(): void {
        this.forEachContext((context) => this.setCameraView(context));
    }

    private updateDrawingView(): void {
        this.forEachDrawingContext((context) => this.setCameraView(context));
    }

    private setCameraView(context: CanvasRenderingContext2D): void {
        if (!this.camera || this.stopRendering) return;

        context.translate(-this.camera.x * this.zoomFactor, -this.camera.y * this.zoomFactor);
    }

    private clearScreen(context: CanvasRenderingContext2D): void {
        context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }

    private hasRenderedMouse(): boolean {
        return (
            this.input.lastMousePosition.x === this.input.mouse.x &&
            this.input.lastMousePosition.y === this.input.mouse.y
        );
    }

    private saveMouse(): void {
        this.input.lastMousePosition.x = this.input.mouse.x;
        this.input.lastMousePosition.y = this.input.mouse.y;
    }

    public adjustBrightness(level: number): void {
        if (level < 0 || level > 100) return;

        $('#text-canvas').css('background', `rgba(0, 0, 0, ${0.5 - level / 200})`);
    }

    public loadStaticSprites(): void {
        this.shadowSprite = this.entities.getSprite('shadow16')!;

        if (!this.shadowSprite.loaded) this.shadowSprite.load();

        this.sparksSprite = this.entities.getSprite('sparks')!;

        if (!this.sparksSprite.loaded) this.sparksSprite.load();
    }

    hasDrawnTile(id: Tile): boolean {
        return this.drawnTiles.includes(id);
    }

    /**
     * Miscellaneous functions
     */

    private forAllContexts(callback: (context: CanvasRenderingContext2D) => void): void {
        _.each(this.allContexts, (context) => callback(context as CanvasRenderingContext2D));
    }

    private forEachContext(callback: (context: CanvasRenderingContext2D) => void): void {
        _.each(this.contexts, callback);
    }

    private forEachDrawingContext(callback: (context: CanvasRenderingContext2D) => void): void {
        _.each(this.drawingContexts, (context) => callback(context as CanvasRenderingContext2D));
    }

    private forEachCanvas(callback: (canvas: HTMLCanvasElement) => void): void {
        _.each(this.canvases, callback);
    }

    private forEachLighting(callback: (lighting: RendererLighting) => void): void {
        _.each(this.lightings, callback);
    }

    private getX(index: number, width: number): number {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }

    private checkDevice(): void {
        this.mobile = Detect.isMobile();
        this.tablet = Detect.isTablet();
        this.mEdge = Detect.isEdge();
    }

    public verifyCentration(): void {
        this.forceRendering = (this.mobile || this.tablet) && this.camera.centered;
    }

    public isPortableDevice(): boolean {
        return this.mobile || this.tablet;
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
     * Setters
     */

    public setTileset(tileset: unknown): void {
        this.tileset = tileset;
    }

    public setMap(map: Map): void {
        this.map = map;
    }

    public setEntities(entities: EntitiesController): void {
        this.entities = entities;
    }

    public setInput(input: InputController): void {
        this.input = input;
    }

    /**
     * Getters
     */

    public getTargetBounds(tx: number, ty: number): Bounds {
        let sx = tx || this.input.selectedX,
            sy = ty || this.input.selectedY,
            x = (sx * this.tileSize - this.camera.x) * this.zoomFactor,
            y = (sy * this.tileSize - this.camera.y) * this.zoomFactor,
            width = this.tileSize * this.zoomFactor,
            height = this.tileSize * this.zoomFactor,
            bounds: Bounds = {
                x,
                y,
                width,
                height,
                left: x,
                right: x + width,
                top: y,
                bottom: y + height
            };

        return bounds;
    }

    public getTileset(): unknown {
        return this.tileset;
    }
}
