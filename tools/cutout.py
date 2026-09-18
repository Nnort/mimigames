"""Вырезание ровного фона у спрайта заливкой от краёв.

Листы эмоций сгенерированы на ровном светло-сером фоне, поэтому тяжёлая нейросетевая
сегментация (rembg) не нужна: достаточно залить связную область от краёв кадра.
Заливка идёт от краёв, поэтому серая шерсть внутри силуэта не затрагивается —
она не связана с фоном.

Использование:
    python tools/cutout.py public/assets/characters/tom
    python tools/cutout.py public/assets/characters/tom --thresh 40

Зависимости: pillow
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw

MARKER = (255, 0, 255)
DEFAULT_THRESH = 48


def cutout(path: Path, thresh: int) -> tuple[int, int]:
    """Возвращает (число прозрачных пикселей, всего пикселей)."""
    rgb = Image.open(path).convert("RGB")
    w, h = rgb.size

    # Затравки по верхнему краю и бокам. По нижнему краю — только узкие углы:
    # туловище персонажа доходит до низа кадра, и затравка посреди нижнего края
    # попадает в одежду, после чего заливка съедает футболку.
    step = 8
    corner = w // 8
    seeds = (
        [(x, 0) for x in range(0, w, step)]
        + [(x, h - 1) for x in range(0, corner, step)]
        + [(x, h - 1) for x in range(w - corner, w, step)]
        + [(0, y) for y in range(0, h, step)]
        + [(w - 1, y) for y in range(0, h, step)]
    )

    for seed in seeds:
        if rgb.getpixel(seed) != MARKER:
            ImageDraw.floodfill(rgb, seed, MARKER, thresh=thresh)

    rgba = Image.open(path).convert("RGBA")
    px_src, px_dst = rgb.load(), rgba.load()
    transparent = 0
    for y in range(h):
        for x in range(w):
            if px_src[x, y] == MARKER:
                r, g, b, _ = px_dst[x, y]
                px_dst[x, y] = (r, g, b, 0)
                transparent += 1

    rgba.save(path)
    return transparent, w * h


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    thresh = DEFAULT_THRESH
    if "--thresh" in sys.argv:
        thresh = int(sys.argv[sys.argv.index("--thresh") + 1])
        args = [a for a in args if a != str(thresh)]

    if len(args) != 1:
        print(__doc__)
        return 1

    target = Path(args[0])
    files = sorted(target.glob("*.png")) if target.is_dir() else [target]
    if not files:
        print(f"Нет png в {target}")
        return 1

    for f in files:
        transparent, total = cutout(f, thresh)
        share = transparent / total
        flag = ""
        if share < 0.15:
            flag = "  ! почти ничего не вырезалось — поднять --thresh"
        elif share > 0.85:
            flag = "  ! вырезалось слишком много — опустить --thresh"
        print(f"  {f.name:12} фон {share:5.1%}{flag}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
