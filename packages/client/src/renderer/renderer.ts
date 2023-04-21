import Tile from './tile';

import Utils from '../utils/util';
import Character from '../entity/character/character';
import { isMobile, isTablet } from '../utils/detect';

import { Modules } from '@kaetram/common/network';
import { DarkMask, Vec2, Lamp, Lighting } from 'illuminated';

import type Game from '../game';
import type Map from '../map/map';
import type Camera from './camera';
import type Splat from './infos/splat';
import type Entity from '../entity/entity';
import type Sprite from '../entity/sprite';
import type Item from '../entity/objects/item';
import type Player from '../entity/character/player/player';
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

export type ContextType = '2d' | 'webgl';
export interface RendererLighting extends RendererLight, Lighting {
    light: RendererLamp;
}

export type ContextCallback = (context: CanvasRenderingContext2D) => void;

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

    // Create the contexts based on the canvases.
    protected entitiesContext: CanvasRenderingContext2D = this.entities.getContext('2d')!;
    protected overlayContext: CanvasRenderingContext2D = this.overlay.getContext('2d')!;
    protected textContext: CanvasRenderingContext2D = this.textCanvas.getContext('2d')!;
    protected cursorContext: CanvasRenderingContext2D = this.cursor.getContext('2d')!;

    protected allContexts = [
        this.entitiesContext,
        this.overlayContext,
        this.textContext,
        this.cursorContext
    ];

    // We split contexts into two arrays, one for tilemap rendering and one for the rest.
    protected contexts = [this.entitiesContext, this.textContext, this.overlayContext];

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

        // Event listeners for zooming in and out
        this.zoomIn.addEventListener('click', () => this.game.zoom(0.2));
        this.zoomOut.addEventListener('click', () => this.game.zoom(-0.2));
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
        if (image) this.overlayContext.drawImage(image, 0, 0, this.canvasWidth, this.canvasHeight);

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

        if (this.isSelectedCell(location.gridX, location.gridY)) return;

        let isColliding = this.map.isColliding(location.gridX, location.gridY);

        this.drawCellHighlight(
            location.gridX,
            location.gridY,
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

        this.forEachVisibleEntity((entity: Entity) => {
            // Skip entities that aren't properly loaded or are invisible.
            if (!entity.sprite?.loaded || !entity.animation || !entity.isVisible()) return;

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
        this.drawText(`FPS: ${this.fps}`, 10, 61, false, 'white');
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
            10,
            81,
            false,
            'white'
        );

        this.drawText(`zoomFactor: ${this.camera.zoomFactor}`, 10, 141, false, 'white');

        // Draw information about the entity we're hovering over.
        if (input.hovering && input.entity) {
            // Draw the entity's grid coordinates and tile index.
            this.drawText(
                `x: ${input.entity.gridX} y: ${input.entity.gridY} instance: ${input.entity.instance}`,
                10,
                101,
                false,
                'white'
            );

            // Draw the entity's attack range.
            if (input.entity.attackRange)
                this.drawText(`att range: ${input.entity.attackRange}`, 10, 121, false, 'white');
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
        if (entity.angled) this.entitiesContext.rotate(entity.getAngle());

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
        if (entity.hasActiveEffect()) this.drawEffects(entity);
    }

    /**
     * Draws the weapon sprite on top of the player entity. We skip
     * this function if there is no weapon, the player is dead, or
     * they are teleporting.
     * @param player The player we are drawing the weapon for.
     */

    private drawWeapon(player: Player): void {
        if (!player.hasWeapon() || player.dead || player.teleporting) return;

        let weapon = this.game.sprites.get(player.getWeaponSpriteName());

        if (!weapon) return;

        if (!weapon.loaded) weapon.load();

        let animation = player.animation!,
            weaponAnimations = weapon.animations[animation.name];

        if (!weaponAnimations) return;

        let { frame, row } = animation,
            index =
                frame.index < weaponAnimations.length
                    ? frame.index
                    : frame.index % weaponAnimations.length,
            weaponX = weapon.width * index,
            weaponY = weapon.height * row,
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
     * Draws the sprites sparks on top of items
     * to give them the sparkle effect.
     */

    private drawSparks(): void {
        let { sparksAnimation } = this.game.entities.sprites,
            sparksFrame = sparksAnimation.frame;

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
     * Draws a special medal above the player's name.
     * @param key The key of the medal we are drawing.
     * @param x The x coordinate on the screen we are drawing at.
     * @param y The y coordinate on the screen we are drawing at.
     */

    private drawMedal(key: string, x: number, y: number): void {
        let medal = this.getMedal(key);

        if (!medal) return;

        this.textContext.drawImage(
            medal.image,
            0,
            0,
            medal.width,
            medal.height,
            (x - 5) * this.camera.zoomFactor,
            (y - 17) * this.camera.zoomFactor,
            medal.width * 2,
            medal.height * 2
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
        if (
            entity.hidden ||
            entity.healthBarVisible ||
            !entity.level ||
            !entity.drawNames() ||
            (!this.drawNames && !this.drawLevels)
        )
            return;

        let colour = entity.wanted ? 'red' : 'white';

        // If entity has any rank aside from default then we use their colour.
        if (entity.rank !== Modules.Ranks.None) colour = Modules.RankColours[entity.rank];

        // Draw the yellow name above the entity if it's the same entity as our current player.
        if (entity.instance === this.game.player.instance) colour = 'rgba(252,218,92, 1)';

        if (entity.nameColour) colour = entity.nameColour;

        this.textContext.save();
        this.setCameraView(this.textContext);
        this.textContext.font = '11px AdvoCut';

        if (entity.hasCounter) {
            // TODO - Move this countdown elsewhere.
            if (this.game.time - entity.countdownTime > 1000) {
                entity.countdownTime = this.game.time;
                entity.counter--;
            }

            if (entity.counter <= 0) entity.hasCounter = false;

            this.drawText(entity.counter.toString(), entity.x + 8, entity.y - 10, true, colour);
        } else {
            let x = entity.x + 8,
                y = entity.y - Math.floor(entity.sprite.height / 5);

            if (this.drawNames && entity instanceof Character) {
                let nameY = this.drawLevels && !entity.isNPC() ? y - 7 : y - 4;

                this.drawText(entity.name, x, nameY, true, colour, 'rbga(0, 0, 0, 1)');

                // Draw the medal if the entity has one.
                if (entity.hasMedal()) this.drawMedal(entity.getMedalKey(), x, nameY);
            }

            if (this.drawLevels && (entity.isMob() || entity.isPlayer()))
                this.drawText(`Level ${entity.level}`, x, y, true, colour, 'rbga(0, 0, 0, 1)');

            if (entity.isItem() && entity.count > 1)
                this.drawText(entity.count.toString(), x, y, true, colour);
        }

        this.textContext.restore();
    }

    private drawMinigameGUI(): void {
        if (!this.game.minigame.exists()) return;

        switch (this.game.minigame.status) {
            case 'lobby': {
                this.drawText(
                    this.game.minigame.started
                        ? `There is a game in progress: ${this.game.minigame.countdown} seconds`
                        : `Game starts in ${this.game.minigame.countdown} seconds`,
                    this.textCanvas.width / 6,
                    30,
                    true,
                    'white'
                );
                return;
            }

            case 'ingame': {
                this.drawText(
                    `Red: ${this.game.minigame.redTeamScore}`,
                    this.textCanvas.width / 6 - 20,
                    30,
                    true,
                    'red'
                );

                this.drawText(
                    `Blue: ${this.game.minigame.blueTeamScore}`,
                    this.textCanvas.width / 6 + 20,
                    30,
                    true,
                    'blue'
                );

                this.drawText(
                    `Time left: ${this.game.minigame.countdown} seconds`,
                    this.textCanvas.width / 6,
                    50,
                    true,
                    'white'
                );

                return;
            }
        }
    }

    protected drawLighting(lighting: RendererLighting): void {
        if (lighting.relative) {
            let lightX =
                    (lighting.light.origX - this.camera.x / this.tileSize) * this.actualTileSize,
                lightY =
                    (lighting.light.origY - this.camera.y / this.tileSize) * this.actualTileSize;

            lighting.light.position = new Vec2(lightX, lightY);
            lighting.compute(this.canvasWidth, this.canvasHeight);
            this.darkMask.compute(this.canvasWidth, this.canvasHeight);
        } else if (!lighting.computed) {
            lighting.compute(this.canvasWidth, this.canvasHeight);
            lighting.computed = true;
        }

        lighting.render(this.overlayContext);
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
     * @param colour The colour of the text in rgba format.
     * @param strokeColour The colour of the stroke in rgba format.
     * @param fontSize (Optional) The font size of the text.
     */

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
            -this.camera.x * this.camera.zoomFactor,
            -this.camera.y * this.camera.zoomFactor
        );
    }

    // -------------- Getters and Checkers --------------

    protected getX(index: number, width: number): number {
        if (index === 0) return 0;

        return index % width === 0 ? width - 1 : (index % width) - 1;
    }

    /**
     * Checks whether a light source is in the radius of the camera.
     * @param lighting The light source we are checking for.
     * @returns Whether or not the light source is in the camera radius.
     */

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

    /**
     * A flipped tile is any tile that contains a flip
     * flag or transpose flag.
     * @param tileInfo Tile data received from the server.
     * @returns Whether or not the tile contains and flip flags.
     */

    protected isFlipped(tileInfo: RotatedTile): boolean {
        if (!tileInfo) return false;

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
     * Superclass implementation for updating the tile at a specified
     * index. This is implemented by the WebGL renderer to update the
     * tile in the buffer.
     * @param index The index at which to update the tile.
     * @param data The data with which to update the tile.
     */

    public setTile(index: number, data: RegionTile): void {
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
     * Iterates through each light currently loaded.
     * @param callback The light currently being iterated.
     */

    private forEachLighting(callback: (lighting: RendererLighting) => void): void {
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
