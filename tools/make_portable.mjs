/**
 * Собирает портативную версию игры: папку, которую можно скопировать на флешку
 * и запустить на другом компьютере, ничего там не устанавливая.
 *
 * Внутрь кладётся node.exe с этой машины — он самодостаточный, и благодаря ему
 * на целевом компьютере не нужен ни Node, ни Python, ни интернет.
 *
 *     node tools/make_portable.mjs
 *
 * Результат — папка portable/. Её целиком копировать на флешку.
 */

import { cp, mkdir, rm, readdir, stat, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const OUT = 'portable'

const START_BAT = `@echo off
chcp 65001 >nul
cd /d "%~dp0"
node.exe server.mjs
pause
`

const READ_ME = `Мимиигра — портативная версия

Как запустить:
  1. Скопировать всю эту папку на компьютер (можно прямо с флешки, но с диска быстрее)
  2. Двойной клик по "Играть.bat"
  3. Браузер откроется сам

Окно с чёрным фоном не закрывать, пока играете — в нём работает игра.
Закончили — просто закрыть его.

Если Windows ругается на запуск файла: "Подробнее" -> "Выполнить в любом случае".

Прогресс сохраняется в браузере того компьютера, на котором играли.
При копировании папки на другой компьютер прогресс не переносится.
`

async function dirSize(path) {
  let total = 0
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = join(path, entry.name)
    total += entry.isDirectory() ? await dirSize(full) : (await stat(full)).size
  }
  return total
}

async function main() {
  const nodeExe = process.execPath

  console.log('Собираю приложение...')
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true })

  console.log(`\nСобираю ${OUT}/`)
  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  await cp('dist', join(OUT, 'app'), { recursive: true })
  await cp('tools/portable/server.mjs', join(OUT, 'server.mjs'))
  await cp(nodeExe, join(OUT, 'node.exe'))
  await writeFile(join(OUT, 'Играть.bat'), START_BAT, 'utf8')
  await writeFile(join(OUT, 'Как запустить.txt'), READ_ME, 'utf8')

  const mb = (await dirSize(OUT)) / 1024 / 1024
  console.log(`\nГотово: ${OUT}/  —  ${mb.toFixed(0)} МБ`)
  console.log('Скопировать эту папку целиком на флешку.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
