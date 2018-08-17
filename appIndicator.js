const { app } = require('electron');
const { isWindows, isMac } = require('./environment.js');
const path = require('path');

/**
 * Function to calculate taskbar image path.
 * @param {string} asset filename of the image.
 * @returns {string} path to image.
 */
function getAsset(asset) {
  return path.join(
    __dirname, 'assets', 'images', 'taskbar', process.platform, `${asset}.ico`,
  );
}

/** 
 * Function to get the number of notifications
 * @param {string} title
 * @returns {number} number of notifications or undefined
 */
function countMessages(title) {
  var itemCountRegex = /[([{]([\d.,]*)\+?[}\])]/;
  var match = itemCountRegex.exec(title);
  return match ? (parseInt(match[1], 10) || 0) : undefined;
}

/** @module appIndicator */
module.exports = init;
/**
 * @param {Electron.BrowserWindow} mainWindow
 */
function init(mainWindow) {

  //When a SMS arrived in the app, change the badge
  mainWindow.on('page-title-updated', function (e, title) {
    var indicator = countMessages(title);
    if (isMac && indicator) {
        app.setBadgeCount(indicator);
    }
    // On windows we do a taskbar flash, to inform the user something new happened. Badges on windows currently not supported bei electron.
    if (isWindows) {
      if (indicator && indicator > 0) {
          //mainWindow.flashFrame(true);
          mainWindow.setOverlayIcon(getAsset(indicator >= 10 ? 10 : indicator), '');
      } else {
        //mainWindow.flashFrame(false);
        mainWindow.setOverlayIcon(null, '');
      }
    }
  });
};