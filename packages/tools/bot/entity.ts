export default class Entity {
    constructor(
        public id: string,
        public x: number,
        public y: number,
        public connection: SocketIOClient.Socket
    ) {}
}
