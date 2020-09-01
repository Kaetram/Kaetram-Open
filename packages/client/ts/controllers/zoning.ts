import Modules from '../utils/modules';
import Game from '../game';
import Renderer from '../renderer/renderer';
import Camera from '../renderer/camera';
import InputController from './input';

export default class ZoningController {
    game: Game;
    renderer: Renderer;
    camera: Camera;
    input: InputController;
    direction: number;
    constructor(game: Game) {
        this.game = game;
        this.renderer = game.renderer;
        this.camera = game.camera;
        this.input = game.input;

        this.direction = null;
    }

    reset(): void {
        this.direction = null;
    }

    setUp(): void {
        this.direction = Modules.Orientation.Up;
    }

    setDown(): void {
        this.direction = Modules.Orientation.Down;
    }

    setRight(): void {
        this.direction = Modules.Orientation.Right;
    }

    setLeft(): void {
        this.direction = Modules.Orientation.Left;
    }

    getDirection(): number {
        return this.direction;
    }
}
