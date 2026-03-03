let students = []
let className = '班级'
let prizes = []

const elements = {
  classTitle: document.getElementById('classTitle'),
  studentGrid: document.getElementById('studentGrid'),
  rankButton: document.getElementById('rankButton'),
  rankModal: document.getElementById('rankModal'),
  rankList: document.getElementById('rankList'),
  importButton: document.getElementById('importButton'),
  exportButton: document.getElementById('exportButton'),
  setupButton: document.getElementById('setupButton'),
  resetButton: document.getElementById('resetButton'),
  setupModal: document.getElementById('setupModal'),
  setupPrompt: document.getElementById('setupPrompt'),
  startSetup: document.getElementById('startSetup'),
  classNameInput: document.getElementById('className'),
  studentNamesInput: document.getElementById('studentNames'),
  saveSetup: document.getElementById('saveSetup'),
  prizeButton: document.getElementById('prizeButton'),
  prizeModal: document.getElementById('prizeModal'),
  prizeName: document.getElementById('prizeName'),
  prizeCost: document.getElementById('prizeCost'),
  addPrize: document.getElementById('addPrize'),
  prizeList: document.getElementById('prizeList'),
  redeemModal: document.getElementById('redeemModal'),
  redeemStudentInfo: document.getElementById('redeemStudentInfo'),
  redeemPrizeList: document.getElementById('redeemPrizeList')
}

function openModal(modalElement) {
  modalElement.classList.add('is-open')
}

function closeModal(modalElement) {
  modalElement.classList.remove('is-open')
}

function showSetupPrompt() {
  elements.setupPrompt.classList.remove('is-hidden')
}

function hideSetupPrompt() {
  elements.setupPrompt.classList.add('is-hidden')
}

function initEventListeners() {
  elements.rankButton.addEventListener('click', showRanking)
  elements.importButton.addEventListener('click', importScores)
  elements.exportButton.addEventListener('click', exportScores)
  elements.setupButton.addEventListener('click', showSetupModal)
  elements.resetButton.addEventListener('click', resetSystem)
  elements.startSetup.addEventListener('click', showSetupModal)
  elements.saveSetup.addEventListener('click', saveClassSetup)

  elements.prizeButton.addEventListener('click', showPrizeModal)
  elements.addPrize.addEventListener('click', addNewPrize)

  document.querySelectorAll('.close').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeModal(btn.closest('.modal'))
    })
  })

  window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
      closeModal(event.target)
    }
  })
}

function calculateSymbols(score) {
  let remaining = score
  const suns = Math.floor(remaining / 25)
  remaining %= 25
  const moons = Math.floor(remaining / 5)
  remaining %= 5
  const stars = remaining
  return { suns, moons, stars }
}

function renderStudents() {
  elements.studentGrid.innerHTML = ''

  if (students.length === 0) {
    showSetupPrompt()
    return
  }

  hideSetupPrompt()

  students.forEach((student, index) => {
    const card = document.createElement('div')
    card.className = 'student-card'

    const { suns, moons, stars } = calculateSymbols(student.score)

    card.innerHTML = `
      <div class="student-id">${index + 1}号</div>
      <div class="student-name">${student.name}</div>
      <div class="jar-container" id="jar-${index}"></div>
      <div class="score">${student.score}颗星</div>
      <div class="button-container">
        <button class="score-button minus-button" data-index="${index}">-</button>
        <button class="score-button plus-button" data-index="${index}">+</button>
      </div>
      <button class="menu-button redeem-button" data-index="${index}">兑换奖品</button>
    `

    elements.studentGrid.appendChild(card)

    const jar = document.getElementById(`jar-${index}`)
    renderSymbols(jar, suns, moons, stars)
  })

  addButtonEventListeners()
}

