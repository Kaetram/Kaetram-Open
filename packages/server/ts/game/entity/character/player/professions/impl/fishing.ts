import _ from 'underscore';
import Profession from './profession';
import Player from '../../player';

class Fishing extends Profession {
    tick: number;

    constructor(id: number, player: Player) {
        super(id, player, 'Fishing');

        this.tick = 1000;
    }
}

export default Fishing;
