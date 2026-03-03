const path = require('node:path')
const fs = require('node:fs/promises')
const packageJson = require('./package.json')
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')

const parseGithubRepo = (repository) => {
  if (!repository) {
    return null
  }

  const repositoryUrl = typeof repository === 'string' ? repository : repository.url
  if (!repositoryUrl) {
    return null
  }

  const matched = repositoryUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/i)
  if (!matched) {
    return null
  }

  return { owner: matched[1], name: matched[2] }
}

const normalizeVersion = (version) => String(version || '').trim().replace(/^v/i, '')

const isNewerVersion = (latest, current) => {
  const latestSegments = normalizeVersion(latest).split('.').map((segment) => Number.parseInt(segment, 10) || 0)
  const currentSegments = normalizeVersion(current).split('.').map((segment) => Number.parseInt(segment, 10) || 0)
  const length = Math.max(latestSegments.length, currentSegments.length)

  for (let index = 0; index < length; index += 1) {
    const latestNumber = latestSegments[index] || 0
    const currentNumber = currentSegments[index] || 0

    if (latestNumber > currentNumber) {
      return true
    }

    if (latestNumber < currentNumber) {
      return false
    }
  }

  return false
}

const checkGithubReleaseUpdate = async () => {
  const repository = parseGithubRepo(packageJson.repository)
  if (!repository) {
    return
  }

  const endpoint = `https://api.github.com/repos/${repository.owner}/${repository.name}/releases/latest`
  const response = await fetch(endpoint, {
    headers: {
      'User-Agent': `${app.getName()}/${app.getVersion()}`,
      Accept: 'application/vnd.github+json'
    }
  })

  if (!response.ok) {
    return
  }

  const release = await response.json()
  const latestVersion = normalizeVersion(release.tag_name)
  const currentVersion = normalizeVersion(app.getVersion())

  if (!latestVersion || !isNewerVersion(latestVersion, currentVersion)) {
    return
  }

  const selected = await dialog.showMessageBox({
    type: 'info',
    title: '发现新版本',
    message: `检测到新版本 v${latestVersion}（当前版本 v${currentVersion}）`,
    detail: '点击“立即下载”后会打开 GitHub Release 页面，请下载安装包完成更新。',
    buttons: ['立即下载', '稍后'],
    defaultId: 0,
    cancelId: 1
  })

  if (selected.response === 0 && release.html_url) {
    shell.openExternal(release.html_url)
  }
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadFile('index.html')
}

ipcMain.handle('scores:import', async () => {
  const result = await dialog.showOpenDialog({
    title: '导入积分文件',
    properties: ['openFile'],
    filters: [{ name: '文本文件', extensions: ['txt'] }]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true }
  }

  const content = await fs.readFile(result.filePaths[0], 'utf-8')
  return { canceled: false, content, filePath: result.filePaths[0] }
})

ipcMain.handle('scores:export', async (_event, payload) => {
  const content = typeof payload?.content === 'string' ? payload.content : ''
  const defaultPath = typeof payload?.defaultPath === 'string' ? payload.defaultPath : '积分数据.txt'

  const result = await dialog.showSaveDialog({
    title: '导出积分文件',
    defaultPath,
    filters: [{ name: '文本文件', extensions: ['txt'] }]
  })

  if (result.canceled || !result.filePath) {
    return { canceled: true }
  }

  await fs.writeFile(result.filePath, content, 'utf-8')
  return { canceled: false, filePath: result.filePath }
})

app.whenReady().then(() => {
  if (app.isPackaged) {
    checkGithubReleaseUpdate().catch(() => {})
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
