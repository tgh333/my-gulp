// プラグインを定数に代入
const gulp = require('gulp');
const sass = require('gulp-dart-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
// ローカルサーバー用プラグイン
const browserSync = require('browser-sync');
// CSS・JSファイル圧縮プラグイン
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const del = require('del');
const uglify = require('gulp-uglify');
// 画像圧縮プラグイン
const imagemin = require('gulp-imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const pngquant = require('imagemin-pngquant');
// 入出力するフォルダを指定
const srcPath = {
	'scss': './src/scss/**/*.scss',
	'html': './*.html',
	'js': './src/**/*.js',
	'img': './src/img/**/*'
};
const distPath = {
	'css': './dist/css/',
	'html': './dist/',
	'js': './dist/',
	'img': './dist/img/'
};
// Scssコンパイル用のタスク
const cssSass = () => {
	return gulp.src(srcPath.scss, {
		sourcemaps: true
	})
	.pipe(sass({ outputStyle: 'expanded' }))
	// ベンダープレフィックス付与
	.pipe(postcss([
		autoprefixer({
			cascade: false,
			grid: 'autoplace'
		})
	]))
	// メディアクエリをまとめる
	.pipe(postcss([mqpacker()]))
	.pipe(gulp.dest(distPath.css, { sourcemaps: './' }))
	// Scss用 ローカルサーバーリロード
	.pipe(browserSync.stream())
	.pipe(gulp.dest(distPath.css))
}
// HTMLを書き出すためのタスク
const html = () => {
	return gulp.src(srcPath.html)
	.pipe(gulp.dest(distPath.html))
}
const js = () => {
	return gulp.src(srcPath.js)
	.pipe(gulp.dest(distPath.js))
}
// ローカルサーバーの立ち上げ
const browserSyncFunc = () => {
	browserSync.init(browserSyncOption);
}
const browserSyncOption = {
	server: './dist/'
}
// ローカルサーバー リロード
const browserSyncReload = (done) => {
	browserSync.reload();
	done();
}
// CSSファイル圧縮用のタスク
const cssMin = () => {
	return gulp.src(distPath.css + '*.css')
	.pipe(cleanCSS())
	.pipe(rename({ suffix: '.min' }))
	.pipe(gulp.dest(distPath.css));
}
// clean タスク
const clean = () => {
	return del('./dist/**/*');
}
// JSファイル圧縮用のタスク
const jsMin = () => {
	return gulp.src(srcPath.js)
	.pipe(uglify())
	.pipe(rename({ suffix: '.min' }))
	.pipe(gulp.dest(distPath.js));
}
// 画像圧縮用のタスク
const minifyImage = () => {
	return (
		gulp.src(srcPath.img)
		.pipe(imagemin([
			imageminMozjpeg({ quality: 80 }),
			pngquant({
				quality: [0.6, 0.7],
				speed: 1,
			}),
			imagemin.svgo({
				plugins: [
					{ removeViewBox: true },
					{ cleanupIDs: false }],
				}),
			imagemin.gifsicle({
				interlaced: true,
				optimizationLevel: 3,
			}),
		]))
		.pipe(gulp.dest(distPath.img))
	);
}
// watch タスク
const watchFiles = () => {
	gulp.watch(srcPath.scss, gulp.series(cssSass))
	gulp.watch(srcPath.html, gulp.series(html, browserSyncReload))
	gulp.watch(srcPath.js, gulp.series(js, browserSyncReload))
	gulp.watch(srcPath.img, gulp.series(minifyImage, browserSyncReload))
}
// 開発段階 全タスク実行文
exports.default = gulp.series(
	clean,
	gulp.parallel(html, cssSass, minifyImage, js),
	gulp.parallel(watchFiles, browserSyncFunc),
);
// 提出段階 全タスク実行文
exports.prod = gulp.series(
	clean,
	gulp.parallel(html, cssSass, js),
	gulp.parallel(cssMin, jsMin, minifyImage)
);