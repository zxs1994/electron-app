import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'https://jswater.jiangsu.gov.cn'
})

axiosInstance.interceptors.response.use(
  (res) => {
    // console.log(res)
    return res
  },
  (error) => {
    const msg = error?.response?.data?.message || error?.message || error
    console.log(error, msg)
    throw {
      ...error,
      msg
    }
  }
)

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 1000,
    // frame: false,
    // titleBarStyle: 'hidden',
    show: false,
    autoHideMenuBar: true,
    // minimizable: false,
    // closable: false,
    minHeight: 820,
    minWidth: 820,
    // useContentSize: true,
    // alwaysOnTop: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  (function () {
    setInterval(() => {
      mainWindow.webContents.send('timedTask')
    }, 1000 * 60)
  })()
}
async function getDayWaterMsg(url) {
  // console.log(url)
  const res = await axiosInstance(url)
  // console.log(res.data)
  const str = res.data || ''
  // console.log(str)
  const text = (str.match(/(?<=\<meta\sname="Description"\scontent=").*(?="\>)/) || [])[0]
  const num = (text.match(/(?<=洪泽湖平均水位)\d+(\.\d+)?(?=米)/) || [])[0]
  const time = (str.match(/(?<=\<meta\sname="PubDate"\scontent=").*(?="\>)/) || [])[0]
  return {
    time,
    num
  }
}
async function getData() {
  const res = await axiosInstance('/col/col54071/index.html')
  // console.log(res.data)
  const str = res.data || ''
  const href = str.match(/(?<=\<a\starget="_blank"\shref=")\/art\/.*\.html/)[0]
  const url = href
  // console.log(url)
  const obj = await getDayWaterMsg(url)
  console.log(obj)
  return obj
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle('getData', getData)
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

//应用是否打包
if (app.isPackaged) {
  //设置开机启动
  app.setLoginItemSettings({
    openAtLogin: true
  })
}