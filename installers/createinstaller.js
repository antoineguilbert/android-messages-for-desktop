const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  const rootPath = path.join('./')
  const outPath = path.join(rootPath, 'build/windows/')

  return Promise.resolve({
    appDirectory: path.join(outPath, 'Android-Messages-win32-ia32'),
    outputDirectory: path.join(rootPath, 'build/windows/installer/'),
    authors: 'Antoine Guilbert',
    noMsi: true,
    exe: 'android-messages.exe',
    setupExe: 'AndroidMessagesInstaller.exe',
    setupIcon: path.join(rootPath, 'icons', 'win', 'icon.ico')
  })
}
