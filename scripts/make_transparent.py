"""
make_transparent.py
Removes outer near-white backgrounds from isolated 2D pixel art sprite PNGs
using edge-connected floodfill (preserving interior white pixels like eyes,
teeth, robes, and feathers) and overwrites the existing PNG files.

Usage:
    pip install pillow
    python scripts/make_transparent.py
"""
from collections import deque
from pathlib import Path
from PIL import Image

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"

# Full-scene backgrounds and dark cards should stay opaque
SKIP_DIRS = {"backgrounds"}
SKIP_FILES = {"silhouette_mystery_enemy.png"}

WHITE_THRESHOLD = 228


def is_near_white(r: int, g: int, b: int, a: int) -> bool:
    if a < 20:
        return True
    return r >= WHITE_THRESHOLD and g >= WHITE_THRESHOLD and b >= WHITE_THRESHOLD


def remove_outer_white(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    pixels = rgba.load()
    visited = bytearray(w * h)
    queue = deque()

    # Seed all 4 outer edges
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(1, h - 1):
        queue.append((0, y))
        queue.append((w - 1, y))

    while queue:
        x, y = queue.popleft()
        pos = y * w + x
        if visited[pos]:
            continue
        visited[pos] = 1

        r, g, b, a = pixels[x, y]
        if not is_near_white(r, g, b, a):
            continue

        pixels[x, y] = (0, 0, 0, 0)
        if x > 0 and not visited[pos - 1]:
            queue.append((x - 1, y))
        if x < w - 1 and not visited[pos + 1]:
            queue.append((x + 1, y))
        if y > 0 and not visited[pos - w]:
            queue.append((x, y - 1))
        if y < h - 1 and not visited[pos + w]:
            queue.append((x, y + 1))

    # Soft anti-halo pass on immediate boundary pixels
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            r, g, b, a = pixels[x, y]
            if a > 0 and r >= 215 and g >= 215 and b >= 215:
                if (
                    pixels[x - 1, y][3] == 0
                    or pixels[x + 1, y][3] == 0
                    or pixels[x, y - 1][3] == 0
                    or pixels[x, y + 1][3] == 0
                ):
                    pixels[x, y] = (0, 0, 0, 0)

    return rgba


def main() -> None:
    count = 0
    for png_path in sorted(ASSETS_DIR.rglob("*.png")):
        rel_parts = png_path.relative_to(ASSETS_DIR).parts
        if any(part in SKIP_DIRS for part in rel_parts):
            continue
        if png_path.name in SKIP_FILES:
            continue

        with Image.open(png_path) as im:
            out = remove_outer_white(im)
        out.save(png_path, format="PNG")
        count += 1
        print(f"Processed: {png_path.relative_to(ASSETS_DIR)}")

    print(f"Done! Updated {count} PNG files with transparent backgrounds.")


if __name__ == "__main__":
    main()
