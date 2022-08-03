import { Worker } from 'worker_threads';

import log from '@kaetram/common/util/log';

export default class Pool {
    private workers: { [id: number]: Worker } = {};

    public constructor(threads: number) {
        for (let i = 0; i < threads; i++) {
            let worker = new Worker(new URL('worker.ts', import.meta.url));

            this.workers[worker.threadId] = worker;

            worker.on('message', (message) => {
                log.info(`Worker ${worker.threadId} says: ${message.test}`);
            });

            worker.on('online', () => {
                worker.postMessage(`Hello from worker ${worker.threadId}!`);
            });
        }

        log.info(`Created ${threads} worker threads.`);
    }
}
