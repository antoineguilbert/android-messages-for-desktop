const { appId } = require('./package.json');
const { isMac, isWindows } = require('./environment');
const appIndicator = require('./appIndicator');

//Constants
const {app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');
const windowStateKeeper = require('electron-window-state');

let mainWindow

// Set App ID for Windows
if (isWindows) {
  app.setAppUserModelId(appId);
}

//Creating the window
function createWindow () {

  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 720
  });

  const windowOptions = {
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    title: app.getName(),
    icon: path.join(__dirname, '/icons/png/512.png'),
    autoHideMenuBar: true,
  }

  mainWindow = new BrowserWindow(windowOptions)
  //mainWindow.webContents.openDevTools();

  mainWindow.loadURL(url.format({
   pathname: path.join('messages.android.com'),
   protocol: 'https:',
   slashes: true
  }))

  // Initialize appIndicator
  appIndicator(mainWindow);

  mainWindow.on('closed', () => {
   mainWindow = null
  });

 mainWindowState.manage(mainWindow);
}

//Creating the menu
function createMenu (){
  var i18n = new(require('./translations/i18n'));

  const template = [
    {
    label: i18n.__('Edit'),
    submenu: [
      {label: i18n.__('Copy'),role: 'copy'},
      {label: i18n.__('Paste'),role: 'paste'},
      {label: i18n.__('Select all'),role: 'selectall'},
      {type: 'separator'},
      {label: i18n.__('Reload'),accelerator: 'CmdOrCtrl+R', click (item, focusedWindow) {if (focusedWindow) focusedWindow.reload()}},
      ]
    },
    {
      label: i18n.__('Window'),
      role: 'window',
      submenu: [
        {label: i18n.__('Minimize'),role: 'minimize'},
        {label: i18n.__('Quit'),role: 'close'}
      ]
    }
  ]

  if (isMac) {
    const name = app.getName()
    template.unshift({
      label: name,
      submenu: [
        {label: i18n.__('About'),role: 'about'},
        {type: 'separator'},
        {label: i18n.__('Disconnect account'), click () { clearAppCache(); }},
        {type: 'separator'},
        {label: i18n.__('Hide')+' '+name,role: 'hide'},
        {label: i18n.__('Hide others'),role: 'hideothers'},
        {label: i18n.__('Unhide'),role: 'unhide'},
        {type: 'separator'},
        {label: i18n.__('Quit'),role: 'quit'}
      ]
    })
    
    template[2].submenu = [
      {label: i18n.__('Minimize'),accelerator: 'CmdOrCtrl+M',role: 'minimize'},
      {label: i18n.__('Zoom'),role: 'zoom'}
    ]
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

//Function to clear the cache app
function clearAppCache() {
  var session = mainWindow.webContents.session;
  session.clearStorageData(function () {
    session.clearCache(function () {
      mainWindow.loadURL(url.format({
       pathname: path.join('messages.android.com'),
       protocol: 'https:',
       slashes: true
      }))
    });
  });
};

//When the app is ready
app.on('ready', function(){
  createWindow();
  createMenu();
});

//Full closure of the app
app.on('window-all-closed', function () {
  if (isMac) {
    app.quit()
  }
})

///Creating a new window
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
