({

    appDir: "../",
    baseUrl: "js",
    dir: "../../client-build",
    optimize: "uglify",
    optimizeCss: "standard.keepLines",

    paths: {
        jquery: 'lib/jquery'
    },

    modules: [
        {
            name: 'main'
        }
    ]
});