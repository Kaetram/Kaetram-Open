require.config({
    baseUrl: 'lib',
    paths: {
        jquery: 'jquery',
        underscore: 'underscore',
        'socket.io-client': 'socket.io'
    }
});

define(['../js/app.js', 'stacktrace'], function() {
    require(['ts/main']);
});
