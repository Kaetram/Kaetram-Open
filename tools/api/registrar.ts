/* eslint-disable @typescript-eslint/camelcase */

import redis from 'redis';

class Registrar {
    client: any;
    readyCallback() {
        throw new Error('Method not implemented.');
    }

    constructor() {
        this.client = redis.createClient('127.0.0.1', 6379, {
            socket_nodelay: true,
        });

        if (this.readyCallback) this.readyCallback();
    }

    onReady(callback) {
        this.readyCallback = callback;
    }
}

function load() {
    const registrar = new Registrar();

    registrar.onReady(() => {
        //
    });
}

load();
