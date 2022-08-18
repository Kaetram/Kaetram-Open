import Minigame from '../minigame';
import World from '../../world';
import Area from '../../map/areas/area';
import Player from '../../entity/character/player/player';
import Grids from '../../map/grids';
import Entity from '../../entity/entity';

export default class TeamWar extends Minigame {
    private grids: Grids;

    private lobby: Area = new Area(0, 0, 0, 0, 0); // Empty area.

    private redTeam: { [instance: string]: Player } = {};
    private blueTeam: { [instance: string]: Player } = {};

    public constructor(private world: World) {
        super('teamwar');

        this.grids = this.world.map.grids;
    }

    /**
     * Loads a map area into the TeamWar minigame. We use this to load
     * the lobby area and begin working with it.
     * @param area Area object received from the map.
     */

    public override loadArea(area: Area): void {
        if (area.mObjectType !== 'lobby') return;

        this.lobby = area;
    }

    /**
     * Looks through all the tiles in the lobby area object and iterates through
     * all the entities at that current coordinate. If the entity is a player,
     * we add it to our list of entities and return it after exhausting all tiles.
     * @returns An array of players in the lobby.
     */

    private getPlayersInLobby(): Player[] {
        let players: Player[] = [];

        // Look through each tile in the lobby area object.
        this.lobby.forEachTile((x: number, y: number) => {
            // Look for every entity in the current x and y within the area.
            this.grids.forEachEntityAt(x, y, (entity: Entity) => {
                // Skip non-player entities.
                if (!entity.isPlayer()) return;

                // Append the player to the array.
                players.push(entity as Player);
            });
        });

        return players;
    }
}
