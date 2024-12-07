import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import axios from 'axios'
const baseURL = 'https://jswater.jiangsu.gov.cn'
// const puppeteer = require('puppeteer-extra')
// const StealthPlugin = require('puppeteer-extra-plugin-stealth')
// puppeteer.use(StealthPlugin())

const Store = require('electron-store') // 用于存储重启次数
const store = new Store()

// async function fetchData(url) {
//   const browser = await puppeteer.launch({
//     headless: true // 设置为 false 可以看到浏览器执行过程
//   })
//   const page = await browser.newPage()
//   await page.setUserAgent(
//     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
//   )
//   await page.evaluateOnNewDocument(() => {
//     Object.defineProperty(navigator, 'webdriver', {
//       get: () => undefined,
//     })
//   })
//   // 访问目标网站
//   const response = await page.goto(url, {
//     waitUntil: 'networkidle2'
//   })

//   console.log('最终 URL:', response.url()) // 输出重定向后的 URL

//   // // 等待特定元素出现（如页面完全加载后的内容）
//   await page.waitForSelector('body')

//   // // 获取页面内容
//   const content = await page.content()
//   // 执行页面上的 JavaScript 并提取数据
//   // const data = await page.evaluate(() => {
//   //   return document.documentElement.innerHTML // 返回页面 HTML 内容
//   // })
//   // 关闭浏览器
//   await browser.close()
//   return content
// }

const axiosInstance = axios.create({
  baseURL,
})

axiosInstance.interceptors.response.use(
  (res) => {
    // console.log(res)
    return res
  },
  (error) => {
    const msg = error?.response?.data?.message || error?.message || error
    // console.log(msg)
    throw {
      ...error,
      msg
    }
  }
)

let isRestarting = false // 重启标志位
const MAX_RESTART_ATTEMPTS = 3 // 最大重启次数
const RESTART_KEY = 'restartCount' // 存储重启次数的 key

function getRestartCount() {
  return store.get(RESTART_KEY, 0) // 默认值为 0
}

function incrementRestartCount() {
  const count = getRestartCount() + 1
  store.set(RESTART_KEY, count) // 更新重启次数
}

function resetRestartCount() {
  store.delete(RESTART_KEY) // 删除重启次数
}

function restartApp() {
  const restartCount = getRestartCount()

  if (isRestarting) return // 避免重复重启
  if (restartCount >= MAX_RESTART_ATTEMPTS) {
    console.error('已达到最大重启次数，停止重启')
    return
  }

  isRestarting = true
  incrementRestartCount() // 增加重启次数

  console.error(`应用即将重启... 第 ${restartCount + 1} 次`)
  app.relaunch() // 重新启动应用
  app.exit()
}

ipcMain.on('renderer-crashed', (event, error) => {
  console.error('接收到渲染进程崩溃信号:', error)
  restartApp()
})

// 监听重置重启次数请求
ipcMain.on('reset-restart-count', () => {
  resetRestartCount() // 重置重启次数
  console.log('重启次数已重置')
})

// 捕获未处理的异常并重启应用
process.on('uncaughtException', (error) => {
  console.error('主进程发生未捕获的异常:', error)
  restartApp()
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason)
  restartApp()
})

let mainWindow
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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

  // 监听渲染进程的退出或崩溃
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('渲染进程已退出或崩溃:', details)

    if (details.reason === 'crashed') {
      console.log('检测到渲染进程崩溃，尝试重启窗口...')
      restartApp()
    }
  })

  // 监听子进程退出或崩溃
  mainWindow.webContents.on('child-process-gone', (event, details) => {
    console.error('子进程已退出:', details)

    if (details.type === 'GPU' && details.reason === 'crashed') {
      console.error('GPU 进程崩溃，尝试重启应用...')
      restartApp()
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
  // console.log(res)
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
  try {
    const res = await axiosInstance(baseURL + '/col/col54071/index.html')
    // console.log(res)
    const str = res.data || ''
    const href = str.match(/(?<=\<a\starget="_blank"\shref=")\/art\/.*\.html/)[0]
    // console.log(href)
    const url = baseURL + href
    const obj = await getDayWaterMsg(url)
    console.log(url, obj)
    return obj
  } catch (e) {
    console.log('错误：', e)
    return {
      errMsg: e.msg || '接口调用错误！'
    }
  }
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
  if (mainWindow) {
    mainWindow.destroy()
    mainWindow = null
  }
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