function addButtonEventListeners() {
  document.querySelectorAll('.minus-button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number.parseInt(btn.getAttribute('data-index'), 10)
      updateScore(index, -1)
    })
  })

  document.querySelectorAll('.plus-button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number.parseInt(btn.getAttribute('data-index'), 10)
      updateScore(index, 1)
      createConfetti(btn)
    })
  })

  document.querySelectorAll('.redeem-button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number.parseInt(btn.getAttribute('data-index'), 10)
      showRedeemModal(index)
    })
  })
}

function renderSymbols(container, suns, moons, stars) {
  container.innerHTML = ''

  for (let index = 0; index < suns; index += 1) {
    const sun = document.createElement('div')
    sun.className = 'symbol sun float-in'
    sun.innerHTML = '☀️'
    container.appendChild(sun)
  }

  for (let index = 0; index < moons; index += 1) {
    const moon = document.createElement('div')
    moon.className = 'symbol moon float-in'
    moon.innerHTML = '🌙'
    container.appendChild(moon)
  }

  for (let index = 0; index < stars; index += 1) {
    const star = document.createElement('div')
    star.className = 'symbol star float-in'
    star.innerHTML = '⭐'
    container.appendChild(star)
  }
}

function updateScore(index, change) {
  students[index].score = Math.max(0, students[index].score + change)
  saveToLocalStorage()

  const card = document.querySelector(`.student-card:nth-child(${index + 1})`)
  if (!card) {
    return
  }

  card.querySelector('.score').textContent = `${students[index].score}颗星`
  const jar = card.querySelector('.jar-container')
  const { suns, moons, stars } = calculateSymbols(students[index].score)
  renderSymbols(jar, suns, moons, stars)
}

function showRanking() {
  if (students.length === 0) {
    alert('请先设置班级和学生名单')
    openModal(elements.setupModal)
    return
  }

  elements.rankList.innerHTML = ''
  const sortedStudents = [...students].sort((a, b) => b.score - a.score)

  sortedStudents.forEach((student, index) => {
    const rankItem = document.createElement('div')
    rankItem.className = `rank-item rank-${index + 1}`

    let medal = ''
    if (index === 0) medal = '🥇'
    else if (index === 1) medal = '🥈'
    else if (index === 2) medal = '🥉'

    const { suns, moons, stars } = calculateSymbols(student.score)
    const symbols = `${'☀️'.repeat(suns)}${'🌙'.repeat(moons)}${'⭐'.repeat(stars)}`
    rankItem.textContent = `${student.name}: ${student.score}颗星 ${symbols} ${medal}`
    elements.rankList.appendChild(rankItem)
  })

  openModal(elements.rankModal)
}

function parseImportedStudents(content) {
  const importedStudents = []
  const lines = content.split(/\r?\n/)

  lines.forEach((line) => {
    if (!line.trim()) {
      return
    }

    const parts = line.includes('，') ? line.split('，') : line.split(',')
    if (parts.length !== 2) {
      return
    }

    importedStudents.push({
      name: parts[0].trim(),
      score: Number.parseInt(parts[1].trim(), 10) || 0
    })
  })

  return importedStudents
}

async function importScores() {
  if (students.length === 0) {
    alert('请先设置班级和学生名单')
    openModal(elements.setupModal)
    return
  }

  if (!window.electronAPI?.importScores) {
    alert('当前环境不支持导入功能')
    return
  }

  const result = await window.electronAPI.importScores()
  if (result?.canceled || !result?.content) {
    return
  }

  const importedStudents = parseImportedStudents(result.content)
  if (importedStudents.length === 0) {
    alert('导入失败，请检查文件格式！')
    return
  }

  const currentNames = students.map((student) => student.name)
  const importedNames = importedStudents.map((student) => student.name)
  if (JSON.stringify(currentNames) !== JSON.stringify(importedNames)) {
    if (!confirm('导入的学生名单与当前名单不一致，是否覆盖当前名单？')) {
      return
    }
  }

  students = importedStudents
  saveToLocalStorage()
  renderStudents()
  alert(`成功导入 ${importedStudents.length} 名学生数据！`)
}

