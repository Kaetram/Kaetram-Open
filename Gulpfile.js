/* eslint-disable @typescript-eslint/no-var-requires */
/** @format */

const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const tsify = require('tsify');
const sourcemaps = require('gulp-sourcemaps');
const buffer = require('vinyl-buffer');
const paths = {
    pages: ['src/*.html']
};

gulp.task('copy-html', function() {
    return gulp.src(paths.pages).pipe(gulp.dest('client'));
});

gulp.task(
    'default',
    gulp.series(gulp.parallel('copy-html'), function() {
        return browserify({
            basedir: '.',
            debug: true,
            entries: ['src/main.ts'],
            cache: {},
            packageCache: {}
        })
            .plugin(tsify)
            .transform('babelify', {
                presets: ['env'],
                extensions: ['.ts']
            })
            .bundle()
            .pipe(source('bundle.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('client'));
    })
);
