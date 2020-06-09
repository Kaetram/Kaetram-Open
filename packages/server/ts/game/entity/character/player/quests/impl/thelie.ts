/* global module */

import Quest from '../quest';
    import Packets from '../../../../../network/packets';

class Thelie extends Quest {

    constructor(player, data) {
        super(player, data);

        this.player = player;
        this.data = data;
    }

    load(stage) {
        super.load(stage);
    }

}

export default Thelie;
