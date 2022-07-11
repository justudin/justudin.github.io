const gulp = require('gulp');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const del = require('del');
const webp = require('gulp-webp');
const htmlmin = require('gulp-htmlmin');

// Concat and minify CSS files
gulp.task('build-css', () => {
    return gulp.src('src/css/*.css')
    .pipe(concat('academic-page.css'))
    .pipe(cleanCSS({debug: true}, (details) => {
        console.log(`${details.name}: ${details.stats.originalSize}`);
        console.log(`${details.name}: ${details.stats.minifiedSize}`);
      }))
    .pipe(gulp.dest('public'));
});

// Concat and minify libraries JS files
gulp.task('build-vendor-js', function () {
    return gulp.src(['src/js/libs/*.js'])
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest('public/js'));
});

// minify academic-page.js
gulp.task('build-js', function () {
    return gulp.src(['src/js/academic-page.js'])
        .pipe(concat('academic-page.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/js'));
});

gulp.task('build-img', () =>
    gulp.src('src/img/*.jpg')
        .pipe(webp())
        .pipe(gulp.dest('public/img'))
);

gulp.task('build-html', () =>
    gulp.src('src/*.html')
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('public'))
);

gulp.task('clean', async () => {
   return del.sync('public');
});

// Start session
gulp.task("session-start", (cb) => {
    return gulp.series('clean', 'build-css', 'build-vendor-js', 'build-js', 'build-img', 'build-html')(cb);
});

gulp.task('default', gulp.series('session-start'));