import redis, { RedisClient } from 'redis';

function load() {
    const registrar = new Registrar();

    registrar.onReady(() => {
        //
    });
}

export default class Registrar {
    client: RedisClient;
    readyCallback: () => void;

    constructor() {
        this.client = redis.createClient(6379, '127.0.0.1');

        this.readyCallback();
    }

    onReady(callback: () => void): void {
        this.readyCallback = callback;
    }
}

load();
