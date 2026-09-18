/**
 * Снимает экраны приложения и собирает ошибки консоли.
 *
 * Использование (dev-сервер должен быть запущен):
 *     node tools/shot.mjs
 *     node tools/shot.mjs --out .shots --url http://localhost:5173
 *
 * Использует системный Chrome, чтобы не тянуть отдельный бинарник браузера.
 */

import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const OUT = flag('out', '.shots')
const URL = flag('url', 'http://localhost:5173')

const problems = []

async function main() {
  await mkdir(OUT, { recursive: true })

  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } })

  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console: ${m.text()}`)
  })
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))

  const shot = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
    console.log(`  ${OUT}/${name}.png`)
  }

  const step = async (name, fn) => {
    try {
      await fn()
      await page.waitForTimeout(250)
      await shot(name)
    } catch (e) {
      problems.push(`шаг «${name}»: ${e.message.split('\n')[0]}`)
      await shot(`${name}-ОШИБКА`)
    }
  }

  await page.goto(URL, { waitUntil: 'networkidle' })
  await shot('1-хаб')

  await step('2-двор', () => page.getByRole('button', { name: /Двор/ }).click())
  await step('3-задание', () =>
    page.getByRole('button', { name: /Том и футбол/ }).click(),
  )

  // Первый вариант в списке ответов — специально не обязательно правильный:
  // так проверяется и ветка ошибки с подсказкой.
  await step('4-ответ', async () => {
    const options = page.locator('ul li button')
    await options.first().click()
  })

  await step('5-угадай', async () => {
    await page.goto(URL, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /Дом/ }).click()
    await page.getByRole('button', { name: /Что я загадал/ }).click()
  })

  await step('6-вопрос-задан', async () => {
    // Первый доступный вопрос: проверяем, что предметы гаснут после ответа.
    await page.locator('ul li button', { hasText: '?' }).first().click()
  })

  await step('7-настройки', async () => {
    await page.goto(URL, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Настройки' }).click()
  })

  await step('8-для-взрослых', async () => {
    await page.goto(URL, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: '···' }).click()
  })

  await browser.close()

  if (problems.length === 0) {
    console.log('\nОшибок в консоли нет.')
  } else {
    console.log(`\nПроблемы (${problems.length}):`)
    problems.forEach((p) => console.log(`  ! ${p}`))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
