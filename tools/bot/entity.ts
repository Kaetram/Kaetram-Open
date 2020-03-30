class Entity {
    id: any;
    x: any;
    y: any;
    connection: any;

    constructor(id, x, y, connection) {
        this.id = id;
        this.x = x;
        this.y = y;

        this.connection = connection;
    }
}

export default Entity;
