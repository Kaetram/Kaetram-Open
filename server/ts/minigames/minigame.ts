class Minigame {
    public id: any;
    public name: any;

    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }
}

export default Minigame;
