import { DEFAULT_ZOOM } from './camera';

import Utils from '../utils/util';
import Character from '../entity/character/character';
import { isMobile, isTablet } from '../utils/detect';

import { Modules, Opcodes } from '@kaetram/common/network';
import { DarkMask, Vec2, Lamp, Lighting } from 'illuminated';

import type Minigame from './minigame';
import type Equipment from '../entity/character/player/equipment';
import type Game from '../game';
import type Map from '../map/map';
import type Canvas from './canvas';
import type Camera from './camera';
import type Splat from './infos/splat';
import type WebGL from './webgl/webgl';
import type Entity from '../entity/entity';
import type Sprite from '../entity/sprite';
import type Item from '../entity/objects/item';
import type Player from '../entity/character/player/player';
import type Tree from '../entity/objects/resource/impl/tree';
import type { LampData } from '@kaetram/common/types/item';
import type { ClientTile } from '@kaetram/common/types/map';
import type { SerializedLight } from '@kaetram/common/network/impl/overlay';

interface Light extends Lamp {
    originalX: number;
    originalY: number;
    originalDistance: number;

    scaledDistance: number;
    scaledFlickerIntensity: number;

    gridX: number;
    gridY: number;

    offset: number;

    relative: boolean;
    entity?: string;

    flickerSpeed: number;
    flickerIntensity: number;
}

export interface RendererLighting extends Lighting {
    light: Light;
}

export type ContextType = '2d' | 'webgl';
export type ContextCallback = (context: CanvasRenderingContext2D) => void;

export default class Renderer {
    public background = document.querySelector<HTMLCanvasElement>('#background')!;
    protected foreground = document.querySelector<HTMLCanvasElement>('#foreground')!;
    protected overlay = document.querySelector<HTMLCanvasElement>('#overlay')!;
    protected textCanvas = document.querySelector<HTMLCanvasElement>('#text-canvas')!;
    protected entities = document.querySelector<HTMLCanvasElement>('#entities')!;
    protected entitiesFore = document.querySelector<HTMLCanvasElement>('#entities-fore')!;
    protected cursor = document.querySelector<HTMLCanvasElement>('#cursor')!;
    protected entitiesMask = document.querySelector<HTMLCanvasElement>('#entities-mask')!;

    // Store all canvases for easy iteration
    protected canvases: HTMLCanvasElement[] = [
        this.background,
        this.foreground,
        this.overlay,
        this.textCanvas,
        this.entities,
        this.entitiesFore,
        this.cursor,
        this.entitiesMask
    ];

    // Create the contexts based on the canvases.
    protected entitiesContext: CanvasRenderingContext2D = this.entities.getContext('2d')!;
    protected entitiesForeContext: CanvasRenderingContext2D = this.entitiesFore.getContext('2d')!;
    protected overlayContext: CanvasRenderingContext2D = this.overlay.getContext('2d')!;
    protected textContext: CanvasRenderingContext2D = this.textCanvas.getContext('2d')!;
    protected cursorContext: CanvasRenderingContext2D = this.cursor.getContext('2d')!;
    protected entitiesMaskContext: CanvasRenderingContext2D = this.entitiesMask.getContext('2d')!;

    protected allContexts = [
        this.entitiesContext,
        this.entitiesForeContext,
        this.entitiesMaskContext,
        this.overlayContext,
        this.textContext,
        this.cursorContext
    ];

    // We split contexts into two arrays, one for tilemap rendering and one for the rest.
    protected contexts = [
        this.entitiesContext,
        this.entitiesForeContext,
        this.entitiesMaskContext,
        this.textContext,
        this.overlayContext
    ];

    // Zooming buttons
    private zoomIn: HTMLElement = document.querySelector('#zoom-in')!;
    private zoomOut: HTMLElement = document.querySelector('#zoom-out')!;

    public map: Map;
    public camera: Camera;

    // Variables used for calculating multiple things
    public tileSize = Utils.tileSize;
    public actualTileSize = Utils.tileSize;
    public ceilActualTileSize = Utils.tileSize;

    // Screen dimensions
    public screenWidth = 0;
    public screenHeight = 0;

    // Canvas dimensions
    public canvasWidth = 0;
    public canvasHeight = 0;

    // Animated tiles
    public animateTiles = true;
    private renderedFrame: number[] = [];

    // Lighting
    protected lightings: { [instance: string]: RendererLighting } = {};
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
    public fontSize = 12;
    public strokeSize = 4;

    // Detect functions
    public mobile = isMobile();
    public tablet = isTablet();

    // FPS variables`
    protected time = Date.now();
    protected fps = 0;
    protected frameCount = 0;

    public constructor(
        protected game: Game,
        public type = 'canvas'
    ) {
        this.map = game.map;
        this.camera = game.camera;

        this.tileSize = game.map.tileSize;
        this.actualTileSize = this.tileSize * this.camera.zoomFactor;
        this.ceilActualTileSize = Math.ceil(this.actualTileSize);

        // Load the sizes of the canvases
        this.loadSizes();

        // Event listeners for zooming in and out
        this.zoomIn.addEventListener('click', () => this.game.zoom(0.2));
        this.zoomOut.addEventListener('click', () => this.game.zoom(-0.2));

        this.camera.onZoom(() => {
            this.fontSize = Math.floor(12 + this.camera.zoomFactor * 3);
            this.strokeSize = Math.floor(this.fontSize / 6);
        });
    }

    /**
     * Superclass implementation for the WebGL renderer. We start loading
     * textures after the map has completed loading the tilesets.
     */

