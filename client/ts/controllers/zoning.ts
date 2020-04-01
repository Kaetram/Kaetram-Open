import Modules from '../utils/modules';
import Game from '../game';
import Renderer from '../renderer/renderer';
import Camera from '../renderer/camera';
import Input from './input';

export default class Zoning {
    renderer: Renderer;
    camera: Camera;
    input: Input;
    direction: number;

    constructor(public game: Game) {
        this.game = game;
        this.renderer = game.renderer;
        this.camera = game.camera;
        this.input = game.input;

        this.direction = null;
    }

    reset() {
        this.direction = null;
    }

    setUp() {
        this.direction = Modules.Orientation.Up;
    }

    setDown() {
        this.direction = Modules.Orientation.Down;
    }

    setRight() {
        this.direction = Modules.Orientation.Right;
    }

    setLeft() {
        this.direction = Modules.Orientation.Left;
    }

    getDirection() {
        return this.direction;
    }
}
