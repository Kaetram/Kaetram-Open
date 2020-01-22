Detect = {};

Detect.isIpad = function() {
    return /ipad/i.test(navigator.userAgent.toLowerCase());
};

Detect.isAndroid = function() {
    return /Android/i.test(navigator.userAgent);
};

Detect.isWindows = function() {
      return Detect.userAgentContains('Windows');
};

Detect.isFirefox = function() {
    return Detect.userAgentContains('Firefox');
};

Detect.isSafari = function() {
    return Detect.userAgentContains('Safari') && !Detect.userAgentContains('Chrome');
};

Detect.isOpera = function() {
    return Detect.userAgentContains('Opera');
};

Detect.isInternetExplorer = function() {
    return false || !!document.documentMode;
};

Detect.isEdge = function() {
    return !Detect.isInternetExplorer() && !!window.StyleMedia;
};

Detect.isFirefoxAndroid = function() {
    return Detect.userAgentContains('Android') && Detect.userAgentContains('Firefox');
};

Detect.userAgentContains = function(string) {
    return navigator.userAgent.indexOf(string) !== -1;
};

Detect.getUserAgent = function() {
    return navigator.userAgent.toString();
};

Detect.isTablet = function() {
    var userAgent = navigator.userAgent.toLowerCase(),
        isAppleTablet = /ipad/i.test(userAgent),
        isAndroidTablet = /android/i.test(userAgent);

    return (isAppleTablet || isAndroidTablet) && window.innerWidth >= 640;
};

Detect.isMobile = function() {
    return window.innerWidth < 1000;
};

Detect.iOSVersion = function() {
    if(window.MSStream){
        // There is some iOS in Windows Phone...
        // https://msdn.microsoft.com/en-us/library/hh869301(v=vs.85).aspx
        return '';
    }
    var match = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/),
        version;

    if (match !== undefined && match !== null) {
        version = [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3] || 0, 10)
        ];
        return parseFloat(version.join('.'));
    }

    return '';
};

Detect.androidVersion = function() {
    var userAgent = navigator.userAgent.split('Android'), version;

    if (userAgent.length > 1)
        version = userAgent[1].split(';')[0];

    return version;
};

Detect.supportsWebGL = function() {
    //var canvas = document.createElement('canvas'),
    //    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    return false;
};

Detect.isAppleDevice = function() {
    var devices = [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ];

    if (!!navigator.platform)
        while(devices.length)
            if (navigator.platform = devices.pop())
                return true;

    return false;
};

// Older mobile devices will default to non-centred camera mode
Detect.isOldAndroid = function() {
    return parseFloat(Detect.androidVersion() < 6.0);
};

Detect.isOldApple = function() {
    return parseFloat(Detect.iOSVersion() < 9.0);
};

Detect.useCenteredCamera = function() {
    return Detect.isOldAndroid() || Detect.isOldApple() || Detect.isIpad();
};
