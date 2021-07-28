import Player from '../../player';
import Quest from '../quest';
import { QuestData } from '../quest';

export default class Thelie extends Quest {
    constructor(player: Player, data: QuestData) {
        super(player, data);

        this.player = player;
        this.data = data;
    }

    override load(stage: number): void {
        super.load(stage);
    }
}
