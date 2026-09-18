# Промпты для генерации графики

Генерирует мама, в том же сервисе, где делались референсы. Я принимаю готовые файлы
и обрабатываю их скриптом `tools/slice_sheet.py`.

## Правила, которые важнее самих промптов

1. **Лист эмоций генерируется одной картинкой, а не шестью.** Шесть выражений в сетке 3×2 =
   один рендер = одинаковое лицо и свет. По одной генерировать нельзя: персонаж уплывёт,
   и на экране «грусть» будет другим человеком.
2. **Прикладывать `refs/photo_2026-06-11_15-42-56.jpg` как референс** (image-to-image или
   «по этому изображению»), иначе стиль не совпадёт с тем, что уже нравится.
3. **Один и тот же сид** для всех листов одного персонажа. Если сервис показывает сид —
   записать его сюда рядом с персонажем.
4. **Фон — ровный светло-серый**, без сцены. Вырезать его потом гораздо проще.
5. Порядок эмоций в сетке фиксирован и совпадает с полем `emotion` в контент-паках:

   ```
   neutral    happy      question
   surprised  sad        thinking
   ```

## 0. Что уже сделано (18.09.2026)

**Базовый состав персонажей готов полностью.** Шесть листов эмоций приняты, нарезка проверена —
сетка ложится ровно, персонаж в каждой ячейке целиком и по центру.

| Файл в `refs/` | id | Кто |
|---|---|---|
| `vera1.jpg` | `vera` | Вера |
| `tom.jpg` | `tom` | серый кот |
| `собака.jpg` | `ben` | коричневая собака |
| `хэнк.jpg` | `hank` | бело-голубая собака |
| `анжела.jpg` | `angela` | белая кошка |
| `джинджер.jpg` | `ginger` | рыжий котёнок |

Осталось по персонажам:

- [ ] **Анджелу перегенерить**: вышла 895×500 вместо 1376×768, вдвое меньше остальных
- [x] У Тома и Бена эмоция `sad` со слезами — решено правилом, а не перегенерацией:
      на ошибку показываем `thinking`, см. `docs/style-guide.md`

## 1. Вера — приоритет, нужна первой

```
3D Pixar-style character sheet, the same character repeated 6 times in a 3x2 grid,
identical face, identical proportions, identical lighting, plain light grey background.
Character: a 10-year-old girl with dark brown chin-length bob and straight thick bangs,
large brown eyes, round friendly face, blue soccer jersey with white sleeve stripes.
Head and shoulders, front view, consistent scale across all six.
Expressions, top row left to right: neutral calm, happy smiling, curious questioning;
bottom row left to right: surprised, sad, thoughtful.
Soft global illumination, warm light, no text, no labels, no borders.
```

Сид: `___` (записать после первой удачной генерации)

## 2. Том — приоритет, нужен первым

```
3D Pixar-style character sheet, the same character repeated 6 times in a 3x2 grid,
identical face, identical proportions, identical lighting, plain light grey background.
Character: a cartoon grey tabby cat with big green eyes, white muzzle, green t-shirt,
friendly and goofy.
Head and shoulders, front view, consistent scale across all six.
Expressions, top row left to right: neutral calm, happy smiling, curious questioning;
bottom row left to right: surprised, sad, thoughtful.
Soft global illumination, warm light, no text, no labels, no borders.
```

Сид: `___`

## 3. Остальная компания — уже готова

Описания оставлены на случай перегенерации. Тот же шаблон, меняется только персонаж:

| id | Описание для промпта |
|---|---|
| `ben` | `a cartoon brown dog with floppy ears, red polo shirt, blue jeans, smart and thoughtful` |
| `hank` | `a cartoon white and blue dog with floppy ears, blue t-shirt with a paw print, cheerful and goofy` |
| `angela` | `a cartoon white cat with big blue eyes, pink t-shirt with a heart, gentle and talkative` |
| `ginger` | `a cartoon orange kitten with blue eyes, purple overalls, cheeky and mischievous` |

## 4. Фоны локаций

Шесть штук. **Без персонажей**, горизонтально 16:9.

Первая попытка (18.09) не подошла по трём причинам, все три учтены в промпте ниже:
английские надписи на доске и вывесках, слишком много мелких деталей, и разъехавшийся
стиль — часть фонов вышла фотореалистичной, а персонажи мультяшные.

```
Stylized 3D cartoon background plate in Pixar animation style, NOT photorealistic,
no characters, no people, horizontal 16:9.
Simple and uncluttered, few large objects, clean shapes, soft warm lighting,
slightly muted colours, gentle depth of field.
Empty open space in the lower middle of the frame where characters will stand.
Absolutely no text, no signs, no letters, no writing, no posters with words.
Scene: <СЦЕНА>
```

Три вещи в этом промпте критичны: `no text` (Вера читает и прочитает всё, что написано),
`simple and uncluttered` (фон не должен спорить с персонажами за внимание) и
`empty open space in the lower middle` (иначе персонажа некуда поставить).

| id | `<СЦЕНА>` |
|---|---|
| ~~`home`~~ | ✅ `refs/homev2.jpg` |
| ~~`yard`~~ | ✅ `refs/поле2.jpg` |
| ~~`school`~~ | ✅ `refs/школа2.jpg` |
| ~~`shop`~~ | ✅ `refs/магазин2.jpg` |
| ~~`park`~~ | ✅ `refs/gfhr.jpg` — самый удачный, на него стоит равняться |
| ~~`clinic`~~ | ✅ `refs/клиника.jpg` |

