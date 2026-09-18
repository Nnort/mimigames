/**
 * Крошечный сервер для портативной версии.
 *
 * Зачем он вообще нужен, если есть готовые файлы: открыть index.html двойным кликом
 * не получится. Браузер считает файл с диска «чужим источником» и, во-первых,
 * не даёт загрузить модули, во-вторых, запрещает localStorage — а в нём хранится
 * весь прогресс и уровни поддержки. С локальным адресом http://localhost всё это работает.
 */

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'app')
const PORTS = [8080, 8081, 8082, 8090, 9080]

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
}

async function send(res, path) {
  const body = await readFile(path)
  res.writeHead(200, {
    'Content-Type': TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-cache',
  })
  res.end(body)
}

const server = createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0])
    // normalize убирает ../, чтобы запрос не вышел за пределы папки app
    const rel = normalize(url).replace(/^([/\\])+/, '')
    let path = join(ROOT, rel)

    if (!path.startsWith(ROOT)) {
      res.writeHead(403).end('Нельзя')
      return
    }

    const info = await stat(path).catch(() => null)
    if (!info || info.isDirectory()) path = join(ROOT, 'index.html')

    await send(res, path)
  } catch {
    res.writeHead(404).end('Не найдено')
  }
})

function listen(index) {
  if (index >= PORTS.length) {
    console.log('Не удалось занять ни один порт. Закрой другие запущенные копии игры.')
    return
  }

  server.once('error', () => listen(index + 1))
  server.listen(PORTS[index], '127.0.0.1', () => {
    const address = `http://localhost:${PORTS[index]}`
    console.log('')
    console.log('  Мимиигра запущена.')
    console.log(`  Адрес: ${address}`)
    console.log('')
    console.log('  Браузер откроется сам.')
    console.log('  Это окно не закрывай, пока играете. Закроешь — игра остановится.')
    console.log('')
    // MIMIGAME_NO_OPEN — чтобы проверять сервер, не открывая окно браузера.
    if (!process.env.MIMIGAME_NO_OPEN) {
      spawn('cmd', ['/c', 'start', '""', address], { detached: true, stdio: 'ignore' }).unref()
    }
  })
}

listen(0)
