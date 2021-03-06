var gulp = require('gulp'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    tsify = require('tsify'),
    fancy_log = require('fancy-log'),
    watchify = require("watchify"),
    gutil = require("gulp-util"),
    wait = require("gulp-wait"),
    livereload = require('gulp-livereload'),
    sass = require('gulp-sass'),
    maps = require('gulp-sourcemaps'),
    jsonSass = require('json-sass'),
    fs = require('fs');

sass.compiler = require('node-sass');

function compile_sass() {
    gutil.log(gutil.colors.green('Compiling styles...'));
    return gulp.src('./*.scss')
        .pipe(maps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(maps.write())
        .pipe(gulp.dest('./public/gen'))
        .pipe(livereload());
}

function theme_sass() {
    gutil.log(gutil.colors.green('Compiling theme JSON to SASS...'));
    fs.createReadStream('theme.json')
        .pipe(jsonSass({
            prefix: '$theme: ',
        }))
        .pipe(fs.createWriteStream('theme.scss'));
}

function scripts(watch) {
    var b = browserify({
        basedir: '.',
        debug: true, // Setting to false removes the source mapping data.
        entries: [
            // TS files to transpile and bundle.
            'client/editor.ts',
        ],
        cache: {},
        packageCache: {}
    }).plugin(tsify);

    var rebundle = function () {
        gutil.log(gutil.colors.green('Bundling scripts...'));
        return b.bundle()
            .on('error', fancy_log)
            .pipe(source('bundle.js'))
            .pipe(gulp.dest('./public/gen'))
            .pipe(wait(1000))
            .pipe(livereload());
    };

    if (watch) {
        b = watchify(b);
        b.on('update', rebundle);
    }
    return rebundle();
}

gulp.task('sass', compile_sass);
gulp.task('default', function () { scripts(false); });
gulp.task('watch', function () {
    theme_sass();
    compile_sass();
    scripts(true);
    livereload();
    livereload.listen();
    gulp.watch(['theme.json'], theme_sass);
    gulp.watch(['*.scss'], compile_sass);
    gulp.watch('./public/**/*', livereload.changed);
});