import Map from '../map/map';

export default class Tile {
    public x!: number;
    public y!: number;

    private animationInfo;
    private animationIndex = 0;
    private lastTime = 0;
    // private canDraw = true;

    public constructor(public id: number, public index: number, map: Map) {
        this.animationInfo = map.getTileAnimation(id);
    }

    public setPosition(position: Pos): void {
        this.x = position.x;
        this.y = position.y;
    }

    private update(): void {
        this.id = this.animationInfo[this.animationIndex].tileid;
        // this.canDraw = true;
    }

    public animate(time: number): void {
        if (time - this.lastTime > this.animationInfo[this.animationIndex].duration) {
            this.update();
            this.lastTime = time;

            if (this.animationIndex >= Object.keys(this.animationInfo).length - 1)
                this.animationIndex = 0;
            else this.animationIndex++;
        }
    }

    // getPosition(): [x: number, y: number] {
    //     return this.x && this.y ? [this.x, this.y] : [0, 0];
    // }
}
