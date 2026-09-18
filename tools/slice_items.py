"""Нарезка листа предметов на отдельные картинки.

Лист — сетка панелей, в каждой один предмет. Панели находятся по изображению,
а не по формуле «поделить на N»: генератор оставляет поля и промежутки, и равномерное
деление режет предметы криво.

Если в углу панели есть служебная подпись, она затирается фоном: подпись на английском
попала бы в игру, а Вера читает и прочитает всё, что написано.

Использование:
    python tools/slice_items.py "refs/поиск предметов.jpg" \
        --names ramen,marmalade,sausage,ball,balloon,slime,scooter,cat,book

    python tools/slice_items.py sheet.jpg --names a,b,c --no-label

Зависимости: pillow
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "assets" / "items"

# Окно, в котором ищем служебную подпись: левый верхний угол панели.
# Заведомо меньше, чем расстояние от угла до предмета, иначе затрём сам предмет.
LABEL_ZONE_W, LABEL_ZONE_H = 0.32, 0.26
# Текст подписи темнее фона панели на столько единиц яркости.
LABEL_CONTRAST = 40
# Панель темнее внешнего фона листа; всё светлее этого считаем промежутком.
PANEL_MAX_LUMA = 228
# Какая доля полосы должна быть «панелью», чтобы считать полосу занятой.
BAND_MIN_FILL = 0.5
# На сколько пикселей поджать найденную панель. Светлый промежуток между панелями,
# попавший в край кадра, потом не даёт заливке выйти в фон при вырезании.
PANEL_INSET = 5


def flag(args: list[str], name: str) -> str | None:
    key = f"--{name}"
    if key in args:
        i = args.index(key)
        if i + 1 < len(args):
            return args[i + 1]
    return None


def bands(occupied: list[bool], min_len: int) -> list[tuple[int, int]]:
    """Непрерывные отрезки True длиной не меньше min_len."""
    out: list[tuple[int, int]] = []
    start = None
    for i, value in enumerate(occupied):
        if value and start is None:
            start = i
        elif not value and start is not None:
            if i - start >= min_len:
                out.append((start, i))
            start = None
    if start is not None and len(occupied) - start >= min_len:
        out.append((start, len(occupied)))
    return out


def find_panels(sheet: Image.Image) -> tuple[list[tuple[int, int]], list[tuple[int, int]]]:
    gray = sheet.convert("L")
    w, h = gray.size
    px = gray.load()

    dark = [[px[x, y] < PANEL_MAX_LUMA for y in range(h)] for x in range(w)]

    cols = [sum(dark[x]) / h >= BAND_MIN_FILL for x in range(w)]
    rows = [sum(dark[x][y] for x in range(w)) / w >= BAND_MIN_FILL for y in range(h)]

    return bands(cols, w // 20), bands(rows, h // 20)


def erase_label(cell: Image.Image, name: str) -> None:
    """Затирает подпись фоном панели, по её настоящим границам, а не прямоугольником на глаз."""
    w, h = cell.size
    zone_w, zone_h = int(w * LABEL_ZONE_W), int(h * LABEL_ZONE_H)

    # Верхний правый угол панели — чистый фон: подпись слева, предмет по центру.
    background = cell.getpixel((int(w * 0.93), int(h * 0.07)))
    base_luma = sum(background[:3]) / 3

    gray = cell.convert("L").load()
    xs, ys = [], []
    for y in range(zone_h):
        for x in range(zone_w):
            if gray[x, y] < base_luma - LABEL_CONTRAST:
                xs.append(x)
                ys.append(y)

    if not xs:
        return

    # Длинная подпись не влезает в окно поиска. Продолжаем её вправо по той же строке,
    # пока буквы идут с небольшими промежутками. Предмет стоит по центру и отделён
    # широким полем фона, поэтому рост на него не перекинется.
    y0, y1 = min(ys), max(ys)
    gap_limit = max(8, int(w * 0.04))
    x = max(xs) + 1
    gap = 0
    last = max(xs)
    while x < w and gap <= gap_limit:
        if any(gray[x, y] < base_luma - LABEL_CONTRAST for y in range(y0, y1 + 1)):
            last = x
            gap = 0
        else:
            gap += 1
        x += 1
    xs.append(last)

    pad = 3
    box = (
        max(0, min(xs) - pad),
        max(0, min(ys) - pad),
        min(w, max(xs) + pad + 1),
        min(h, max(ys) + pad + 1),
    )
    cell.paste(background, box)

    # Если тёмное упёрлось в край окна поиска, скорее всего это уже предмет, а не буквы.
    if max(xs) >= zone_w - 2 or max(ys) >= zone_h - 2:
        print(f"    ! {name}: затёртое пятно дошло до края окна — проверь картинку")


def main() -> int:
    args = sys.argv[1:]
    if not args or args[0].startswith("--"):
        print(__doc__)
        return 1

    sheet_path = Path(args[0])
    if not sheet_path.is_file():
        print(f"Не найден файл: {sheet_path}")
        return 1

    names_raw = flag(args, "names")
    if not names_raw:
        print("Нужен --names: список id через запятую, по одному на панель")
        return 1
    names = [n.strip() for n in names_raw.split(",") if n.strip()]

    sheet = Image.open(sheet_path).convert("RGB")

    grid = flag(args, "grid")
    if grid:
        # Лист без разделителей: предметы просто лежат на сплошном белом, границ панелей
        # нет, и искать их бессмысленно. Делим ровно.
        cols, rows = (int(n) for n in grid.lower().split("x"))
        cell_w, cell_h = sheet.width // cols, sheet.height // rows
        col_bands = [(c * cell_w, (c + 1) * cell_w) for c in range(cols)]
        row_bands = [(r * cell_h, (r + 1) * cell_h) for r in range(rows)]
        print(f"{sheet_path}\n  сетка задана явно: {cols} x {rows}")
    else:
        col_bands, row_bands = find_panels(sheet)
        print(f"{sheet_path}\n  найдено панелей: {len(col_bands)} x {len(row_bands)}")

    found = len(col_bands) * len(row_bands)
    if found != len(names):
        print(f"  ! имён {len(names)}, а ячеек {found} — проверь лист или список")
        return 1

    with_label = "--no-label" not in args
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    index = 0
    for top, bottom in row_bands:
        for left, right in col_bands:
            cell = sheet.crop(
                (
                    left + PANEL_INSET,
                    top + PANEL_INSET,
                    right - PANEL_INSET,
                    bottom - PANEL_INSET,
                )
            )
            if with_label:
                erase_label(cell, names[index])
            cell.save(OUT_DIR / f"{names[index]}.png")
            print(f"  {names[index]}.png  {cell.width}x{cell.height}")
            index += 1

    print("\nДальше вырезать фон:  python tools/cutout.py public/assets/items")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
