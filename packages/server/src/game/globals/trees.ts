import World from '../world';
import Map from '../map/map';

export default class Trees {
    private map: Map;

    public constructor(private world: World) {
        this.map = this.world.map;

        console.log(this.map.trees);
    }
}
