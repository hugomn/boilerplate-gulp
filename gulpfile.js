var gulp =  require('gulp');

var clean = require('gulp-clean');
var bower = require('main-bower-files');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var minifycss = require('gulp-minify-css');
var sass = require('gulp-sass');
var imagemin = require('gulp-imagemin');
var spawn = require('child_process').spawn;
var s3 = require("gulp-s3");
var fs = require("fs");
var node;

var bases = {
  app: 'app/',
  dist: 'dist/',
  settings: 'settings/'
};

var paths = {
  scripts:  ['js/*.js'],
  sass:     ['sass/**/*.scss','sass/*.scss'],
  css:      ['css/**/*.css', 'css/*.css'],
  images:   ['images/**/*', 'images/*'],
  html:     ['*.html']
};

// Delete the dist directory
gulp.task('clean', function() {
  return gulp.src(bases.dist)
  .pipe(clean());
});

// Create lib with bower dependencies
gulp.task('bower', ['clean'], function() {
  gulp.src(bower(), { base: 'bower_components' })
  .pipe(gulp.dest(bases.dist + 'lib'))
});

// Copy html files
gulp.task('html', ['clean'], function() {
  gulp.src(paths.html, {cwd: bases.app})
  .pipe(gulp.dest(bases.dist));
});

// Process scripts and concatenate them into one output file
gulp.task('scripts', ['clean'], function() {
  gulp.src(paths.scripts, {cwd: bases.app})
  .pipe(jshint())
  .pipe(jshint.reporter('default'))
  .pipe(uglify())
  .pipe(concat('app.min.js'))
  .pipe(gulp.dest(bases.dist + 'js/'));
});

// Copy css files
gulp.task('css', ['clean'], function() {
  gulp.src(paths.css, {cwd: bases.app})
  .pipe(gulp.dest(bases.dist + 'css'));
});

// Copy sass files
gulp.task('sass', ['clean'], function () {
  gulp.src(paths.sass, {cwd: bases.app})
  .pipe(sass())
  .pipe(rename({suffix: '.sass.min'}))
  .pipe(minifycss())
  .pipe(gulp.dest(bases.dist + 'css'));
});

// Copy images
gulp.task('images', ['clean'], function() {
  gulp.src(paths.images, {cwd: bases.app})
  .pipe(imagemin())
  .pipe(gulp.dest(bases.dist + 'images'));
});

// Lint Task
gulp.task('lint', function() {
  return gulp.src(paths.scripts, {cwd: bases.app})
  .pipe(jshint())
  .pipe(jshint.reporter('default'));
});


// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch([
      bases.app + paths.html,
      bases.app + paths.scripts,
      bases.app + paths.css,
      bases.app + paths.sass,
      bases.app + paths.images], ['build']);
});

// Launch the server. If there's a server already running, kill it.
gulp.task('server', function() {
  if (node) node.kill();
  node = spawn('node', ['app.js'], {stdio: 'inherit'})
  node.on('close', function (code) {
    if (code === 8) {
      console.log('Error detected, waiting for changes...');
    }
  });
});

// Deploy dist files do amazon s3
gulp.task('deploy', function() {
  aws = JSON.parse(fs.readFileSync(bases.settings + '/aws.json'));
  return gulp.src(bases.dist + '**')
  .pipe(s3(aws));
});

// Main build task
gulp.task('build', ['clean', 'lint', 'bower', 'html', 'scripts', 'sass', 'css', 'images']);

// Build and watch for changes as the default task
gulp.task('default', ['build', 'watch']);