async function exportScores() {
  if (students.length === 0) {
    alert('请先设置班级和学生名单')
    openModal(elements.setupModal)
    return
  }

  if (!window.electronAPI?.exportScores) {
    alert('当前环境不支持导出功能')
    return
  }

  const content = students.map((student) => `${student.name}，${student.score}`).join('\n')
  const defaultPath = `${className}积分_${new Date().toLocaleDateString()}.txt`

  const result = await window.electronAPI.exportScores({ content, defaultPath })
  if (!result?.canceled) {
    alert('导出成功！')
  }
}

function showSetupModal() {
  elements.classNameInput.value = className
  elements.studentNamesInput.value = students.map((student) => student.name).join('\n')
  openModal(elements.setupModal)
}

function saveClassSetup() {
  const nextClassName = elements.classNameInput.value.trim()
  const namesText = elements.studentNamesInput.value.trim()

  if (!nextClassName || !namesText) {
    alert('请输入班级名称和学生名单')
    return
  }

  className = nextClassName
  elements.classTitle.textContent = `${className} 积分系统 🌟✨`

  const names = namesText
    .split('\n')
    .map((name) => name.trim())
    .filter((name) => name.length > 0)

  students = names.map((name) => {
    const existing = students.find((student) => student.name === name)
    return existing || { name, score: 0 }
  })

  saveToLocalStorage()
  renderStudents()
  closeModal(elements.setupModal)
}

function resetSystem() {
  if (!confirm('确定要重置系统吗？这将清除所有数据！')) {
    return
  }

  localStorage.removeItem('classInfo')
  className = '班级'
  students = []
  prizes = []
  elements.classTitle.textContent = '班级积分系统 🌟✨'
  showSetupPrompt()
  elements.studentGrid.innerHTML = ''
}

function showPrizeModal() {
  renderPrizeList()
  openModal(elements.prizeModal)
}

function renderPrizeList(showRedeem = false, studentIndex = null) {
  const container = showRedeem ? elements.redeemPrizeList : elements.prizeList
  container.innerHTML = ''

  if (prizes.length === 0) {
    container.innerHTML = '<p>暂无奖品，请先添加奖品</p>'
    return
  }

  prizes.forEach((prize, index) => {
    const item = document.createElement('div')
    item.className = 'prize-item'

    if (showRedeem) {
      item.innerHTML = `
        <span>${prize.name} (需要 ${prize.cost} 颗星)</span>
        <button class="menu-button redeem-button" data-prize-index="${index}" data-student-index="${studentIndex}">兑换</button>
      `

      item.querySelector('.redeem-button').addEventListener('click', (event) => {
        const prizeIdx = Number.parseInt(event.target.getAttribute('data-prize-index'), 10)
        const studentIdx = Number.parseInt(event.target.getAttribute('data-student-index'), 10)
        redeemPrize(studentIdx, prizeIdx)
      })
    } else {
      item.innerHTML = `
        <span>${prize.name} (需要 ${prize.cost} 颗星)</span>
        <div class="prize-controls">
          <button class="prize-control-button edit-prize" data-index="${index}">编辑</button>
          <button class="prize-control-button delete-prize" data-index="${index}">删除</button>
        </div>
      `

      item.querySelector('.edit-prize').addEventListener('click', (event) => {
        const targetIndex = Number.parseInt(event.target.getAttribute('data-index'), 10)
        editPrize(targetIndex)
      })

      item.querySelector('.delete-prize').addEventListener('click', (event) => {
        const targetIndex = Number.parseInt(event.target.getAttribute('data-index'), 10)
        deletePrize(targetIndex)
      })
    }

    container.appendChild(item)
  })
}

