/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

const { workerData, parentPort, threadId } = require('worker_threads');

parentPort.on('message', (message) => {
    console.log(message);

    parentPort.postMessage({
        test: [1, 2, 3, 4, 5]
    });
});
