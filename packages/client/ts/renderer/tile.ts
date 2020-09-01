import Map, { MapAnimations } from '../map/map';
export default class Tile {
    id: number;
    index: number;
    map: Map;
    x: number;
    y: number;
    animationInfo: MapAnimations;
    animationIndex: number;
    lastTime: number;
    canDraw: boolean;

    constructor(id: number, index: number, map: Map) {
        this.id = id;
        this.index = index;
        this.map = map;

        this.animationInfo = map.getTileAnimation(id);

        this.animationIndex = 0;
        this.lastTime = 0;

        this.canDraw = true;
    }

    setPosition(position: Pos): void {
        this.x = position.x;
        this.y = position.y;
    }

    update(): void {
        this.id = this.animationInfo[this.animationIndex].tileid;
        this.canDraw = true;
    }

    animate(time: number): void {
        if (time - this.lastTime > this.animationInfo[this.animationIndex].duration) {
            this.update();
            this.lastTime = time;

            if (this.animationIndex >= Object.keys(this.animationInfo).length - 1)
                this.animationIndex = 0;
            else this.animationIndex++;
        }
    }

    getPosition(): [number, number] {
        return this.x && this.y ? [this.x, this.y] : [0, 0];
    }
}
