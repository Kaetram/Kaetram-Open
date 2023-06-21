import Handshake from '@kaetram/common/network/impl/handshake';

import type { Packets } from '@kaetram/common/network';
import type { SerializedServer } from '@kaetram/common/types/network';

class Main {
    private ws = new WebSocket(`ws://${globalConfig.hubWsHost}:${globalConfig.hubWsPort}`);
    private serverList = document.querySelector('#server-list')!;

    public constructor() {
        this.ws.addEventListener('open', () => {
            this.ws.send(
                JSON.stringify(
                    new Handshake({
                        type: 'admin',
                        accessToken: globalConfig.accessToken
                    }).serialize()
                )
            );
        });

        this.ws.addEventListener('message', (event) => {
            let message = JSON.parse(event.data);

            this.handleMessage(message);
        });

        this.ws.addEventListener('close', () => {
            console.log('Connection closed');
        });

        this.ws.addEventListener('error', (error) => {
            console.log('Error', error);
        });
    }

    private handleMessage(message: [Packets, { servers: SerializedServer[] }]) {
        let [packet, data] = message,
            { servers } = data;

        for (let server of servers) {
            let serverElement = document.createElement('div');
            serverElement.classList.add('server');

            let serverName = document.createElement('h2');
            serverName.classList.add('server-name');
            serverName.textContent = server.name;

            let serverId = document.createElement('span');
            serverId.classList.add('server-id');
            serverId.textContent = server.id.toString();

            let serverPlayers = document.createElement('span');
            serverPlayers.classList.add('server-players');
            serverPlayers.textContent = `${server.players}/${server.maxPlayers}`;

            let serverHost = document.createElement('span');
            serverHost.classList.add('server-host');
            serverHost.textContent = `${server.host}:${server.port}`;

            serverElement.append(serverName, serverId, serverPlayers, serverHost);
            this.serverList.append(serverElement);
        }
    }
}

window.addEventListener('load', () => new Main());
