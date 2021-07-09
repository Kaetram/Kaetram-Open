import Quest from '../quest';
import Player from '../../player';

class Thelie extends Quest {
    constructor(player: Player, data: any) {
        super(player, data);

        this.player = player;
        this.data = data;
    }

    load(stage: number) {
        super.load(stage);
    }
}

export default Thelie;
