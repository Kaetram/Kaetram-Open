import _ from 'underscore';
    import Profession from './profession';

class Fishing extends Profession {

    constructor(id, player) {
        super(id, player, 'Fishing');

        this.tick = 1000;
    }

}

export default Fishing;
