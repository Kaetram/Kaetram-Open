import Player from '../../player';
import Profession from './profession';

export default class Fishing extends Profession {
    tick: number;

    constructor(id: number, player: Player) {
        super(id, player, 'Fishing');

        this.tick = 1000;
    }
}