function addNewPrize() {
  const name = elements.prizeName.value.trim()
  const cost = Number.parseInt(elements.prizeCost.value, 10)

  if (!name || Number.isNaN(cost) || cost <= 0) {
    alert('请输入有效的奖品名称和所需星星数')
    return
  }

  prizes.push({ name, cost })
  saveToLocalStorage()
  renderPrizeList()
  elements.prizeName.value = ''
  elements.prizeCost.value = ''
}

function editPrize(index) {
  const newName = prompt('请输入新的奖品名称', prizes[index].name)
  if (newName === null) {
    return
  }

  const newCost = Number.parseInt(prompt('请输入新的所需星星数', prizes[index].cost), 10)
  if (Number.isNaN(newCost)) {
    return
  }

  prizes[index] = { name: newName.trim(), cost: newCost }
  saveToLocalStorage()
  renderPrizeList()
}

function deletePrize(index) {
  if (!confirm(`确定要删除奖品 "${prizes[index].name}" 吗？`)) {
    return
  }

  prizes.splice(index, 1)
  saveToLocalStorage()
  renderPrizeList()
}

function showRedeemModal(studentIndex) {
  const student = students[studentIndex]
  elements.redeemStudentInfo.textContent = `${student.name} 当前有 ${student.score} 颗星`
  renderPrizeList(true, studentIndex)
  openModal(elements.redeemModal)
}

function redeemPrize(studentIndex, prizeIndex) {
  const student = students[studentIndex]
  const prize = prizes[prizeIndex]

  if (student.score < prize.cost) {
    alert(`${student.name} 的星星不足，无法兑换该奖品！`)
    return
  }

  if (!confirm(`确定要花费 ${prize.cost} 颗星为 ${student.name} 兑换 "${prize.name}" 吗？`)) {
    return
  }

  student.score -= prize.cost
  saveToLocalStorage()
  renderStudents()
  closeModal(elements.redeemModal)
  alert(`兑换成功！${student.name} 获得了 "${prize.name}"`)
}

function createConfetti(element) {
  const rect = element.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  for (let index = 0; index < 20; index += 1) {
    const confetti = document.createElement('div')
    const sizeClass = ['confetti--small', 'confetti--medium', 'confetti--large'][Math.floor(Math.random() * 3)]
    const shapeClass = Math.random() > 0.5 ? 'confetti--circle' : 'confetti--square'
    const colorClass = `confetti--color-${Math.floor(Math.random() * 6) + 1}`
    confetti.className = `confetti ${sizeClass} ${shapeClass} ${colorClass}`
    document.body.appendChild(confetti)

    const angle = Math.random() * Math.PI * 2
    const distance = 70 + Math.random() * 90
    const endX = centerX + Math.cos(angle) * distance
    const endY = centerY + Math.sin(angle) * distance + 60
    const rotation = (Math.random() - 0.5) * 720

    const animation = confetti.animate(
      [
        { transform: `translate(${centerX}px, ${centerY}px) rotate(0deg) scale(1)`, opacity: 1 },
        { transform: `translate(${endX}px, ${endY}px) rotate(${rotation}deg) scale(0.2)`, opacity: 0 }
      ],
      {
        duration: 700 + Math.random() * 400,
        easing: 'cubic-bezier(0.2, 0.6, 0.2, 1)',
        fill: 'forwards'
      }
    )

    animation.addEventListener('finish', () => {
      confetti.remove()
    })
  }
}

function saveToLocalStorage() {
  localStorage.setItem('classInfo', JSON.stringify({ className, students, prizes }))
}

function loadFromLocalStorage() {
  const savedData = localStorage.getItem('classInfo')
  if (!savedData) {
    return
  }

  try {
    const data = JSON.parse(savedData)
    className = data.className || '班级'
    students = Array.isArray(data.students) ? data.students : []
    prizes = Array.isArray(data.prizes) ? data.prizes : []
    elements.classTitle.textContent = `${className} 积分系统 🌟✨`
  } catch {
    localStorage.removeItem('classInfo')
  }
}

function init() {
  loadFromLocalStorage()
  renderStudents()
  initEventListeners()
}

init()
