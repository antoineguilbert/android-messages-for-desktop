//Constants
const path = require('path')
const electron = require('electron')
const fs = require('fs');

let loadedLanguage;
let app = electron.app;

module.exports = i18n;

function i18n() {
  // split locals like de-DE or en-US down to the first language code
  let local = app.getLocale().split("-")[0];
  if(fs.existsSync(path.join(__dirname, local + '.js'))) {
    loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, local + '.js'), 'utf8'));
  }else{
    loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, 'en.js'), 'utf8'));
  }
}

i18n.prototype.__ = function(phrase) {
  let translation = loadedLanguage[phrase]
  if(translation === undefined) {
       translation = phrase
  }
  return translation
}
