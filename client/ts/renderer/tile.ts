export default class Tile {
    id: any;
    index: any;
    map: any;
    animationInfo: any;
    animationIndex: number;
    lastTime: number;
    canDraw: boolean;
    x: any;
    y: any;
    constructor(id, index, map) {
        this.id = id;
        this.index = index;
        this.map = map;

        this.animationInfo = map.getTileAnimation(id);

        this.animationIndex = 0;
        this.lastTime = 0;

        this.canDraw = true;
    }

    setPosition(position) {
        this.x = position.x;
        this.y = position.y;
    }

    update() {
        this.id = this.animationInfo[this.animationIndex].tileid;
        this.canDraw = true;
    }

    animate(time) {
        if (
            time - this.lastTime >
            this.animationInfo[this.animationIndex].duration
        ) {
            this.update();
            this.lastTime = time;

            if (this.animationIndex >= this.animationInfo.length - 1)
                this.animationIndex = 0;
            else this.animationIndex++;
        }
    }

    getPosition() {
        return this.x && this.y ? [this.x, this.y] : [0, 0];
    }
}
