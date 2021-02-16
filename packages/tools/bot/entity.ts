export default class Entity {
    public constructor(
        public id: string,
        public x: number,
        public y: number,
        public connection: SocketIOClient.Socket
    ) {}
}
