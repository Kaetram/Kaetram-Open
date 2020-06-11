export default class Tile {
    constructor(id, index, map) {
        var self = this;

        self.id = id;
        self.index = index;
        self.map = map;

        self.animationInfo = map.getTileAnimation(id);

        self.animationIndex = 0;
        self.lastTime = 0;

        self.canDraw = true;
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
        var self = this;

        if (
            time - self.lastTime >
            self.animationInfo[self.animationIndex].duration
        ) {
            self.update();
            self.lastTime = time;

            if (self.animationIndex >= self.animationInfo.length - 1)
                self.animationIndex = 0;
            else self.animationIndex++;
        }
    }

    getPosition() {
        return this.x && this.y ? [this.x, this.y] : [0, 0];
    }
}
