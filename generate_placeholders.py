
from PIL import Image, ImageDraw, ImageFont
import os

# Create images directory if it doesn't exist
os.makedirs('assets/images', exist_ok=True)

# Function to create a placeholder image
def create_placeholder(width, height, color, text, filename):
    img = Image.new('RGB', (width, height), color=color)
    draw = ImageDraw.Draw(img)
    try:
        # Try to use a font
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        # If arial isn't available, use default
        font = ImageFont.load_default()
    
    # Calculate text position
    bbox = draw.textbbox((0,0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (width - text_width) / 2
    y = (height - text_height) / 2
    draw.text((x, y), text, fill="white", font=font)
    img.save(f'assets/images/{filename}')
    print(f'Created {filename}')

# Create all required placeholder images
placeholders = [
    (64, 64, '#E10600', 'FC', 'favicon.png'),
    (200, 60, '#0D0D0D', 'Fitting Club', 'logo.png'),
    (200, 60, '#FFFFFF', 'Fitting Club', 'logo-dark.png'),
    (1920, 1080, '#1a1a1a', 'Hero Background', 'hero-bg.jpg'),
    (1920, 600, '#1a1a1a', 'About Banner', 'banner-about.jpg'),
    (1920, 600, '#1a1a1a', 'Products Banner', 'banner-products.jpg'),
    (1920, 600, '#1a1a1a', 'Contact Banner', 'banner-contact.jpg'),
]

# Category images (portrait)
for i in range(1,7):
    placeholders.append((800, 1000, '#2d2d2d', f'Category {i}', f'category-{i}.jpg'))

# Product images (square)
for i in range(1,13):
    placeholders.append((800, 800, '#3d3d3d', f'Product {i}', f'product-{i}.jpg'))

# Gallery images
for i in range(1,9):
    placeholders.append((1000, 750, '#4d4d4d', f'Gallery {i}', f'gallery-{i}.jpg'))

# Certification badges
for i in range(1,7):
    placeholders.append((150, 80, '#E10600', f'Cert {i}', f'cert-{i}.png'))

# Testimonial avatars
for i in range(1,5):
    placeholders.append((150, 150, '#5d5d5d', f'Avatar {i}', f'testimonial-avatar-{i}.jpg'))

# Generate all images
for w, h, c, t, f in placeholders:
    try:
        create_placeholder(w, h, c, t, f)
    except Exception as e:
        print(f"Error creating {f}: {e}")
