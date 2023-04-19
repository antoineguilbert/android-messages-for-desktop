//Constants
const electron = require('electron');
const path = require('path');
const url = require('url');
const windowStateKeeper = require('electron-window-state');
const { app, BrowserWindow, Menu, MenuItem, dialog, nativeTheme } = electron;
const { autoUpdater } = require('electron-updater');

let mainWindow
let i18n

let manualUpdate

autoUpdater.autoDownload = false

//Creating the window
function createWindow () {

  i18n = new(require('./translations/i18n'));
  manualUpdate = false

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
	webPreferences: {
		nodeIntegration: false,
	},
  }

  mainWindow = new BrowserWindow(windowOptions)
  //mainWindow.webContents.openDevTools();

  // set user agent to potentially make google fi work
  const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:108.0) Gecko/20100101 Firefox/108.0";

mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
  {
    urls: ["https://accounts.google.com/*"],
  },
  ({ requestHeaders }, callback) =>
    callback({
      requestHeaders: { ...requestHeaders, "User-Agent": userAgent },
    })
);

  mainWindow.loadURL(url.format({
   pathname: path.join('messages.google.com/web'),
   protocol: 'https:',
   slashes: true
  }))

  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    electron.shell.openExternal(url);
  })

  nativeTheme.on('updated', () => {
      mainWindow.webContents.send(EVENT_UPDATE_USER_SETTING, {
        useDarkMode: nativeTheme.shouldUseDarkColors
      });
  });

  //When a SMS arrived in the app, change the badge
  if (process.platform === 'darwin') {
    mainWindow.on('page-title-updated', function (e, title) {
      var messages = countMessages(title);
      if (messages) {
        app.dock.setBadge(messages);
      } else {
        app.dock.setBadge('');
      }
    });
  }

  mainWindow.on('closed', () => {
   mainWindow = null
 });

 mainWindowState.manage(mainWindow);
}

//Creating the menu
function createMenu (){
  const template = [
    {
    label: i18n.__('Edit'),
    submenu: [
      {label: i18n.__('Copy'),role: 'copy'},
      {label: i18n.__('Paste'),role: 'paste'},
      {label: i18n.__('Select all'),role: 'selectall'},
      {type: 'separator'},
      {label: i18n.__('Reload'),accelerator: 'CmdOrCtrl+R',click (item, focusedWindow) {if (focusedWindow) focusedWindow.reload()}},
      ]
    },
    {
      label: i18n.__('Window'),
      role: 'window'
    },
    {
      label: '?',
      submenu: [
        {label: i18n.__('About'),role: 'about'},
        {label: i18n.__('Update'), click: function click() { manualUpdate = true; autoUpdater.checkForUpdates(); }},
        { role: 'toggledevtools' },
      ]
    }
  ]

  if (process.platform === 'darwin') {
    const name = app.getName()
    template.unshift({
      label: name,
      submenu: [
        {label: i18n.__('About'),role: 'about'},
        //{label: i18n.__('Update'), click: function click() { manualUpdate = true; autoUpdater.checkForUpdates(); }},
        {type: 'separator'},
        {label: i18n.__('Settings'), accelerator: 'CmdOrCtrl+S',click: function click(){ 
          mainWindow.loadURL(url.format({
            pathname: path.join('messages.google.com/web/settings'),
            protocol: 'https:',
            slashes: true
           }));
        }},
        {label: i18n.__('Disconnect account'),accelerator: 'CmdOrCtrl+D', click: function click() {clearAppCache(); }},
        {type: 'separator'},
        {label: i18n.__('Hide')+' '+name,role: 'hide'},
        {label: i18n.__('Hide others'),role: 'hideothers'},
        {label: i18n.__('Unhide'),role: 'unhide'},
        {type: 'separator'},
        {label: i18n.__('Quit'),role: 'quit'}
      ]
    })

    template[1].submenu.push()

    template[2].submenu = [
      {label: i18n.__('Minimize'),accelerator: 'CmdOrCtrl+M',role: 'minimize'},
      {label: i18n.__('Zoom'),role: 'zoom'},
      {type: 'separator'},
      { role: 'toggledevtools' }
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
       pathname: path.join('messages.google.com/web'),
       protocol: 'https:',
       slashes: true
      }))
    });
  });
};

//Fonction to get the number of notifications
function countMessages(title) {
  var itemCountRegex = /[([{]([\d.,]*)\+?[}\])]/;
  var match = itemCountRegex.exec(title);
  return match ? match[1] : undefined;
}

//When the app is ready
app.on('ready', function(){
  createWindow();
  createMenu();
  if( process.platform === 'win32') {
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAutoHideMenuBar(true);
  }
  
  autoUpdater.checkForUpdates();
});

//Full closure of the app
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

///Creating a new window
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

/// Auto Updater
autoUpdater.on('error', function (error) {
  dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
})

autoUpdater.on('update-available', function () {
  dialog.showMessageBox({
    type: 'info',
    title: i18n.__('FoundUpdate'),
    message: i18n.__('UpdateFounded'),
    buttons: [i18n.__('Yes')+' ('+i18n.__('DownloadInBackground')+')', i18n.__('No')]
  }, (buttonIndex) => {
    if (buttonIndex === 0) {
      if(process.platform === 'darwin') {
        electron.shell.openExternal('https://github.com/antoineguilbert/android-messages-for-desktop/releases/latest');
      } else {
        autoUpdater.downloadUpdate()
      }
    }
  })
})

autoUpdater.on('update-not-available', function () {
  if(manualUpdate === true) {
    dialog.showMessageBox({
      title: i18n.__('NoUpdate'),
      message: i18n.__('NoUpdateAvailable')
    })
  }
})

autoUpdater.on('update-downloaded', function () {
  dialog.showMessageBox({
    title: i18n.__('Update'),
    message: i18n.__('UpdateDownloaded')
  }, function () {
    setImmediate(() => autoUpdater.quitAndInstall())
  })
})