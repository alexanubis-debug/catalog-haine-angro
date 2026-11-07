"""Export responsive WebP assets from catalog originals without changing originals."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'catalog.json'


def export(source, paired=False):
    with Image.open(ROOT / source) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        width, height = image.size
        variants = {}
        for label, target_width, quality in [('small', 360, 78), ('card', 640, 80), ('detail', 1200, 86)]:
            frame = image.copy()
            export_width = target_width * (2 if paired else 1)
            frame.thumbnail((export_width, round(export_width * height / width)), Image.Resampling.LANCZOS)
            output = f'assets/optimized/{Path(source).stem}-{label}.webp'
            frame.save(ROOT / output, 'WEBP', quality=quality, method=5)
            variants[label] = output
        return source, {**variants, 'width': width // 2 if paired else width, 'height': height}


def product_sources(product):
    return list(dict.fromkeys([product['image']] + product.get('images', []) + ([product['colorVariantsImage']] if product.get('colorVariantsImage') else [])))


def main():
    catalog = json.loads(CATALOG.read_text())
    sources = sorted({source.split('#')[0] for product in catalog['products'] for source in product_sources(product)})
    paired_sources = {product['studioPair'] for product in catalog['products'] if product.get('studioPair')}
    (ROOT / 'assets/optimized').mkdir(exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        media = dict(pool.map(lambda source: export(source, source in paired_sources), sources))
    for product in catalog['products']:
        previous_media = product.get('media', {})
        product['media'] = {}
        for source in product_sources(product):
            base, _, frame = source.partition('#')
            metadata = dict(media[base])
            if base in paired_sources and frame in ('left', 'right'):
                metadata['frame'] = frame
                if previous_media.get(source, {}).get('frameLabel'):
                    metadata['frameLabel'] = previous_media[source]['frameLabel']
            product['media'][source] = metadata
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    print(f'Optimized {len(sources)} images for {len(catalog["products"])} products.')


if __name__ == '__main__':
    main()
