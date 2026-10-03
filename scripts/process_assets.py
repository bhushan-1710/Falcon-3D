"""
Asset Processing Pipeline for Falcon 3D Prints
Processes brain-generated images into optimized web assets:
- Transparent cutouts with anti-aliasing
- Crisp aspect ratio crops
- High-efficiency WebP compression
- Dual-path deployment to both /assets/ and legacy /products/ & /samples/
"""

import os
import shutil
from collections import deque
from PIL import Image, ImageFilter
import numpy as np

BRAIN_DIR = r"C:\Users\User\.gemini\antigravity-ide\brain\5c255ce5-106c-4c32-945e-c5d00f05b6b3"
PUBLIC_DIR = r"c:\Users\User\OneDrive\Desktop\Clients\Falcon_3d_prints\falcon-web\public"

def create_cutout(img_path, threshold=228, sat_thresh=18, blur_radius=1.2):
    img = Image.open(img_path).convert('RGBA')
    arr = np.array(img)
    rgb = arr[:, :, :3].astype(np.float32)

    is_bg = (rgb[:, :, 0] > threshold) & (rgb[:, :, 1] > threshold) & (rgb[:, :, 2] > threshold)
    sat = np.max(rgb, axis=2) - np.min(rgb, axis=2)
    is_bg = is_bg & (sat < sat_thresh)

    h, w = is_bg.shape
    visited = np.zeros((h, w), dtype=bool)
    q = deque()

    for x in range(w):
        if is_bg[0, x]: q.append((0, x)); visited[0, x] = True
        if is_bg[h-1, x]: q.append((h-1, x)); visited[h-1, x] = True
    for y in range(h):
        if is_bg[y, 0] and not visited[y, 0]: q.append((y, 0)); visited[y, 0] = True
        if is_bg[y, w-1] and not visited[y, w-1]: q.append((y, w-1)); visited[y, w-1] = True

    while q:
        y, x = q.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w:
                if not visited[ny, nx] and is_bg[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    alpha = np.where(visited, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(radius=blur_radius))

    res = Image.new('RGBA', img.size)
    res.paste(img, (0, 0))
    res.putalpha(alpha_img)
    return res

def optimize_image(img_path, target_size=None, quality=90):
    img = Image.open(img_path)
    if img.mode != 'RGB':
        img = img.convert('RGB')
    if target_size:
        img = img.resize(target_size, Image.Resampling.LANCZOS)
    return img

def main():
    print("Processing Falcon 3D Prints assets...")

    # Mapping of generated brain images to destinations
    brain_files = {
        'hero': os.path.join(BRAIN_DIR, 'hero_print_object_1791011437189.jpg'),
        'fragment1': os.path.join(BRAIN_DIR, 'hero_fragment_bracket_1791011567636.jpg'),
        'fragment2': os.path.join(BRAIN_DIR, 'hero_fragment_node_1791011586691.jpg'),
        'studio': os.path.join(BRAIN_DIR, 'workshop_studio_bench_1791011462073.jpg'),
        'lab_custom': os.path.join(BRAIN_DIR, 'print_lab_custom_1791011481251.jpg'),
        'lab_prototype': os.path.join(BRAIN_DIR, 'print_lab_prototype_1791011505374.jpg'),
        'lab_design': os.path.join(BRAIN_DIR, 'print_lab_design_1791011525002.jpg'),
        'lab_figurine': os.path.join(BRAIN_DIR, 'print_lab_figurine_1791011545724.jpg'),
        'transform_physical': os.path.join(BRAIN_DIR, 'transform_physical_gem_1791011631702.jpg'),
        'wall_01': os.path.join(BRAIN_DIR, 'wall_drone_casing_1791011654332.jpg'),
        'wall_02': os.path.join(BRAIN_DIR, 'wall_spiral_luminary_1791011844351.jpg'),
        'wall_03': os.path.join(BRAIN_DIR, 'wall_robotic_gripper_1791011884171.jpg'),
        'wall_04': os.path.join(BRAIN_DIR, 'wall_arch_pavilion_1791011908907.jpg'),
    }

    # 1. Hero object
    print("1. Hero object...")
    hero_cutout = create_cutout(brain_files['hero'], threshold=232, sat_thresh=15)
    hero_out = os.path.join(PUBLIC_DIR, 'assets', 'hero', 'falcon-hero-object.webp')
    hero_cutout.save(hero_out, 'WEBP', quality=95)
    shutil.copyfile(hero_out, os.path.join(PUBLIC_DIR, 'products', 'falcon-hero-object.webp'))

    # 2. Hero fragments
    print("2. Hero fragments...")
    f1_cutout = create_cutout(brain_files['fragment1'], threshold=225, sat_thresh=20)
    f1_out = os.path.join(PUBLIC_DIR, 'assets', 'hero', 'hero-fragment-01.webp')
    f1_cutout.save(f1_out, 'WEBP', quality=95)

    f2_cutout = create_cutout(brain_files['fragment2'], threshold=225, sat_thresh=20)
    f2_out = os.path.join(PUBLIC_DIR, 'assets', 'hero', 'hero-fragment-02.webp')
    f2_cutout.save(f2_out, 'WEBP', quality=95)

    # 3. Print Lab
    print("3. Print Lab assets...")
    lab_c = create_cutout(brain_files['lab_custom'], threshold=228, sat_thresh=18)
    lab_c.save(os.path.join(PUBLIC_DIR, 'assets', 'print-lab', 'lab-custom.webp'), 'WEBP', quality=95)

    lab_p = create_cutout(brain_files['lab_prototype'], threshold=228, sat_thresh=18)
    lab_p.save(os.path.join(PUBLIC_DIR, 'assets', 'print-lab', 'lab-prototype.webp'), 'WEBP', quality=95)

    lab_d = optimize_image(brain_files['lab_design'])
    lab_d.save(os.path.join(PUBLIC_DIR, 'assets', 'print-lab', 'lab-design.webp'), 'WEBP', quality=90)

    lab_f = create_cutout(brain_files['lab_figurine'], threshold=228, sat_thresh=18)
    lab_f.save(os.path.join(PUBLIC_DIR, 'assets', 'print-lab', 'lab-figurine.webp'), 'WEBP', quality=95)

    # 4. Transform physical object
    print("4. Transform physical object...")
    t_phys = create_cutout(brain_files['transform_physical'], threshold=230, sat_thresh=18)
    t_phys.save(os.path.join(PUBLIC_DIR, 'assets', 'transform', 'transform-physical.webp'), 'WEBP', quality=95)

    # 5. About workshop photo
    print("5. About workshop photo...")
    about_img = optimize_image(brain_files['studio'])
    about_out = os.path.join(PUBLIC_DIR, 'assets', 'about', 'workshop-studio.webp')
    about_img.save(about_out, 'WEBP', quality=90)

    # 6. Workshop Wall (6 items)
    print("6. Workshop Wall items...")
    wall_sources = [
        brain_files['wall_01'],
        brain_files['wall_02'],
        brain_files['wall_03'],
        brain_files['wall_04'],
        brain_files['lab_prototype'],
        brain_files['lab_figurine'],
    ]

    for i, src in enumerate(wall_sources, start=1):
        w_img = optimize_image(src)
        out_path = os.path.join(PUBLIC_DIR, 'assets', 'workshop-wall', f'wall-0{i}.webp')
        w_img.save(out_path, 'WEBP', quality=90)
        # Also copy to /products/wall-0i.webp for legacy compatibility
        shutil.copyfile(out_path, os.path.join(PUBLIC_DIR, 'products', f'wall-0{i}.webp'))
        print(f"  Wall-0{i} saved to {out_path}")

    # 7. Sample Wall (7 items)
    print("7. Sample Wall items...")
    sample_sources = [
        brain_files['wall_01'],         # drone casing
        brain_files['wall_02'],         # spiral luminary
        brain_files['wall_03'],         # robotic gripper
        brain_files['wall_04'],         # arch pavilion
        brain_files['lab_prototype'],    # gimbal mount
        brain_files['fragment2'],       # honeycomb node
        brain_files['lab_custom'],      # acoustic vase
    ]

    for i, src in enumerate(sample_sources, start=1):
        s_img = optimize_image(src)
        out_path = os.path.join(PUBLIC_DIR, 'assets', 'samples', f'sample-{i}.webp')
        s_img.save(out_path, 'WEBP', quality=90)
        shutil.copyfile(out_path, os.path.join(PUBLIC_DIR, 'samples', f'sample-{i}.webp'))
        print(f"  Sample-{i} saved to {out_path}")

    print("All assets processed and deployed successfully!")

if __name__ == '__main__':
    main()
