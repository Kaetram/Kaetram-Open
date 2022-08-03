import { workerData, parentPort, threadId } from 'worker_threads';

parentPort?.on('message', (message) => {
    console.log(message);

    parentPort?.postMessage({
        test: [1, 2, 3, 4, 5]
    });
});
