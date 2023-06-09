import Handshake from '@kaetram/common/network/impl/handshake';

window.addEventListener('load', () => {
    let ws = new WebSocket(`ws://${globalConfig.hubWsHost}:${globalConfig.hubWsPort}`);

    ws.addEventListener('open', () => {
        ws.send(
            JSON.stringify(
                new Handshake({
                    type: 'admin',
                    accessToken: globalConfig.accessToken
                }).serialize()
            )
        );
    });

    ws.addEventListener('message', (event) => {
        console.log('Message from server', event.data);
    });

    ws.addEventListener('close', () => {
        console.log('Connection closed');
    });

    ws.addEventListener('error', (error) => {
        console.log('Error', error);
    });
});
