"""Нарезка листа эмоций 3x2 на шесть спрайтов.

Использование:
    python tools/slice_sheet.py refs/sheets/vera.png vera

Результат: public/assets/characters/vera/{neutral,happy,question,surprised,sad,thinking}.png

Вырезание фона делается отдельным шагом (rembg), см. --cutout.
Зависимости: pillow. Для --cutout дополнительно rembg.
    pip install pillow
    pip install rembg            # опционально
"""

import sys
from pathlib import Path

from PIL import Image

# Порядок совпадает с сеткой в docs/prompts.md и с полем "emotion" в контент-паках.
EMOTIONS = [
    "neutral", "happy", "question",
    "surprised", "sad", "thinking",
]
COLS, ROWS = 3, 2

ROOT = Path(__file__).resolve().parent.parent


def slice_sheet(sheet_path: Path, character_id: str, cutout: bool) -> None:
    sheet = Image.open(sheet_path).convert("RGBA")
    cell_w, cell_h = sheet.width // COLS, sheet.height // ROWS

    if sheet.width % COLS or sheet.height % ROWS:
        print(f"  ! {sheet.width}x{sheet.height} не делится на {COLS}x{ROWS} нацело — "
              f"края будут обрезаны на {sheet.width % COLS}x{sheet.height % ROWS} px")

    out_dir = ROOT / "public" / "assets" / "characters" / character_id
    out_dir.mkdir(parents=True, exist_ok=True)

    remove = None
    if cutout:
        try:
            from rembg import remove as _remove
            remove = _remove
        except ImportError:
            print("  ! rembg не установлен, фон не вырезается (pip install rembg)")

    for index, emotion in enumerate(EMOTIONS):
        col, row = index % COLS, index // COLS
        cell = sheet.crop((col * cell_w, row * cell_h,
                           (col + 1) * cell_w, (row + 1) * cell_h))
        if remove is not None:
            cell = remove(cell)
        target = out_dir / f"{emotion}.png"
        cell.save(target)
        print(f"  {target.relative_to(ROOT)}  {cell.width}x{cell.height}")


def main() -> int:
    args = [a for a in sys.argv[1:] if a != "--cutout"]
    cutout = "--cutout" in sys.argv[1:]

    if len(args) != 2:
        print(__doc__)
        return 1

    sheet_path = Path(args[0])
    if not sheet_path.is_file():
        print(f"Не найден файл: {sheet_path}")
        return 1

    print(f"{sheet_path} -> {args[1]}")
    slice_sheet(sheet_path, args[1], cutout)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
