var gulp = require('gulp');
// var sourcemaps = require('gulp-sourcemaps');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var tsify = require('tsify');
var fancy_log = require('fancy-log');

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


function bundle() {
  return br
    .bundle()
    .on('error', fancy_log)
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./public/javascripts'));
}

gulp.task('default', bundle);