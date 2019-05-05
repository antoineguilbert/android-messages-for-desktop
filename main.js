//Constants
const electron = require('electron');
const path = require('path');
const url = require('url');
const windowStateKeeper = require('electron-window-state');
const {app, BrowserWindow, Menu, MenuItem} = electron;

let mainWindow

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
	webPreferences: {
		nodeIntegration: false,
	},
  }

  mainWindow = new BrowserWindow(windowOptions)
  //mainWindow.webContents.openDevTools();

  mainWindow.loadURL(url.format({
   pathname: path.join('messages.google.com/web'),
   protocol: 'https:',
   slashes: true
  }))

  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    electron.shell.openExternal(url);
  })

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
  var i18n = new(require('./translations/i18n'));

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
    }
  ]

  if (process.platform === 'darwin') {
    const name = app.getName()
    template.unshift({
      label: name,
      submenu: [
        {label: i18n.__('About'),role: 'about'},
        {type: 'separator'},
        {label: i18n.__('Disconnect account'), click: function click() {clearAppCache(); }},
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
  if (process.platform === 'darwin') {
    createMenu();
  }
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
