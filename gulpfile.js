'use strict';
const gulp = require('gulp');
const pkg = require('./package.json');
const path = require('path');
const fs = require('fs');
const del = require('del');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cssmin = require('gulp-cssmin');
const importOnce = require('node-sass-import-once');
const stylemod = require('gulp-style-modules');
const browserSync = require('browser-sync').create();

/**
 * TASK: `$ gulp sass`
 * Builds SCSS files into CSS files
 */

const sassOptions = {
  importer: importOnce,
  importOnce: {
    index: true,
    bower: true
  }
};

const autoprefixerOptions = {
  browsers: ['last 2 versions'],
  cascade: false,
  flexbox: false
};

const stylemodOptions = {
  moduleId: file => path.basename(file.path, path.extname(file.path)) + '-styles'
};

gulp.task('sass:clean', function() {
  return del(['./css/**/*']);
});

gulp.task('sass:build', function() {
  return gulp.src(['./sass/*.scss'])
    .pipe(sass(sassOptions))
    .pipe(autoprefixer(autoprefixerOptions))
    .pipe(cssmin())
    .pipe(stylemod(stylemodOptions))
    .pipe(gulp.dest('./css'))
});

gulp.task('sass', ['sass:clean', 'sass:build']);

/**
 * TASK: `$ gulp watch`
 * Watches for changes to SCSS files and continuously rebuilds CSS files.
 * Use this if you want to run your own server, or use the serve task to run
 * a server and rebuild CSS files.
 */

gulp.task('watch', function() {
  gulp.watch(['*.scss', 'sass/*.scss'], ['sass']);
});

/**
 * TASK: `$ gulp serve`
 * Starts a web server to serve the demo. Continuously refreshes and rebuilds
 * the SCSS files into CSS file using BrowserSync.
 */

gulp.task('serve', function() {
  browserSync.init({
    port: 8080,
    notify: false,
    reloadOnRestart: true,
    logPrefix: `${pkg.name}`,
    https: false,
    server: ['./', 'bower_components'],
  });

  gulp.watch(['css/*-styles.html', '*.html', '*.js', 'demo/*.html']).on('change', browserSync.reload);
  gulp.watch(['*.scss', 'sass/*.scss'], ['sass']);
});

/**
 * TASK: `$ gulp bump:*`
 * Bumps the version number in the bower.json and package.json to prepare for
 * a new release.
 */

gulp.task('bump:patch', function() {
  gulp.src(['./bower.json', './package.json'])
  .pipe(bump({type:'patch'}))
  .pipe(gulp.dest('./'));
});

gulp.task('bump:minor', function() {
  gulp.src(['./bower.json', './package.json'])
  .pipe(bump({type:'minor'}))
  .pipe(gulp.dest('./'));
});

gulp.task('bump:major', function() {
  gulp.src(['./bower.json', './package.json'])
  .pipe(bump({type:'major'}))
  .pipe(gulp.dest('./'));
});

/**
 * TASK: `$gulp generate:*`
 * Parses the colors SCSS file and generates a JSON file and web component
 * with the values.
 */

const read = filePath => new Promise((resolve, reject) => {
  fs.readFile(filePath, 'utf8', (err, text) => {
    if (err) reject(err);
    resolve(text);
  });
});

const write = (filePath, text) => new Promise((resolve, reject) => {
  fs.writeFile(filePath, text, 'utf8', err => {
    if (err) reject(err);
    resolve();
  });
});

/**
 * Given a single line of SCSS, attempts to find the SCSS variable name and
 * value in that line. Returns `null` if none found.
 * @param  {string} line
 * @return {Array<string>?} - Array of [varName,varValue], or null if no variable found
 */
function findScssVariableInLine(line) {
  const lineIsVarRe = /\$(.*?):(.*?);/g;
  const varNameRe = /\$(.*?)\s*\:/g
  const varValueRe = /\:\s*(.*?)\s*\;/g;
  if (lineIsVarRe.test(line)) {
    const varNameMatch = varNameRe.exec(line);
    const varValueMatch = varValueRe.exec(line);
    return [varNameMatch[1], varValueMatch[1]];
  }
}

async function parseScssVariables() {
  const scssSource = await read(path.resolve(__dirname, '_settings.colors.scss'));
  const lines = scssSource.split('\n');
  const rawVariables = lines.map(findScssVariableInLine).filter(Array.isArray);
  // Flatten color variables that refer to other color variables into real CSS values
  const scssMap = rawVariables.reduce((acc, [name, val]) => {
    acc[`$${name}`] = val;
    return acc;
  }, {});
  return rawVariables.map(([name, val]) => val[0] === '$' ? [name, scssMap[val]] : [name, val]);
}

/**
 * Creates a 'colors-shared-styles.html' file with a dom-module containing
 * all the colors as CSS variables.
 * @param  {[string,string][]} scssVariables
 */
async function createSharedStylesModule(scssVariables) {
  const cssVariables = scssVariables.map(([name, val]) => `--px-${name}: ${val};`);
  const html = `
<dom-module id="colors-shared-styles">
  <template>
    <style>
      html {
        ${cssVariables.join('\n        ')}
      }
    </style>
  </template>
</dom-module>
  `.trim();
  await write(path.resolve(__dirname, 'colors-shared-styles.html'), html);
}

/**
 * Creates a 'colors.json' file with all the colors.
 * @param  {[string,string][]} scssVariables
 */
async function createColorsJSON(scssVariables) {
  const o = scssVariables.reduce((acc, [name, val]) => Object.assign({}, acc, { [name] : val }), {});
  const stringyJSON = JSON.stringify(o, null, '  ');
  await write(path.resolve(__dirname, 'colors.json'), stringyJSON);
}

gulp.task('generate:module', function() {
  return parseScssVariables().then(createSharedStylesModule);
});

gulp.task('generate:json', function() {
  return parseScssVariables().then(createColorsJSON);
});

gulp.task('generate', ['generate:module', 'generate:json']);

/**
 * DEFAULT TASK: `$ gulp`
 * Builds SCSS files into CSS files
 */

gulp.task('default', ['sass', 'generate']);
