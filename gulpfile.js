/**
 * Gulpfile
 * @author Richard Santos <rsantos@tray.com.br>
 */
'use strict';

const gulp = require('gulp');
const log = require('fancy-log');
const colors = require('ansi-colors');
const fs = require('fs');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const less = require('gulp-less');
const stylus = require('gulp-stylus');
const cleanCSS = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const bSync = require('browser-sync').create();
const uglify = require('gulp-uglify');
const yaml = require('js-yaml');
const process = require('process');
const spawn = require('cross-spawn');

/**
 * Get CLI args
 */
let FOLDER;
for (let i = process.argv.length; i > 0; i--) {
    let arg = process.argv[i];
    let nextArg = process.argv[i + 1];

    if (arg == '--folder' && nextArg) {
        FOLDER = process.cwd() + '/' + nextArg;
    }
}

if (!FOLDER) {
    let example = 'gulp --folder opencode.commercesuite.com.br';
    log(colors.red('Error: missing param: --folder, ex: ' + example));
    process.exit(1);
}

/**
 * Get OpenCode config file
 */
let configYML = FOLDER + '/config.yml';
let configOpenCode = yaml.load(fs.readFileSync(configYML, 'utf8'));
const URL = configOpenCode[':preview_url'];

if (!URL) {
    log(colors.red('Error: Did you configured opencode? Check your file: ' + configYML));
    process.exit(1);
}

const CSSPATH = FOLDER + '/css/';
const JSPATH = FOLDER + '/js/';
const IMGPATH = FOLDER + '/img/';
const autoprefixer = require('gulp-autoprefixer');


const taskSass = () => {
    gulp.src(CSSPATH + 'sass/theme.min.scss', { allowEmpty: true })
        .pipe(sass({errLogToConsole: true}))
        .on('error', log)
        .pipe(concat('theme.min.css'))
        .pipe(autoprefixer())
        .pipe(cleanCSS())
        .pipe(gulp.dest(CSSPATH));
}
gulp.task('sass', taskSass);

const taskLess = () => {
    gulp.src(CSSPATH + 'less/theme.min.less', { allowEmpty: true })
        .pipe(less())
        .pipe(concat('theme.min.css'))
        .pipe(autoprefixer())
        .pipe(cleanCSS())
        .pipe(gulp.dest(CSSPATH));
}
gulp.task('less', taskLess);

const taskStylus = () => {
    gulp.src(CSSPATH + 'stylus/theme.min.styl', { allowEmpty: true })
        .pipe(stylus())
        .pipe(concat('theme.min.css'))
        .pipe(autoprefixer())
        .pipe(cleanCSS())
        .pipe(gulp.dest(CSSPATH));
}
gulp.task('stylus', taskStylus);

const taskJS = () => {
    gulp.src(JSPATH + "modules/*.js", { allowEmpty: true })
        .pipe(concat("theme.min.js"))
        .pipe(uglify({"compress": false}))
        .pipe(gulp.dest(JSPATH));
}
gulp.task('js', taskJS);

let imageFiles = [
    IMGPATH + '**/*.{png,jpg,gif,svg}',
    '!'+ IMGPATH + 'dist/*'
];

gulp.task('imagemin', () => {
    gulp.src(imageFiles)
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{removeViewBox: false}]
		}))
		.pipe(gulp.dest(IMGPATH + 'dist/'));
});

gulp.task('bsync', () => {
    bSync.init({
        logPrefix: 'Tray Opencode',
        logFileChanges: false,
        open: 'external',
        proxy: {
            target: URL
        },
        reloadDelay: 800,
        port: 8081,
        https: true,
        files: FOLDER + '**/**',
    });
});

gulp.task('opencode', () => {
    process.chdir(FOLDER);

    let opencode = spawn('opencode', ['watch']);

    opencode.stdout.on('data', (data) => {
        let output = colors.green(data);
        if (data.indexOf('Error') > -1) {
            output = colors.bgRed(data);
        }
        process.stdout.write(output);
    });

    opencode.stderr.on('data', (data) => {
        process.stdout.write(colors.bgRed(data));
    });
});

gulp.task('watch', () => {
    gulp.watch(CSSPATH + 'sass/*', taskSass);
    gulp.watch(CSSPATH + 'less/*', taskLess);
    gulp.watch(CSSPATH + 'stylus/*', taskStylus);
    gulp.watch(JSPATH + 'modules/*.js', taskJS);
});

gulp.task('default', gulp.parallel(
    'watch',
    'opencode',
    'bsync', // comment this line if you're using remotes envs (Cloud 9, etc...)
    'sass',
    'less',
    'stylus',
    'js',
    // 'imagemin',
));