    public load(): void {
        //
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
        this.ceilActualTileSize = Math.ceil(this.actualTileSize);

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

        // Remove the player's light source and re-add it.
        this.resizeLights();
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

        // Dimensions may mess with centration, so we force it.
        this.camera.centreOn(this.game.player);

        // Prevents blank screen flickers when resizing.
        this.forceRendering = true;

        // Cursor may get stuck on when resizing from desktop to mobile proportions.
        this.clearScreen(this.cursorContext);
    }

    /**
     * Rendering function is implemented by each subclass implementation of the
     * renderer class. This is called by the game loop to render the game.
     */

    public render(): void {
        this.clear();
        this.save();

        this.removeSmoothing();

        this.drawDebugging();

        this.drawOverlays();

        this.drawHoveringCell();

        this.drawSelectedCell();

        this.drawEntities();

        this.drawInfos();

        this.drawCursor();

        this.drawMinigameGUI();

        this.restore();
    }

    // -------------- Drawing Functions --------------

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
     * Overlays are images drawn on top of the game. They aFOvre generally
     * used in conjunction with the lighting system to give a shadow
     * effect or dark room effect. When overlays are present, the light
     * system is enabled.
     */

    private drawOverlays(): void {
        // Overlay image cold not be found.
        if (!this.game.overlays.hasOverlay()) return;

        let image = this.game.overlays.get();

        // Draw only if there is an overlay image.
        if (image) this.overlayContext.drawImage(image, 0, 0, this.canvasWidth, this.canvasHeight);

        this.overlayContext.globalCompositeOperation = 'lighter';

        // Draw each lighting
        this.forEachLighting((lighting: RendererLighting) => this.drawLighting(lighting));

        // Essentially makes the overlay be drawn on top of everything.
        this.overlayContext.globalCompositeOperation = 'source-over';

        this.darkMask.compute(this.overlay.width, this.overlay.height);
        this.darkMask.render(this.overlayContext);
    }

    /**
     * Draws the currently highlighted tile cell that the mouse
     * is hovering over. This is feedback to the player so they
     * know what cell will be selected.
     */

    private drawHoveringCell(): void {
        if (this.mobile) return;

        let location = this.game.input.getCoords();

        if (!this.game.input.isOnCanvas || this.isSelectedCell(location.gridX, location.gridY))
            return;

        let colour = this.game.input.targetColour,
            isObject = this.map.isObject(location.gridX, location.gridY);

        // Update the colour for the cell highlight if it's an object.
        if (isObject) colour = 'rgba(245, 230, 66, 0.5)';

        // Colliding map cells are highlighted in red.
        if (this.map.isColliding(location.gridX, location.gridY) && !isObject)
            colour = 'rgba(230, 0, 0, 0.7)';

        this.drawCellHighlight(location.gridX, location.gridY, colour);
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
        let targetData = this.game.input.getTargetData(); // target data

        if (targetData) {
            this.entitiesContext.save();
            this.setCameraView(this.entitiesContext);

            this.entitiesContext.drawImage(
                targetData.sprite.image,
                targetData.x,
                targetData.y,
                targetData.width,
                targetData.height,
                targetData.dx,
                targetData.dy,
                targetData.dw,
                targetData.dh
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
        this.setCameraView(this.entitiesForeContext);

        this.forEachVisibleEntity((entity: Entity) => {
            // Skip entities that aren't properly loaded or are invisible.
            if (!entity.sprite?.loaded || !entity.animation || !entity.isVisible()) return;

            // Handle tree drawing as separate from other entities.
            if (entity.isTree()) return this.drawTree(entity as Tree);

            this.drawEntity(entity);
        });

        //this.entitiesMaskContext.globalAlpha = 0.2;
        this.entitiesMaskContext.drawImage(this.entities, 0, 0);
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
            this.textContext.globalAlpha = info.opacity;

            let { x, y, fill, skillKey, stroke } = info;

            x += 8;

            if (skillKey) {
                console.log(skillKey);

                this.setCameraView(this.textContext);

                x = ~~(x * this.camera.zoomFactor);
                y = ~~(y * this.camera.zoomFactor);

                this.drawInfoSkill(skillKey, x, y);
            }

            this.drawText(`${info.getText()}`, x, y, true, !skillKey, fill, stroke, 32);
            this.textContext.restore();
        });
    }

    /**
     * Draws a little skill icon above the info splats displayed when the
     * player gains some experience.
     * @param skill The skill that we are drawing the splat for.
     */

    private drawInfoSkill(skill: string, x: number, y: number): void {
        let sprite = this.game.sprites.get(skill);

        if (!sprite) return;

        if (!sprite.loaded) sprite.load();

        this.textContext.drawImage(
            sprite.image,
            x + sprite.offsetX,
            y + (sprite.offsetY - 4) * this.camera.zoomFactor,
            sprite.width * 2,
            sprite.height * 2
        );
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

        if (cursor.loaded)
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
        // Load the mouse if it doesn't exist.
        else cursor.load();

        this.cursorContext.restore();

        this.game.input.saveMouse();
    }

    /**
     * Calculates the FPS and draws it on the top-left of the screen.
     */

