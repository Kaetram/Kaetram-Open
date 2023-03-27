import Renderer from '../renderer';

import type Game from '../../game';

export default class WebGL extends Renderer {
    public constructor(game: Game) {
        super(game);
    }
}
