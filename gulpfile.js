var http	  = require('http')

var gulp	  = require('gulp');
var babel	  = require('gulp-babel');

var browserify	  = require('browserify');
var babelify	  = require('babelify');
var source	  = require('vinyl-source-stream');

// Connect with static and livereload script injection middlware.
var connect	  = require('connect')
var static	  = require('serve-static')
var reload_inject = require('connect-livereload') 

// The server implementing the live reload protocol, watches a dir for changes
// leading to triggering live reload.
var livereload	  = require('livereload') 


gulp.task('build', function () {
  return gulp.src('src/*.js') 
	  .pipe(babel({ presets : ['env'] }))
	  .pipe(gulp.dest('build/'));
});


gulp.task('bundle', function () {
  return browserify('src/browser/app.js')
	  .transform('babelify', {presets: ['env']})
	  .external(['jquery', 'underscore', 'backbone'])
	  .bundle()
	  .pipe(source('app.js'))
	  .pipe(gulp.dest('public/js/'));
});


// Create 'require' bundles for jQuery, Underscore and Backbone. These represent
// modules that are static.
gulp.task('bundle-vendor', function () {
  return browserify()
	  .require(['jquery', 'underscore', 'backbone'])
	  .bundle()
	  .pipe(source('vendor.js'))
	  .pipe(gulp.dest('public/js/'));
});


// Start a static file server that can react/interact with live reload server.
gulp.task('start-static', function (cb) {
  var app = connect(),
      fileserver; 

  // inject the live reload link to our static files(index.html)
  app.use(reload_inject({
    port : 35729 
  }));

  // use the serve-static middleware to serve static files. Document root at
  // public directory.
  app.use(static('public/'));

  fileserver = http.createServer(app);

  fileserver.listen(3000, function () {
    console.log('File server bounded to port 3000...');
    cb();
  });
});


// Start a livereload server. Triggers livereload on changes within document
// root.
gulp.task('start-livereload-server', ['start-static'], function (cb) {
  var lrServer = livereload.createServer();

  lrServer.watch('public/');
  cb();
});


gulp.task('watch', function () {
  gulp.watch('*.js', {cwd : 'src'}, ['build']);
  gulp.watch('browser/*.js',{cwd : 'src'}, ['bundle']);
});


// start-livereload-server task waits for our static web server to start first.
gulp.task('default', ['start-livereload-server', 'watch']);
