import Renderer from './renderer';

import Character from '../entity/character/character';

import { Vec2 } from 'illuminated';
import { Modules } from '@kaetram/common/network';

import type Game from '../game';
import type Splat from './infos/splat';
import type Entity from '../entity/entity';
import type Item from '../entity/objects/item';
import type Player from '../entity/character/player/player';
import type { RendererLighting } from './renderer';
import type { RegionTile, RotatedTile } from '@kaetram/common/types/map';

enum TileFlip {
    Horizontal,
    Vertical,
    Diagonal
}

type ContextCallback = (context: CanvasRenderingContext2D) => void;

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
}

export default class Canvas extends Renderer {
    private renderedFrame = [-1, -1];

    // Used for storing and caching tile information.
    private tiles: { [id: string]: RendererTile } = {};
    private cells: { [id: number]: RendererCell } = {};

    // Override for the context types
    private entitiesContext: CanvasRenderingContext2D = this.entities.getContext('2d')!;
    private backContext: CanvasRenderingContext2D = this.background.getContext('2d')!;
    private foreContext: CanvasRenderingContext2D = this.foreground.getContext('2d')!;
    private overlayContext: CanvasRenderingContext2D = this.overlay.getContext('2d')!;
    private textContext: CanvasRenderingContext2D = this.textCanvas.getContext('2d')!;
    private cursorContext: CanvasRenderingContext2D = this.cursor.getContext('2d')!;

    // Store all the contexts in an array so we can parse when needed.
    private allContexts = [
        this.entitiesContext,
        this.backContext,
        this.foreContext,
        this.overlayContext,
        this.textContext
    ];

    // We split contexts into two arrays, one for tilemap rendering and one for the rest.
    private contexts = [this.entitiesContext, this.textContext, this.overlayContext];
    private drawingContexts = [this.backContext, this.foreContext];

    public constructor(game: Game) {
        super(game);
    }

    /**
     * Override for the resizing function where we also
     * handle clearing up the canvases and tiling.
     */

    public override resize(): void {
        super.resize();

        // Clear all the cells so they're redrawn.
        this.cells = {};

        // Cursor may get stuck on when resizing from desktop to mobile proportions.
        this.clearScreen(this.cursorContext);
    }

    /**
     * Override for the rendering function. We do our Canvas2D rendering here.
     */