    private drawFPS(): void {
        this.calculateFPS();
        this.drawText(`[${this.type}] FPS: ${this.fps}`, 50, 180);
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
            )} movementSpeed: ${player.movementSpeed}`,
            50,
            240
        );

        this.drawText(`zoomFactor: ${this.camera.zoomFactor}`, 50, 420);
        this.drawText(`actulTileSize: ${this.actualTileSize}`, 50, 480);

        // Draw information about the entity we're hovering over.
        if (input.hovering && input.entity) {
            // Draw the entity's grid coordinates and tile index.
            this.drawText(
                `x: ${input.entity.gridX} y: ${input.entity.gridY} instance: ${input.entity.instance}`,
                50,
                300
            );

            // Draw the entity's attack range.
            if (input.entity.attackRange)
                this.drawText(`att range: ${input.entity.attackRange}`, 50, 360);
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

        for (let path of this.game.player.path!)
            this.drawCellHighlight(path[0], path[1], 'rgba(50, 255, 50, 0.5)');
    }

    /**
     * Renders an entity according to the grid position, and zoom factor.
     * @param entity The entity we are drawing.
     */

    private drawEntity(entity: Entity): void {
        let frame = entity.animation?.frame,
            dx = ~~(entity.x * this.camera.zoomFactor),
            dy = ~~(entity.y * this.camera.zoomFactor),
            flipX = dx + this.actualTileSize,
            flipY = dy + entity.sprite.height,
            context =
                entity.isNonTreeResource() && entity.y > this.game.player.y
                    ? this.entitiesForeContext
                    : this.entitiesContext;

        context.save();

        // Update the entity fading onto the context.
        if (entity.fading) context.globalAlpha = entity.fadingAlpha;

        // Handle flipping since we use the same sprite for right/left.
        if (entity.spriteFlipX) {
            context.translate(flipX, dy);
            context.scale(-1, 1);
        } else if (entity.spriteFlipY) {
            context.translate(dx, flipY);
            context.scale(1, -1);
        } else context.translate(dx, dy);

        // Scale the entity to the current zoom factor.
        context.scale(this.camera.zoomFactor, this.camera.zoomFactor);

        // Scale the entity again if it has a custom scaling associated with it.
        if (entity.customScale) context.scale(entity.customScale, entity.customScale);

        // Rotate using the entity's angle.
        if (entity.angle !== 0) context.rotate(entity.angle);

        // Draw the entity shadowf
        if (entity.hasShadow()) {
            let shadowSprite = this.game.sprites.get('shadow')!;

            context.drawImage(
                shadowSprite.image,
                0,
                0,
                shadowSprite.width,
                shadowSprite.height,
                0,
                entity.shadowOffsetY,
                shadowSprite.width,
                shadowSprite.height
            );
        }

        context.drawImage(
            entity.getSprite().image,
            frame!.x,
            frame!.y,
            entity.sprite.width,
            entity.sprite.height,
            entity.sprite.offsetX,
            entity.sprite.offsetY + entity.offsetY,
            entity.sprite.width,
            entity.sprite.height
        );

        this.drawEntityFore(entity);

        context.restore();

        this.drawHealth(entity as Character);

        if (!entity.isPlayer() && !entity.isMob() && !entity.isNPC() && !entity.isItem()) return;

        if (!this.game.overlays.hasOverlay())
            if (this.game.player.instance === entity.instance && this.camera.isCentered())
                this.drawPlayerName(entity as Player);
            else this.drawName(entity as Character & Item);
    }

    /**
     * We use a separate function for rendering trees since we need to do a bit more magic. Trees
     * require their stumps be rendered below the player, and their leaves be rendered above the
     * player. Both renderings are done on the same entities fore context, however the trick is to
     * use globalCompositeOperation to render the leaves on top of the player, and the stumps
     * below the player.
     * @param entity The tree entity that we are drawing.
     */

    private drawTree(entity: Tree): void {
        // We extract the normal animation frames about the tree.
        let frame = entity.animation?.frame,
            baseFrame = entity.exhausted ? entity.exhaustedFrame : entity.baseFrame, // use stump if cut
            dx = ~~(entity.x * this.camera.zoomFactor),
            dy = ~~(entity.y * this.camera.zoomFactor);

        this.entitiesForeContext.save();
        this.entitiesContext.save();

        // Translate the context to the tree's position.
        this.entitiesForeContext.translate(dx, dy);
        this.entitiesContext.translate(dx, dy);

        // Scale relative to the camera zoom factor.
        this.entitiesForeContext.scale(this.camera.zoomFactor, this.camera.zoomFactor);
        this.entitiesContext.scale(this.camera.zoomFactor, this.camera.zoomFactor);

        // Draw the top part of the tree if the tree is not cut.
        if (!entity.exhausted)
            this.entitiesForeContext.drawImage(
                entity.getSprite().image,
                frame!.x,
                frame!.y,
                entity.sprite.width,
                entity.sprite.height,
                entity.sprite.offsetX,
                entity.sprite.offsetY + entity.offsetY,
                entity.sprite.width,
                entity.sprite.height
            );

        // Set the global composite operation to destination over.
        this.entitiesContext.globalCompositeOperation = 'destination-over';

        // Draw the bottom part of the tree.
        this.entitiesContext.drawImage(
            entity.getSprite().image,
            baseFrame.x,
            baseFrame.y,
            entity.sprite.width,
            entity.sprite.height,
            entity.sprite.offsetX,
            entity.sprite.offsetY + entity.offsetY,
            entity.sprite.width,
            entity.sprite.height
        );

        this.entitiesForeContext.restore();
        this.entitiesContext.restore();
    }

    /**
     * This function is responsible for drawing special effects
     * on top of the entity (after rendering). It will primarily
     * be used for the paper-doll effect of drawing weapon and
     * armour sprites on top of the player characters.
     */

    private drawEntityFore(entity: Entity): void {
        if (entity.isItem()) return this.drawSparks();

        // Draw the exclamations if the entity has them.
        if (entity.exclamation) this.drawExclamation();
        if (entity.blueExclamation) this.drawBlueExclamation();

        if (!(entity instanceof Character)) return;

        // Iterate through the drawable equipments and draw them.
        if (entity.isPlayer())
            (entity as Player).forEachEquipment(
                (equipment: Equipment) => this.drawEquipment(entity as Player, equipment),
                true
            );

        if (entity.hasActiveEffect()) this.drawEffects(entity);
    }

    /**
     * Responsible for drawing an equipment element on top of the player. This is
     * done using the paperdoll method, each equipment is another sprite sheet
     * that is drawn on top of the player's sprite.
     * @param player The player we are drawing the equipment for.
     * @param equipment The equipment information we are drawing.
     */

    private drawEquipment(player: Player, equipment: Equipment): void {
        if (player.dead || player.teleporting) return;

        // Equipment sprite based on the key of the slot.
        let sprite = this.game.sprites.get(equipment.key);

        if (!sprite) return;

        if (!sprite.loaded) sprite.load();

        // Do not render until the image is ready.
        if (!sprite.image) return;

        this.drawSprite(player, sprite);
    }

    /**
     * Extracts the animation frame and draws the provided sprite for the character.
     * @param character The character used to determine the animation frames.
     * @param sprite The sprite that we are drawing for the character.
     */

    private drawSprite(character: Character, sprite: Sprite): void {
        let animation = character.animation!,
            animationData = sprite.animations[animation.name];

        // May occur when the death sprite is being animated.
        if (!animationData) return;

        let { frame, row } = animation,
            index =
                frame.index < animationData.length
                    ? frame.index
                    : frame.index % animationData.length,
            spriteX = sprite.width * index,
            spriteY = sprite.height * row,
            spriteWidth = sprite.width,
            spriteHeight = sprite.height;

        this.entitiesContext.drawImage(
            sprite.image,
            spriteX,
            spriteY,
            spriteWidth,
            spriteHeight,
            sprite.offsetX,
            sprite.offsetY,
            spriteWidth,
            spriteHeight
        );
    }

    /**
     * Goes through all the status effects and draws them on top of the character.
     * @param character The character we are drawing the effect of.
     */

    private drawEffects(character: Character): void {
        for (let key of character.statusEffects) {
            // Do not draw the freezing effect if the character has a snow potion effect.
            if (key === Modules.Effects.Freezing && character.hasEffect(Modules.Effects.SnowPotion))
                continue;

            // Do not draw the burning effect if the character has a fire potion effect.
            if (key === Modules.Effects.Burning && character.hasEffect(Modules.Effects.FirePotion))
                continue;

            let effect = character.getEffect(key);

            if (!effect) continue;

            let sprite = this.game.sprites.get(effect.key);

            if (!sprite.loaded) sprite.load();

            let { animation } = effect,
                { index } = animation.frame,
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

    /**
     * Draws the static sparks sprite that are displayed on top of an
     * item entity.
     */

    private drawSparks(): void {
        let sparksSprite = this.game.sprites.get('sparks')!,
            animation = sparksSprite.animations.idle_down;

        this.entitiesContext.drawImage(
            sparksSprite.image,
            sparksSprite.width * animation.frame.index,
            sparksSprite.height * animation.row,
            sparksSprite.width,
            sparksSprite.height,
            0,
            0,
            sparksSprite.width,
            sparksSprite.height
        );
    }

    /**
     * Draws the exclamation animation that is drawn above NPCs.
     */

    private drawExclamation(): void {
        let sprite = this.game.sprites.get('exclamation')!,
            animation = sprite.animations.idle_down;

        this.entitiesContext.drawImage(
            sprite.image,
            sprite.width * animation.frame.index,
            sprite.height * animation.row,
            sprite.width,
            sprite.height,
            0,
            sprite.offsetY,
            sprite.width,
            sprite.height
        );
    }

    /**
     * Draws the blue exclamation animation that is drawn above NPCs.
     */

    private drawBlueExclamation(): void {
        let sprite = this.game.sprites.get('exclamationblue')!,
            animation = sprite.animations.idle_down;

        this.entitiesContext.drawImage(
            sprite.image,
            sprite.width * animation.frame.index,
            sprite.height * animation.row,
            sprite.width,
            sprite.height,
            0,
            sprite.offsetY,
            sprite.width,
            sprite.height
        );
    }

    /**
     * Draws a special crown above the player's name.
     * @param key The key of the crown we are drawing.
     * @param x The x coordinate on the screen we are drawing at.
     * @param y The y coordinate on the screen we are drawing at.
     */

    private drawCrown(key: string, x: number, y: number): void {
        let crown = this.getCrown(key);

        if (!crown) return;

        this.setCameraView(this.textContext);

        this.textContext.drawImage(
            crown.image,
            0,
            0,
            crown.width,
            crown.height,
            x * this.camera.zoomFactor - crown.width,
            y * this.camera.zoomFactor - crown.height * 3,
            crown.width * 2,
            crown.height * 2
        );

        this.textContext.restore();
    }

    /**
     * Handles drawing the crown for the currently active player. We follow a similar logic
     * to how we draw player name and level, and we draw it relative to the middle of the
     * screen.
     * @param key The key of the crown we want to draw.
     */

    private drawPlayerCrown(key: string): void {
        let crown = this.getCrown(key);

        if (!crown) return;

        this.textContext.drawImage(
            crown.image,
            0,
            0,
            crown.width,
            crown.height,
            this.camera.borderOffsetWidth / 2 - crown.width + 8 * this.camera.zoomFactor,
            this.camera.borderOffsetHeight / 2 - crown.height * 3 - 24 * this.camera.zoomFactor,
            crown.width * 2,
            crown.height * 2
        );
    }

    /**
     * Draws the health bar above the entity character provided.
     * @param entity The character we are drawing the health bar for.
     */

    private drawHealth(entity: Character): void {
        if (!entity.hitPoints || entity.hitPoints < 0 || !entity.healthBarVisible) return;

        let barLength = this.tileSize,
            healthX = entity.x * this.camera.zoomFactor - barLength / 2 + 8,
            healthY = (entity.y - entity.sprite.height / 4) * this.camera.zoomFactor,
            healthWidth = ~~(
                (entity.hitPoints / entity.maxHitPoints) *
                barLength *
                this.camera.zoomFactor
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
     * Responsible for drawing text above an entity. This includes the name, level,
     * and additionally, item amounts and counters.
     * @param entity The entity we're drawing the name for.
     */

    private drawName(entity: Character | Item): void {
        let x = entity.x + 8, // Default offsets
            y = entity.y - 5,
            colour = 'white';

        // Handle the counter if an entity has one.
        if (entity.hasCounter())
            return this.drawText(`${entity.counter}`, x, y, true, true, colour);

        // Handle the item amount if the entity is an item.
        if (entity.isItem() && entity.count > 1)
            return this.drawText(`${entity.count}`, x, y, true, true, colour);

        if (
            entity.hidden ||
            entity.healthBarVisible ||
            entity.exclamation ||
            entity.blueExclamation
        )
            return;

        let drawNames = this.drawNames && entity.drawNames() && !entity.isItem(),
            drawLevels = this.drawLevels && !entity.isNPC() && !entity.isItem(),
            nameY = this.drawLevels ? y - 10 : y - 4,
            levelY = this.drawLevels ? y : y - 7,
            levelText = `Level ${entity.level}`;

        // NPCs will have their name displayed closer to their sprite.
        if (entity.isNPC()) nameY = y - 2;

        // Handle additional player rank and crown logic.
        if (entity.isPlayer()) {
            if (entity.hasRank()) colour = Modules.RankColours[entity.rank];

            if (drawNames && entity.hasCrown()) this.drawCrown(entity.getCrownKey(), x, nameY);
        }

        // If there's a rank aside from default then we use that rank's colour.
        if (entity.isPlayer() && entity.rank !== Modules.Ranks.None)
            colour = Modules.RankColours[entity.rank];

        // If the entity is the same as our character, we draw a gold name.1
        if (entity.instance === this.game.player.instance) colour = 'rgba(252,218,92, 1)';

        // If an entity has a custom name colour we use that.
        if (entity.nameColour) colour = entity.nameColour;

        // Draw the name if we're drawing names.
        if (drawNames) this.drawText(entity.name, x, nameY, true, true, colour);

        // Draw the level if we're drawing levels.
        if (drawLevels && entity.level) this.drawText(levelText, x, levelY, true, true, colour);
    }

    /**
     * Handles an optimized way of drawing the player's name. Since it's always centred with
     * the player, we can just draw the text statically right in the middle when using centred
     * camera.
     */

    private drawPlayerName(entity: Player): void {
        let nameOffset = this.drawLevels ? 22 : 10;

        if (this.drawNames) {
            this.drawText(
                entity.name,
                this.camera.borderOffsetWidth / 2 + 8 * this.camera.zoomFactor,
                this.camera.borderOffsetHeight / 2 - nameOffset * this.camera.zoomFactor,
                true,
                false,
                'rgba(252,218,92, 1)'
            );

            if (entity.hasCrown()) this.drawPlayerCrown(entity.getCrownKey());
        }

        if (this.drawLevels && entity.level)
            this.drawText(
                `Level ${entity.level}`,
                this.camera.borderOffsetWidth / 2 + 8 * this.camera.zoomFactor,
                this.camera.borderOffsetHeight / 2 - 10 * this.camera.zoomFactor,
                true,
                false,
                'rgba(252,218,92, 1)'
            );
    }

    /**
     * Responsible for drawing the appropriate GUI for the minigame that
     * the player is currently in. We use the minigame's type to determine
     * what GUI to draw.
     */

    private drawMinigameGUI(): void {
        if (!this.game.minigame.exists()) return;

        switch (this.game.minigame.type) {
            case Opcodes.Minigame.TeamWar: {
                return this.drawTeamWarGUI(this.game.minigame);
            }

            case Opcodes.Minigame.Coursing: {
                return this.drawCoursingGUI(this.game.minigame);
            }
        }
    }

    /**
     * Draws the team war minigame GUI. This consists of the score board
     * or the countdown timer depending on the status of the minigame.
     * @param minigame The minigame class from which we are extracting the data.
     */

    private drawTeamWarGUI(minigame: Minigame): void {
        let { status, started, countdown, redTeamScore, blueTeamScore } = minigame,
            scoreX = this.textCanvas.width / 6;

        switch (status) {
            case 'lobby': {
                this.drawText(
                    started
                        ? `There is a game in progress, remaining time: ${countdown} seconds`
                        : `Game starts in ${countdown} seconds`,
                    scoreX,
                    30,
                    true
                );
                return;
            }

            case 'ingame': {
                this.drawText(`Red: ${redTeamScore}`, scoreX - 20, 30, true, false, 'red');
                this.drawText(`Blue: ${blueTeamScore}`, scoreX + 20, 30, true, false, 'blue');
                this.drawText(`Time left: ${countdown} seconds`, scoreX, 50, true, false, 'white');
                return;
            }
        }
    }

    /**
     * Draws the coursing GUI. The score is different for every player, so we
     * are constantly updating it with the data we receive from the server.
     * @param minigame Contains the minigame data.
     */

    private drawCoursingGUI(minigame: Minigame): void {
        let { status, started, countdown, score } = minigame,
            scoreX = this.textCanvas.width / 6;

        switch (status) {
            case 'lobby': {
                this.drawText(
                    started
                        ? `There is a game in progress, remaining time: ${countdown} seconds`
                        : `Game starts in ${countdown} seconds`,
                    scoreX,
                    30
                );
                return;
            }

            case 'ingame': {
                this.drawText(`Score: ${score}`, scoreX, 30, true);
                return;
            }
        }
    }

    /**
     * Handles drawing the lighting for a given lighting object. We essentially have two
     * different kinds of lights, entity based and relative ones. By default lights which
     * do not have an entity are relative to the player. In the case of entity-based ones
     * they follow the entity they belong to. Otherwise they stay in the same position
     * on the map (even after moving the camera).
     * @param lighting The lighting object that contains the lamp we are drawing.
     */

    protected drawLighting(lighting: RendererLighting): void {
        let { light } = lighting;

        // Handle drawing the light where the entity is.
        if (light.entity) {
            // Use our own player if the instance of the light's entity matches our own.
            let isPlayer = light.entity === this.game.player.instance,
                entity: Player = isPlayer ? this.game.player : this.game.entities.get(light.entity);

            // Hide the light if there is light source from the entity.
            light.hidden = !entity?.hasLight();

            if (light.hidden) return;

            // If the entity has a light source and it's not our own player, check its visibility.
            if (!isPlayer) light.hidden = !this.camera.isVisible(entity.gridX, entity.gridY, 4, 8);

            // Stop here if the light is hidden.
            if (light.hidden) return;

            light.position = this.getLightPosition(entity.x, entity.y);
        } else {
            light.hidden = !this.camera.isVisible(light.gridX, light.gridY, 4, 8);

            if (light.hidden) return;

            let lightX = (light.originalX - this.camera.x) * this.camera.zoomFactor,
                lightY = (light.originalY - this.camera.y) * this.camera.zoomFactor;

            light.position = new Vec2(lightX, lightY);
        }

        // // Don't do any fancy lighting if we're in low power mode.
        // if (this.game.isLowPowerMode()) return;

        // lighting.compute(this.overlay.width, this.overlay.height);
        // lighting.render(this.overlayContext);
    }

    // -------------- Drawing Methods --------------

    /**
     * Draws a highlight about a cell.
     * @param x The x grid coordinate of the cell.
     * @param y The y grid coordinate of the cell.
     * @param colour The colour in rgba format.
     */

    private drawCellHighlight(x: number, y: number, colour: string): void {
        this.drawCellRect(x * this.actualTileSize, y * this.actualTileSize, colour);
    }

    /**
     * Drawns a cell rectangle at a specified position (relative to the zooming.).
     * @param x The x coordinate of the cell.
     * @param y The y coordinate of the cell.
     * @param colour The colour in rgba format.
     */

    private drawCellRect(x: number, y: number, colour: string): void {
        this.entitiesContext.save();
        this.setCameraView(this.entitiesContext);

        this.entitiesContext.lineWidth = 2 * this.camera.zoomFactor;

        this.entitiesContext.translate(x + 4, y + 2);

        this.entitiesContext.strokeStyle = colour;
        this.entitiesContext.strokeRect(0, 0, this.actualTileSize - 8, this.actualTileSize - 8);

        this.entitiesContext.restore();
    }

    /**
     * Draws text at a specified position (relative to the zooming.).
     * @param text The string text to draw.
     * @param x The x coordinate of the text.
     * @param y The y coordinate of the text.
     * @param centered Whether or not we want the text to be centered.
     * @param setViews Whether or not we want to set the camera view.
     * @param colour The colour of the text in rgba format.
     * @param strokeColour The colour of the stroke in rgba format.
     * @param fontSize (Optional) The font size of the text.
     */

    private drawText(
        text: string,
        x: number,
        y: number,
        centered = false,
        setViews = false,
        colour = 'white',
        strokeColour = 'rgba(0, 0, 0, 1)',
        fontSize: number = this.fontSize
    ): void {
        this.textContext.save();

        if (centered) this.textContext.textAlign = 'center';
        if (setViews) {
            this.setCameraView(this.textContext);

            x = ~~(x * this.camera.zoomFactor);
            y = ~~(y * this.camera.zoomFactor);
        }

        this.textContext.strokeStyle = strokeColour;
        this.textContext.lineWidth = this.strokeSize;
        this.textContext.font = `${fontSize}px Quaver`;
        this.textContext.strokeText(text, x, y);
        this.textContext.fillStyle = colour || 'white';
        this.textContext.fillText(text, x, y);

        this.textContext.restore();
    }

    // -------------- Light Management --------------

    /**
     * Calculates the dark mask effect for the overlay.
     * @param color What colour we want the overlay to have, generally this is
     * a black rgb(0,0,0) with an alpha to give the effect of darkness.
     */

    public updateDarkMask(color = 'rgba(0, 0, 0, 0.5)'): void {
        this.darkMask.color = color;
    }

    /**
     * Creates a new light element using the provided data about its position, distance
     * and colour. We then add it to our lightings array and draw it on the overlay.
     * @param info Contains information about the light we are adding.
     * @param relative Whether or not the light stays in a single position in the world.
     * @param flicker Whether or not the light should flicker.
     */

    public addLight(info: SerializedLight): RendererLighting | undefined {
        // Prevent adding lighting if it already exists.
        if (info.instance in this.lightings) return;

        // Create the new lighting object and lamp with the provided data.
        let lighting = new Lighting({
            light: new Lamp(
                this.getLightData(info.x, info.y, info.distance, info.diffuse, info.colour)
            )
        }) as RendererLighting;

        // Store the grid position of the light (used for camera calculations).
        lighting.light.gridX = info.x;
        lighting.light.gridY = info.y;

        // Store the offset of the light (used for flicker calculations).
        lighting.light.offset = Utils.randomInt(0, 1000);

        // Store the absolute position of the light.
        lighting.light.originalX = lighting.light.position.x;
        lighting.light.originalY = lighting.light.position.y;
        lighting.light.originalDistance = lighting.light.distance;

        // Whether the light is bound to an entity
        lighting.light.entity = info.entity;

        lighting.light.flickerSpeed = info.flickerSpeed;
        lighting.light.flickerIntensity = info.flickerIntensity;

        // Add the lighting to our dictionary and the dark mask dictionary.
        this.lightings[info.instance] = lighting;
        this.darkMask.lights.push(lighting.light);

        return lighting;
    }

    /**
     * Adds a light to a player entity in the world. This can be our own player if we
     * do not specify another object, or it can be another player which has a light source.
     * @param player The player we want to add a light to, defaults to our own player.
     */

    public addPlayerLight(player: Player = this.game.player): void {
        let light = player.getLight(),
            x = this.overlay.width / this.tileSize / 2,
            y = this.overlay.height / this.tileSize / 2;

        // Handle the outer light if it exists.
        if (light.outer) this.addLight(this.getSerializedLight(player.instance, x, y, light.outer));

        // Handle the inner light if it exists.
        if (light.inner)
            this.addLight(this.getSerializedLight(`${player.instance}inner`, x, y, light.inner));
    }

    /**
     * Responsible for synchronizing the player lighting with the latest
     * information from the player's light equipment.
     * @param player The player we want to update the light for, if not specified
     * then we assume it's our own player.
     */

    public updatePlayerLight(player: Player = this.game.player): void {
        let light = player.getLight(),
            outer = this.lightings[player.instance],
            inner = this.lightings[`${player.instance}inner`];

        // No light exists for the player, so we add it.
        if (player.hasLight() && (!outer || !inner)) this.addPlayerLight(player);

        // Update the outer light if it exists.
        if (outer && light.outer) {
            outer.light.distance = light.outer.distance;
            outer.light.originalDistance = light.outer.distance;

            outer.light.color = light.outer.colour;

            outer.light.flickerSpeed = light.outer.flickerSpeed;
            outer.light.flickerIntensity = light.outer.flickerIntensity;
        }

        // Update the inner light if it exists.
        if (inner && light.inner) {
            inner.light.distance = light.inner.distance;
            inner.light.originalDistance = light.inner.distance;

            inner.light.color = light.inner.colour;

            inner.light.flickerSpeed = light.inner.flickerSpeed;
            inner.light.flickerIntensity = light.inner.flickerIntensity;
        }

        this.resizeLights();
    }

    /**
     * Goes through every light in the renderer and resizes it relative
     * to the proportion of the zoom factor versus the default zoom.
     */

    public resizeLights(): void {
        let scale = this.camera.zoomFactor / DEFAULT_ZOOM;

        this.forEachLighting((lighting: RendererLighting) => {
            lighting.light.distance = lighting.light.originalDistance * scale;

            // Store the scaled distance as a reference.
            lighting.light.scaledDistance = lighting.light.distance;

            // Store the scaled flicker intensity as a reference for calculating scaled flicker.
            lighting.light.scaledFlickerIntensity = lighting.light.flickerIntensity * scale;
        });
    }

    /**
     * Removes all the lightings and lamps from the renderer and recomputes the dark mask.
     * We re-add the player light since it gets toggled depending on the player has a torch
     * or not.
     */

    public removeAllLights(): void {
        this.lightings = {};
        this.darkMask.lights = [];

        this.addPlayerLight();
    }

    /**
     * Checks whether or not the current frame has already been rendererd in order
     * to prevent drawing when there is no movement during low power mode.
     * @returns Whether or not the current frame has been rendered.
     */

    protected hasRenderedFrame(): boolean {
        if (this.forceRendering || !this.game.isLowPowerMode()) return false;

        if (this.stopRendering) return true;

        return this.renderedFrame[0] === this.camera.x && this.renderedFrame[1] === this.camera.y;
    }

    // -------------- Context Management --------------

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
     * Iterates through each context and clears the entire frame.
     */

    private clear(): void {
        this.forEachContext(this.clearScreen);
    }

    /**
     * Clears the screen given a specified context.
     * @param context The context that we want to clear the contents of.
     */

    protected clearScreen(context: CanvasRenderingContext2D): void {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }

    /**
     * Iterates through each context and saves the current state.
     */

    private save(): void {
        this.forEachContext((context: CanvasRenderingContext2D) => context.save());
    }

    /**
     * Saves the currently rendered frame in order to prevent unnecessary redraws
     * during low power mode.
     */

    protected saveFrame(): void {
        if (!this.game.isLowPowerMode()) return;

        this.renderedFrame[0] = this.camera.x;
        this.renderedFrame[1] = this.camera.y;

        this.forceRendering = false;
    }

    /**
     * Restores all contexts to their previous values (to when we last saved).
     */

    private restore(): void {
        this.forEachContext((context: CanvasRenderingContext2D) => context.restore());
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

    /**
     * Synchronizes the camera view onto the a specified context. This translates
     * the context relative to where the camera is currently positioned.
     * @param context The context that we are setting the camera view for.
     */

    protected setCameraView(context: CanvasRenderingContext2D): void {
        // Stop if we are not rendering or if there is no camera.
        if (!this.camera || this.stopRendering) return;

        context.translate(
            ~~(-this.camera.x * this.camera.zoomFactor),
            ~~(-this.camera.y * this.camera.zoomFactor)
        );
    }

    // -------------- Getters and Checkers --------------

    protected getX(index: number, width: number): number {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }

    /**
     * Calculates the light's position on the screen given an entity's position. This
     * is used when our player character moves or when the light belongs to another entity.
     * @param x The absolute x position of the entity.
     * @param y The absolute y position of the entity.
     * @returns A position object of where the light should be on the screen.
     */

    private getLightPosition(x: number, y: number): Vec2 {
        return new Vec2(
            (x - this.camera.x) * this.camera.zoomFactor + this.actualTileSize / 2,
            (y - this.camera.y) * this.camera.zoomFactor
        );
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
            position: new Vec2(
                x * this.tileSize + this.tileSize / 2,
                y * this.tileSize + this.tileSize / 2
            ),
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
     * Given a lamp data object (generally from a player's weapon), we generate
     * a serialized light object that can be used to render the light onto the
     * screen.
     * @param instance Who this light source belongs to.
     * @param x The x grid position of the light.
     * @param y The y grid position of the light.
     * @param lamp Contains the lamp data from which we generate the light.
     * @returns A serialized light object.
     */

    private getSerializedLight(
        instance: string,
        x: number,
        y: number,
        lamp: LampData
    ): SerializedLight {
        return {
            instance,
            x,
            y,
            distance: lamp.distance,
            diffuse: 0.2,
            colour: lamp.colour,
            entity: instance.includes('inner') ? instance.split('inner')[0] : instance,
            flickerSpeed: lamp.flickerSpeed,
            flickerIntensity: lamp.flickerIntensity
        };
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

    /**
     * @returns Whether the current rendering engine is WebGL.
     */

    public isWebGl(): this is WebGL {
        return this.type === 'webgl';
    }

    /**
     * @returns Whether or not the current rendering engine is Canvas.
     */

    public isCanvas(): this is Canvas {
        return this.type === 'canvas';
    }

    /**
     * Given a key we return the sprite associated with the crown.
     * @param key The key of the crown.
     * @returns A sprite element or undefined if the key is invalid.
     */

    protected getCrown(key: string): Sprite | undefined {
        switch (key) {
            case 'goldmedal': {
                return this.game.sprites.get('crowns/goldmedal');
            }

            case 'silvermedal': {
                return this.game.sprites.get('crowns/silvermedal');
            }

            case 'crown-artist': {
                return this.game.sprites.get('crowns/artist');
            }

            case 'crown-tier1': {
                return this.game.sprites.get('crowns/tier1');
            }

            case 'crown-tier2': {
                return this.game.sprites.get('crowns/tier2');
            }

            case 'crown-tier3': {
                return this.game.sprites.get('crowns/tier3');
            }

            case 'crown-tier4': {
                return this.game.sprites.get('crowns/tier4');
            }

            case 'crown-tier5': {
                return this.game.sprites.get('crowns/tier5');
            }

            case 'crown-tier6': {
                return this.game.sprites.get('crowns/tier6');
            }

            case 'crown-tier7': {
                return this.game.sprites.get('crowns/tier7');
            }
        }
    }

    // -------------- Update functions --------------

    /**
     * Superclass implementation for updating the tile at a specified
     * index. This is implemented by the WebGL renderer to update the
     * tile in the buffer.
     * @param index The index at which to update the tile.
     * @param data The data with which to update the tile.
     */

    public setTile(_index: number, _data: ClientTile): void {
        // unimplemented
    }

    /**
     * Superclass implementation used by the WebGL renderer when we
     * want to update the texture information. This is used for
     * updating the tile layer texture for each layer.
     */

    public bindTileLayers(): void {
        //
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
        callback: (data: ClientTile, index: number) => void,
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
        }, 3);
    }

    /**
     * Iterates through each light currently loaded.
     * @param callback The light currently being iterated.
     */

    public forEachLighting(callback: (lighting: RendererLighting) => void): void {
        for (let lighting in this.lightings) callback(this.lightings[lighting]);
    }

    /**
     * Iterates through all of the canvases available. Generally used for
     * updating dimensions.
     * @param callback Canvas currently being iterated.
     */

    protected forEachCanvas(callback: (canvas: HTMLCanvasElement) => void): void {
        for (let canvas in this.canvases) callback(this.canvases[canvas]);
    }

    /**
     * Iterates through all of the drawing contexts available.
     * We cast `CanvasRenderingContext2D` because this is the subclass implementation
     * that will use those variants of the contexts.
     * @param callback The context being iterated.
     */

    private forAllContexts(callback: ContextCallback): void {
        for (let context in this.allContexts)
            callback(this.allContexts[context] as CanvasRenderingContext2D);
    }

    /**
     * Iterates through all of the contexts used for drawing mouse, entities, and text.
     * @param callback The context being iterated.
     */

    private forEachContext(callback: ContextCallback): void {
        for (let context in this.contexts)
            callback(this.contexts[context] as CanvasRenderingContext2D);
    }
}
