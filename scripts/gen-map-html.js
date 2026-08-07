// Generates android/app/src/main/assets/map.html from the map page template.
// The template contains __CSS__ and __JS__ placeholders for the bundled
// Leaflet CSS/JS found in scripts/map-assets/.
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, 'map-assets', 'leaflet.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'map-assets', 'leaflet.js'), 'utf8');
const tpl = fs.readFileSync(path.join(__dirname, 'map-page.html'), 'utf8');

const html = tpl
  .replace('__CSS__', css)
  .replace('__JS__', js);

const out = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'map.html');
fs.writeFileSync(out, html);

const ts =
  '/* eslint-disable */\n' +
  '// Auto-generated from android/app/src/main/assets/map.html (run scripts/gen-map-html.js to regenerate)\n' +
  'export const MAP_HTML: string = ' + JSON.stringify(html) + ';\n';
const tsOut = path.join(__dirname, '..', 'src', 'map', 'mapHtml.ts');
fs.writeFileSync(tsOut, ts);
console.log('map.html written:', html.length, 'bytes; mapHtml.ts written:', ts.length, 'bytes');
