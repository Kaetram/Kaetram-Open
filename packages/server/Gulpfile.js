/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-nocheck

const gulp = require('gulp');
const uglify = require('gulp-uglify');
const ts = require('gulp-typescript');
const plumber = require('gulp-plumber');
const jsonminify = require('gulp-jsonminify');
const del = require('del');

gulp.task('clean', async () => del(['dist']));

gulp.task('build', async () => {
    const tsProject = ts.createProject('./tsconfig.json');
    return tsProject
        .src()
        .pipe(plumber())
        .pipe(tsProject())
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('copy', async () =>
    gulp
        .src(['./data/**/*.json'], { base: '.' })
        .pipe(plumber())
        .pipe(jsonminify())
        .pipe(gulp.dest('dist'))
);

gulp.task('server', gulp.series('build', 'copy'));

gulp.task('default',
    gulp.series(
        'clean',
        'build',
        'copy'
    )
);
