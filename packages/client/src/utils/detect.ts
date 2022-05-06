export let agent = navigator.userAgent.toLowerCase();

export let isIPad = (): boolean => /ipad/.test(agent);

export let isSafari = (): boolean => /safari/.test(agent) && !/chrome/.test(agent);

export let isEdge = (): boolean => /edge\//.test(agent);

export function isTablet(): boolean {
    let isAppleTablet = /ipad/.test(agent),
        isAndroidTablet = /android/.test(agent);

    return (isAppleTablet || isAndroidTablet) && window.innerWidth >= 640;
}

export let isMobile = (): boolean => window.innerWidth < 1000;

export function iOSVersion(): number | undefined {
    let match = agent.match(/os (\d+)_(\d+)_?(\d+?)/);

    if (match) {
        let version = [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3] || '0', 10)
        ];

        return parseFloat(version.join('.'));
    }
}

export function androidVersion(): number | undefined {
    let split = agent.split('android');

    if (split.length > 1) return parseFloat(split[1].split(';')[0]);
}

export function supportsWebGL(): boolean {
    // let canvas = document.createElement('canvas'),
    //     gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    return false;
}

export let isAppleDevice = (): boolean => agent.startsWith('ip');

// Older mobile devices will default to non-centred camera mode
export function isOldAndroid(): boolean {
    let version = androidVersion();

    return !!version && version < 6;
}

export function isOldApple(): boolean {
    let version = iOSVersion();

    return !!version && version < 9;
}

export let useCenteredCamera = (): boolean => isOldAndroid() || isOldApple() || isIPad();
