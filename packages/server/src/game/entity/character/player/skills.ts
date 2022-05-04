import Player from './player';
import Skill from './skill/skill';
import Lumberjacking from './skill/impl/lumberjacking';

export default class Skills {
    private lumberjacking: Lumberjacking = new Lumberjacking();

    private skills: Skill[] = [this.lumberjacking];

    public constructor(private player: Player) {}
}
