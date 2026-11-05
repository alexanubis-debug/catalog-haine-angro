"""Export responsive WebP assets from catalog originals without changing originals."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'catalog.json'


def export(source):
    with Image.open(ROOT / source) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        width, height = image.size
        variants = {}
        for label, target_width, quality in [('small', 360, 78), ('card', 640, 80), ('detail', 1200, 86)]:
            frame = image.copy()
            frame.thumbnail((target_width, round(target_width * height / width)), Image.Resampling.LANCZOS)
            output = f'assets/optimized/{Path(source).stem}-{label}.webp'
            frame.save(ROOT / output, 'WEBP', quality=quality, method=5)
            variants[label] = output
        return source, {**variants, 'width': width, 'height': height}


def main():
    catalog = json.loads(CATALOG.read_text())
    sources = sorted({source for product in catalog['products'] for source in [product['image']] + product.get('images', []) + ([product['colorVariantsImage']] if product.get('colorVariantsImage') else [])})
    (ROOT / 'assets/optimized').mkdir(exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        media = dict(pool.map(export, sources))
    for product in catalog['products']:
        product['media'] = {source: media[source] for source in dict.fromkeys([product['image']] + product.get('images', []) + ([product['colorVariantsImage']] if product.get('colorVariantsImage') else []))}
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    print(f'Optimized {len(sources)} images for {len(catalog["products"])} products.')


if __name__ == '__main__':
    main()
