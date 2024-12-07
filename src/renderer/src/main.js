import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')

window.onerror = (message, source, lineno, colno, error) => {
  console.error('捕获渲染进程错误:', error)
  // 通知主进程重启
  require('electron').ipcRenderer.send('renderer-crashed', error)
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason)
  require('electron').ipcRenderer.send('renderer-crashed', event.reason)
})

// console.log(window)
