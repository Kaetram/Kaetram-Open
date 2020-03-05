import TeamWar from '../minigames/impl/teamwar';

class Minigames {
    public minigames: any;
    public world: any;

    constructor(world) {
        this.world = world;

        this.minigames = {};

        this.load();
    }

    load() {
        this.minigames.TeamWar = new TeamWar(this.world);

        console.info(
            `Finished loading ${Object.keys(this.minigames).length} minigames.`
        );
    }

    getTeamWar() {
        return this.minigames.TeamWar;
    }
}

export default Minigames;
