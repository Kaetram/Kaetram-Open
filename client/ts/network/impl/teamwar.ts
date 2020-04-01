import Game from '../../game';

export default class TeamWar {
    constructor(public game?: Game) {}

    handle(info) {
        console.info(info);
    }
}