**Все шесть фонов готовы.**

Отдельно по двум: комната в первой попытке вышла для дошкольника (мишки, динозаврик, ракета),
а поликлиника — совсем малышовая. В 10 лет это считывается как «для маленьких», поэтому
в описания добавлены прямые оговорки, и со второй попытки обе получились.

Эталон композиции и стиля — `refs/gfhr.jpg` (парк): нет текста, широкий пустой передний план,
и графика заметно более плоская, чем у остальных. Это оказалось плюсом: объёмные персонажи
на плоском фоне читаются лучше, чем на детально отрендеренном.

Остальные фоны чуть «фотографичнее» парка. Для домашней игры разброс некритичный и в глаза
не бросается, но если что-то придётся перегенерить — целиться в плоскость парка.

## 5. Предметы для «Угадай, что я загадал»

Первая попытка (`refs/поиск предметов.jpg`) не подошла по трём причинам:
подписи `ramen`, `marmalade` вшиты в картинку и попали бы в игру; фон серый с градиентом,
из-за чего вырезание оставляет грязь; у предметов тени, которые после вырезания
превращаются в серые кляксы.

Всё три лечатся промптом. Главное — **чисто белый фон и никаких теней**: тогда вырезание
становится тривиальным и предметы можно класть на любую карточку.

**Два листа по шесть предметов**, сетка 3×2. Не двенадцать разом: на одном листе
каждый предмет получится вдвое мельче и потеряет детали.

```
Photorealistic product photograph grid, 3 columns by 2 rows, 6 separate objects,
one object per cell, each object centered with generous empty margin around it.
Pure white seamless background, evenly lit, soft even studio lighting.
No shadows, no reflections, no surface, no table, objects appear to float on white.
No text, no labels, no captions, no watermarks, no letters anywhere in the image.
No borders, no frames, no dividing lines between cells.
All six objects rendered at a consistent, comparable scale.
Objects, left to right, top row then bottom row:
<ШЕСТЬ ПРЕДМЕТОВ ЧЕРЕЗ ЗАПЯТУЮ>
```

### Лист 1

`a cup of instant ramen noodles, a pile of colourful gummy bears, two grilled sausages,
a black and white football, a red helium balloon, a blob of bright green slime`

| Порядок | id |
|---|---|
| 1 | `ramen` |
| 2 | `marmalade` |
| 3 | `sausage` |
| 4 | `ball` |
| 5 | `balloon` |
| 6 | `slime` |

### Лист 2

`a kick scooter, a skateboard, a closed hardcover children's book, a bicycle,
a hamster, a glass of water`

| Порядок | id |
|---|---|
| 1 | `scooter` |
| 2 | `skateboard` |
| 3 | `book` |
| 4 | `bicycle` |
| 5 | `hamster` |
| 6 | `water` |

**Кота из набора убрал.** Том — кот, и фотореалистичный кот рядом с мультяшным Томом даёт
ровно тот вопрос, который сбивает: почему этот кот настоящий, а Том нет. Хомяк закрывает
ту же роль в вопросе «это живое?» и ни с кем из компании не пересекается.

Стакан воды и велосипед добавлены не просто так: в игре нужны предметы с разными
свойствами, чтобы вопросы «это можно съесть?», «это живое?», «на этом можно кататься?»
делили набор примерно пополам. Если все предметы съедобные, вопрос бесполезен.

### Что получилось

Оба листа приняты: `refs/лист1.jpg` и `refs/лист2.jpg`. Белый фон, без подписей и теней —
ровно то, что нужно. Двенадцать предметов нарезаны в `public/assets/items/`.

**Осталось одно:** на книге из листа 2 английская надпись «Children Book». Перегенерировать
одной картинкой:

```
Photorealistic product photograph of a single closed hardcover children's picture book
lying at a slight angle. The cover shows a simple colourful illustration and
absolutely no text, no title, no letters, no words anywhere.
Pure white seamless background, soft even studio lighting, no shadow, no reflection.
```

### Обработка

```bash
python tools/slice_items.py refs/лист1.jpg --grid 3x2 --no-label --names ramen,marmalade,sausage,ball,balloon,slime
python tools/slice_items.py refs/лист2.jpg --grid 3x2 --no-label --names scooter,skateboard,book,bicycle,hamster,water
```

Два вывода из первой попытки:

- **`--grid` обязателен для листов на белом.** Скрипт умеет находить панели сам, но только
  когда они отделены от фона. На сплошном белом границ нет и искать нечего — сетку задаём явно.
- **`cutout.py` предметам не нужен.** Они уже на белом и лягут на белые карточки. Вырезание
  тут только навредит: заливка от краёв не отличит белый фон от белых боков мяча и стакана воды.

## 6. Что делать с готовыми файлами

1. Листы эмоций складывать в `refs/sheets/<id>.png` (например `refs/sheets/vera.png`)
2. Фоны — в `refs/backgrounds/<id>.png`
3. Предметы — в `refs/items/<id>.png`
4. Сказать мне — дальше нарезка и вырезание фона делаются скриптом