    public override render(): void {
        if (this.stopRendering) return;

        this.clear();
        this.save();

        this.removeSmoothing();

        this.draw();

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

    // ---------- Drawing Functions ----------

    /**
     * Background and foreground drawing function. Here we iterate
     * through all the tile visibles (every tile in the camera's view)
     * and draw them onto the foreground and background canvases depending
     * on the tileId's property (we compare to see if the tile id is that
     * of a high tile in the map).
     */

    private draw(): void {
        if (this.hasRenderedFrame()) return;

        this.clearDrawing();
        this.saveDrawing();

        // Sets the view according to the camera.
        this.updateDrawingView();

        this.forEachVisibleTile((tile: RegionTile, index: number) => {
            let flips: number[] = this.getFlipped(tile as RotatedTile);

            // Extract the tileId from the animated region tile.
            if (flips.length > 0) tile = (tile as RotatedTile).tileId;

            // Determine the layer of the tile depending on if it is a high tile or not.
            let isHighTile = this.map.isHighTile(tile as number),
                context = (
                    isHighTile ? this.foreContext : this.backContext
                ) as CanvasRenderingContext2D;

            // Only do the lighting logic if there is an overlay.
            if (this.game.overlays.hasOverlay()) {
                let isLightTile = this.map.isLightTile(tile as number);

                context = isLightTile ? (this.overlayContext as CanvasRenderingContext2D) : context;
            }

            /**
             * Draws the animated tiles first so they display behind potential
             * high tiles. We check if the current index contains an animated tile
             * and if we are currently animating tiles before proceeding.
             */
            if (index in this.animatedTiles && this.animateTiles) {
                // Advance the timing of the animated tiles with the current epoch.
                this.animatedTiles[index].animate(this.game.time);

                // Prevent double draws when drawing flipped animated tiles.
                if (flips.length === 0 && this.animatedTiles[index].isFlipped) return;

                this.drawTile(
                    context,
                    this.animatedTiles[index].id,
                    this.animatedTiles[index].index,
                    flips
                );
            }

            // Skip animated tiles unless we disable animations, then just draw the tile once.
            if (!this.map.isAnimatedTile(tile as number) || !this.animateTiles)
                this.drawTile(context, (tile as number) - 1, index, flips);
        });

        this.saveFrame();
        this.restoreDrawing();
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

    protected override drawLighting(lighting: RendererLighting): void {
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

    // ---------- Primitive Drawing Functions ----------

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
        index: number,
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
                relativeTileId = tileId - tileset.firstGid;

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

        if (!(index in this.cells) || flips.length > 0)
            this.cells[index] = {
                dx: this.getX(index + 1, this.map.width) * this.actualTileSize,
                dy: Math.floor(index / this.map.width) * this.actualTileSize,
                width: this.actualTileSize,
                height: this.actualTileSize
            };

        this.drawImage(context, tileset, this.tiles[tileId], this.cells[index], flips);
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
        cell: RendererCell,
        flips: number[] = []
    ): void {
        let dx = 0,
            dy = 0,
            isFlipped = flips.length > 0;

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
            for (let index = 0; index < flips.length; index++)
                switch (flips[index]) {
                    case TileFlip.Horizontal: {
                        // Flip the context2d horizontally
                        dx = -dx - cell.width;
                        context.scale(-1, 1);

                        break;
                    }

                    case TileFlip.Vertical: {
                        // Flip the context2d vertically
                        dy = -dy - cell.height;
                        context.scale(1, -1);

                        break;
                    }

                    case TileFlip.Diagonal: {
                        // A diagonal flip is actually a transpose of 90deg clockwise.
                        context.rotate(Math.PI / 2);
                        context.translate(0, -cell.height);

                        (dx = dy), (dy = -tempX);

                        /**
                         * Explanation: After we perform a diagonal permutation (that is, we rotate the tile
                         * 90 degrees to the right, the horizontal and vertical flags become inverted). That is,
                         * performing a horizontal flip after rotating performs a vertical flip when observed
                         * in the rendering context. The following ensures that a horizontal flip is performed only
                         * when the next available flip is horizontal (essentially performing two horizontals in a row.)
                         */

                        if (flips[index + 1] === TileFlip.Horizontal)
                            flips.push(TileFlip.Horizontal);
                        else flips.push(TileFlip.Vertical);

                        break;
                    }
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

    // ---------- Rendering Functions ----------

    /**
     * Checks whether or not the current frame has already been rendererd in order
     * to prevent drawing when there is no movement during low power mode.
     * @returns Whether or not the current frame has been rendered.
     */

    private hasRenderedFrame(): boolean {
        if (this.forceRendering || !this.isLowPowerMode()) return false;

        if (this.stopRendering) return true;

        return this.renderedFrame[0] === this.camera.x && this.renderedFrame[1] === this.camera.y;
    }

    // ---------- Context Manipulation Functions ----------

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
     * Iterates through the drawing contexts (low and high tiles) and clears the entire frame.
     */

    private clearDrawing(): void {
        this.forEachDrawingContext(this.clearScreen);
    }

    /**
     * Clears the screen given a specified context.
     * @param context The context that we want to clear the contents of.
     */

    private clearScreen(context: CanvasRenderingContext2D): void {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }

    /**
     * Iterates through each context and saves the current state.
     */

    private save(): void {
        this.forEachContext((context: CanvasRenderingContext2D) => context.save());
    }

    /**
     * Iterates through just the drawing contexts (low and high tiles) and saves the current state.
     */

    private saveDrawing(): void {
        this.forEachDrawingContext((context: CanvasRenderingContext2D) => context.save());
    }

    /**
     * Saves the currently rendered frame in order to prevent unnecessary redraws
     * during low power mode.
     */

    private saveFrame(): void {
        if (!this.isLowPowerMode()) return;

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

    /**
     * Iterates through just the drawing contexts (low and high tiles) and restores them.
     */

    private restoreDrawing(): void {
        this.forEachDrawingContext((context: CanvasRenderingContext2D) => context.restore());
    }

    /**
     * Iterates through the drawing contexts (used for tiling) and sets the camera position.
     */

    private updateDrawingView(): void {
        this.forEachDrawingContext((context) => this.setCameraView(context));
    }

    // ---------- Getters and Checkers ----------

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
     * Checks if a tile is a flipped tile and extracts
     * all the flags based on the tile data. Returns an
     * array containing all the flip flags.
     * @param tile The region tile we are checking.
     * @returns An array containing all flip flags in order.
     */

    public getFlipped(tile: RotatedTile): number[] {
        let flips: number[] = [];

        // Return empty if tile doesn't contain flip flags.
        if (!this.isFlipped(tile)) return flips;

        if (tile.v) flips.push(TileFlip.Vertical);
        if (tile.d) flips.push(TileFlip.Diagonal);
        if (tile.h) flips.push(TileFlip.Horizontal);

        return flips;
    }

    // ---------- Setters Functions ----------

    /**
     * Synchronizes the camera view onto the a specified context. This translates
     * the context relative to where the camera is currently positioned.
     * @param context The context that we are setting the camera view for.
     */

    private setCameraView(context: CanvasRenderingContext2D): void {
        // Stop if we are not rendering or if there is no camera.
        if (!this.camera || this.stopRendering) return;

        context.translate(
            -this.camera.x * this.camera.zoomFactor,
            -this.camera.y * this.camera.zoomFactor
        );
    }

    // ---------- Iterative Functions ----------

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

    /**
     * Iterates through all the drawing contexts (backContext and foreContext).
     * @param callback The context being iterated.
     */

    private forEachDrawingContext(callback: ContextCallback): void {
        for (let context in this.drawingContexts)
            callback(this.drawingContexts[context] as CanvasRenderingContext2D);
    }

    /**
     * Iterates through each light currently loaded.
     * @param callback The light currently being iterated.
     */

    private forEachLighting(callback: (lighting: RendererLighting) => void): void {
        for (let lighting in this.lightings) callback(this.lightings[lighting]);
    }
}
