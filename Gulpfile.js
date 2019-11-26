/** @format */

const path = require('path');
const { task, series, parallel, src, dest } = require('gulp');
const del = require('del');
const csso = require('gulp-csso');
const htmlmin = require('gulp-htmlmin');
const uglify = require('gulp-uglify');
const { generateSW } = require('workbox-build');

// Gulp task to minify HTML files
task('pages', async () =>
    src([path.resolve(__dirname, './client/index.html')])
        .pipe(
            htmlmin({
                caseSensitive: false,
                collapseInlineTagWhitespace: true,
                minifyCSS: true,
                minifyJS: true,
                collapseWhitespace: true,
                removeComments: true,
                sortAttributes: true,
                sortClassName: false,
                processScripts: ['application/ld+json']
            })
        )
        .pipe(dest(path.resolve(__dirname, './dist')))
);

// Gulp task to minify CSS files
task('styles', async () =>
    src(path.resolve(__dirname, './client/**/*.css'))
        .pipe(csso())
        .pipe(dest(path.resolve(__dirname, './dist/css')))
);

// Gulp task to minify JavaScript files
task('scripts', async () =>
    src(path.resolve(__dirname, './client/**/*.js'))
        .pipe(uglify())
        .pipe(dest(path.resolve(__dirname, './dist/js')))
);

task('clean', async () => del(['dist']));

task('generate-sw', async () => {
    const build = await generateSW({
        swDest: path.resolve(__dirname, './client/sw.js'),
        globDirectory: path.resolve(__dirname, './client/'),
        globPatterns: [
            '**/*.{mp3,css,json,json-dist,js,ico,eot,svg,ttf,woff,png,gif,jpg,html,txt,xml}'
        ],
        maximumFileSizeToCacheInBytes: 5e6,
        clientsClaim: true,
        skipWaiting: true
    });
    const { count, size, warnings } = build;

    warnings.forEach(console.warn);
    console.log(`${count} files will be precached, totaling ${size} bytes.`);

    return build;
});

exports.default = series(
    'clean',
    parallel('pages', 'styles', 'scripts'),
    'generate-sw'
);
