import config from '@kaetram/common/config';

export function formatServerName(serverId: string): string | null {
    // TODO - Make this less hard-coded.
    if (!serverId.startsWith('kaetram_server')) return null;

    let serverNumber = parseInt(serverId.split('kaetram_server')[1]);

    return `${config.name} ${serverNumber}`;
}
