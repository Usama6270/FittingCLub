import re

path = r'd:\Fitting club\products.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def repl(m):
    num = m.group(1)
    alt = m.group(2)
    return (
        f'<div class="product-image-wrapper">\n'
        f'                        <img src="assets/images/product-{num}.jpg" alt="{alt}" loading="lazy" '
        f'width="600" height="600" '
        f'sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw" '
        f'srcset="assets/images/product-{num}.jpg 400w, assets/images/product-{num}.jpg 800w">\n'
        f'                    </div>'
    )

content = re.sub(
    r'<img src="assets/images/product-(\d+)\.jpg" alt="([^"]+)" loading="lazy">',
    repl,
    content,
)

content = content.replace(
    '<img src="assets/images/Logo (2).png" alt="Fitting Club" style="height:40px;margin-bottom:1rem;">',
    '<img src="assets/images/Logo (2).png" alt="Fitting Club" class="footer-logo" loading="lazy">',
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
