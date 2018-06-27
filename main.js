//Customize for Windows
const setupEvents = require('./installers/setupEvents')
if (setupEvents.handleSquirrelEvent()) {return;}

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
    icon: path.join(__dirname, '/icons/png/512.png')
  }

  mainWindow = new BrowserWindow(windowOptions)
  //mainWindow.webContents.openDevTools();
  //mainWindow.webContents.executeJavaScript("var elements = document.getElementsByTagName('link'); while (elements[0]) elements[0].parentNode.removeChild(elements[0])");

  mainWindow.loadURL(url.format({
   pathname: path.join('messages.android.com'),
   protocol: 'https:',
   slashes: true
  }))

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
    label: 'Edition',
    submenu: [
      {label:'Copier',role: 'copy'},
      {label:'Coller',role: 'paste'},
      {label:'Tout sélectionner',role: 'selectall'},
      {type: 'separator'},
      {label:'Recharger',accelerator: 'CmdOrCtrl+R',click (item, focusedWindow) {if (focusedWindow) focusedWindow.reload()}},
      ]
    },
    {
      label: 'Fenêtre',
      role: 'window'
    }
  ]

  if (process.platform === 'darwin') {
    const name = app.getName()
    template.unshift({
      label: name,
      submenu: [
        {label:'À propos',role: 'about'},
        {type: 'separator'},
        {label:'Déconnecter le compte', click: function click() {clearAppCache(); }},
        {type: 'separator'},
        {label:'Masquer '+name,role: 'hide'},
        {label:'Masquer les autres',role: 'hideothers'},
        {label:'Tout afficher',role: 'unhide'},
        {type: 'separator'},
        {label:'Quitter',role: 'quit'}
      ]
    })

    template[1].submenu.push()

    template[2].submenu = [
      {label: 'Réduire',accelerator: 'CmdOrCtrl+M',role: 'minimize'},
      {label: 'Agrandir',role: 'zoom'}
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
