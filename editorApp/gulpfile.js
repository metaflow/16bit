var gulp = require('gulp'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    tsify = require('tsify'),
    fancy_log = require('fancy-log'),
    watchify = require("watchify"),
    gutil = require("gulp-util"),
    wait = require("gulp-wait"),
    livereload = require('gulp-livereload');

var br = browserify({
    basedir: '.',
    debug: true, // Setting to false removes the source mapping data.
    entries: [
        // TS files to transpile and bundle.
        'client/editor.ts',
    ],
    cache: {},
    packageCache: {}
}).plugin(tsify);

var watch = watchify(br);

function bundle() {
    return br
        .bundle()
        .on('error', fancy_log)
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./public/javascripts'));
}

function watch_bundle() {
    return watch
        .bundle()
        .on('error', fancy_log)
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./public/javascripts'))
        .pipe(wait(1000))
        .pipe(livereload());
}

gulp.task('default', bundle);
gulp.task('bundle', bundle);
gulp.task('watch', function() {
    watch.on("update", watch_bundle);
    watch.on("log", gutil.log);
    livereload.listen();
    watch_bundle();
    // gulp.watch('client/*.ts', watch_bundle);
});
