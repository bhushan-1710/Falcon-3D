"""
Falcon 3D Prints — Comprehensive Artifact Generation Engine
Generates the cohesive, engineered, tactile, premium master object family.
All 12 assets are rendered at high resolution (2000x1600) and downsampled with Lanczos
to 1000x800 for pristine anti-aliased presentation.
"""

import math
import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUTPUT_DIR = "public/assets/falcon/artifacts"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── MASTER 3D PROJECTION SYSTEM ─────────────────────────────────────────────
# Shared across all states for 100% geometric continuity.
YAW = math.radians(34)
PITCH = math.radians(26)
SCALE = 8.4
CX = 1000.0
CY = 860.0

LIGHT_DIR = np.array([-0.55, -0.65, 0.75])
LIGHT_DIR = LIGHT_DIR / np.linalg.norm(LIGHT_DIR)

FILL_LIGHT = np.array([0.75, 0.35, 0.45])
FILL_LIGHT = FILL_LIGHT / np.linalg.norm(FILL_LIGHT)

def project_3d(x, y, z):
    """Projects 3D point (x, y, z) into 2D camera coordinates."""
    xc = x * math.cos(YAW) - y * math.sin(YAW)
    yt = x * math.sin(YAW) + y * math.cos(YAW)
    yc = yt * math.sin(PITCH) - z * math.cos(PITCH)
    return (int(round(CX + SCALE * xc)), int(round(CY + SCALE * yc)))

def compute_normal(v0, v1, v2):
    edge1 = np.array(v1) - np.array(v0)
    edge2 = np.array(v2) - np.array(v0)
    n = np.cross(edge1, edge2)
    norm = np.linalg.norm(n)
    if norm < 1e-6:
        return np.array([0.0, 0.0, 1.0])
    return n / norm

def calculate_shading(normal, base_color, ambient=0.28, diffuse=0.62, specular=0.18, shininess=24):
    n_dot_l = max(0.0, float(np.dot(normal, LIGHT_DIR)))
    n_dot_fill = max(0.0, float(np.dot(normal, FILL_LIGHT)))
    view_dir = np.array([0.0, 0.0, 1.0])
    half_vec = (LIGHT_DIR + view_dir)
    half_vec = half_vec / np.linalg.norm(half_vec)
    n_dot_h = max(0.0, float(np.dot(normal, half_vec)))
    spec = (n_dot_h ** shininess) * specular
    intensity = min(1.0, ambient + diffuse * (0.85 * n_dot_l + 0.25 * n_dot_fill))
    r = int(min(255, base_color[0] * intensity + 255 * spec))
    g = int(min(255, base_color[1] * intensity + 255 * spec))
    b = int(min(255, base_color[2] * intensity + 255 * spec))
    return (r, g, b, 255)

def get_rounded_rect_3d_points(half_x, half_y, z, r, num_pts_per_corner=8):
    """Returns list of 3D points for a rounded rectangle slice at height z."""
    pts = []
    # Corners: Top-Right (X+, Y+), Top-Left (X-, Y+), Bottom-Left (X-, Y-), Bottom-Right (X+, Y-)
    corners = [
        (half_x - r, half_y - r, 0, math.pi / 2),
        (-half_x + r, half_y - r, math.pi / 2, math.pi),
        (-half_x + r, -half_y + r, math.pi, 3 * math.pi / 2),
        (half_x - r, -half_y + r, 3 * math.pi / 2, 2 * math.pi),
    ]
    for cx_c, cy_c, start_ang, end_ang in corners:
        for i in range(num_pts_per_corner):
            ang = start_ang + (end_ang - start_ang) * (i / (num_pts_per_corner - 1))
            px = cx_c + r * math.cos(ang)
            py = cy_c + r * math.sin(ang)
            pts.append((px, py, z))
    return pts

def create_contact_shadow(w=2000, h=1600, rx=480, ry=200, cy_offset=130):
    """Generates soft, grounded physical contact drop shadow."""
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = int(CX), int(CY + cy_offset)
    
    # 3-tier gaussian blur shadow
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(10, 10, 10, 75))
    d.ellipse([cx - int(rx * 0.72), cy - int(ry * 0.65), cx + int(rx * 0.72), cy + int(ry * 0.65)], fill=(8, 8, 8, 140))
    d.ellipse([cx - int(rx * 0.45), cy - int(ry * 0.4), cx + int(rx * 0.45), cy + int(ry * 0.4)], fill=(4, 4, 4, 210))
    
    return img.filter(ImageFilter.GaussianBlur(radius=38))

def apply_layer_lines(canvas, mask, spacing=4, intensity=0.08):
    """Applies authentic micro 3D print layer striations."""
    h, w = canvas.shape[:2]
    overlay = np.ones((h, w), dtype=np.float32)
    for y in range(0, h, spacing):
        overlay[y:y+1, :] = 1.0 - intensity
        if y + 1 < h:
            overlay[y+1:y+2, :] = 1.0 + intensity * 0.6
    
    for c in range(3):
        canvas[:, :, c] = np.clip(canvas[:, :, c].astype(np.float32) * overlay, 0, 255).astype(np.uint8)

# ─── 1. MASTER PHYSICAL ENCLOSURE (10_d2p_object.webp & 01_hero_enclosure.webp)
def render_master_enclosure():
    canvas = np.zeros((1600, 2000, 4), dtype=np.uint8)
    
    # Dimensions: Length 130 (-65 to 65), Width 90 (-45 to 45)
    # Base: Z=0 to 22 (Matte Black)
    # Seam: Z=22 to 23 (Recessed)
    # Shell: Z=23 to 48 (Warm off-white)
    
    # 1. Base Mounting Tabs (Left & Right)
    for sign, x_start, x_end in [(-1, -65, -78), (1, 65, 78)]:
        tab_pts = [
            (x_start, -20, 0), (x_end, -18, 0), (x_end, 18, 0), (x_start, 20, 0),
            (x_start, 20, 6), (x_end, 18, 6), (x_end, -18, 6), (x_start, -20, 6)
        ]
        p2d = [project_3d(*p) for p in tab_pts]
        # Tab top face
        top_poly = np.array([p2d[4], p2d[5], p2d[6], p2d[7]], dtype=np.int32)
        cv2.fillPoly(canvas, [top_poly], (38, 38, 42, 255), lineType=cv2.LINE_AA)
        cv2.polylines(canvas, [top_poly], True, (20, 20, 22, 255), 2, lineType=cv2.LINE_AA)
        # Mounting hole
        hole_c = project_3d((x_start + x_end) / 2, 0, 6)
        cv2.circle(canvas, hole_c, 14, (15, 15, 18, 255), -1, lineType=cv2.LINE_AA)
        cv2.circle(canvas, hole_c, 14, (45, 45, 50, 255), 2, lineType=cv2.LINE_AA)

    # 2. Base Chassis Walls (Z: 0 -> 22, Matte Black)
    base_lower_3d = get_rounded_rect_3d_points(65, 45, 0, 12, 12)
    base_upper_3d = get_rounded_rect_3d_points(65, 45, 22, 12, 12)
    base_lower_2d = np.array([project_3d(*p) for p in base_lower_3d], dtype=np.int32)
    base_upper_2d = np.array([project_3d(*p) for p in base_upper_3d], dtype=np.int32)
    
    n_pts = len(base_lower_3d)
    for i in range(n_pts):
        j = (i + 1) % n_pts
        p1 = base_lower_3d[i]
        p2 = base_lower_3d[j]
        p3 = base_upper_3d[j]
        p4 = base_upper_3d[i]
        norm = compute_normal(p1, p2, p3)
        # Only draw front-facing walls
        if norm[0] * math.cos(YAW) - norm[1] * math.sin(YAW) < 0.85:
            poly = np.array([project_3d(*p1), project_3d(*p2), project_3d(*p3), project_3d(*p4)], dtype=np.int32)
            color = calculate_shading(norm, (35, 36, 40), ambient=0.25, diffuse=0.65, specular=0.15)
            cv2.fillPoly(canvas, [poly], color, lineType=cv2.LINE_AA)
    
    # Louver ventilation slots on Front-Left Base Wall (Y = -45)
    for z_louver in [6, 10, 14, 18]:
        l_pts = [
            (-48, -45, z_louver), (-12, -45, z_louver),
            (-12, -45, z_louver + 2), (-48, -45, z_louver + 2)
        ]
        l_poly = np.array([project_3d(*p) for p in l_pts], dtype=np.int32)
        cv2.fillPoly(canvas, [l_poly], (12, 12, 14, 255), lineType=cv2.LINE_AA)
        cv2.polylines(canvas, [l_poly], True, (48, 50, 56, 255), 1, lineType=cv2.LINE_AA)

    # USB-C Port Cutout on Front-Right Base Wall (Y = -45)
    port_pts = [
        (16, -45, 8), (42, -45, 8),
        (42, -45, 16), (16, -45, 16)
    ]
    port_poly = np.array([project_3d(*p) for p in port_pts], dtype=np.int32)
    cv2.fillPoly(canvas, [port_poly], (10, 10, 12, 255), lineType=cv2.LINE_AA)
    cv2.polylines(canvas, [port_poly], True, (55, 55, 60, 255), 2, lineType=cv2.LINE_AA)
    # Subtle Falcon Orange internal connector housing
    tongue_pts = [(22, -44, 11), (36, -44, 11), (36, -44, 13), (22, -44, 13)]
    tongue_poly = np.array([project_3d(*p) for p in tongue_pts], dtype=np.int32)
    cv2.fillPoly(canvas, [tongue_poly], (243, 107, 22, 255), lineType=cv2.LINE_AA)

    # 3. Parting Seam Line (Z: 22 -> 23.5)
    seam_lower_3d = get_rounded_rect_3d_points(64.2, 44.2, 22, 12, 12)
    seam_upper_3d = get_rounded_rect_3d_points(64.2, 44.2, 23.5, 12, 12)
    for i in range(len(seam_lower_3d)):
        j = (i + 1) % len(seam_lower_3d)
        p1 = seam_lower_3d[i]
        p2 = seam_lower_3d[j]
        p3 = seam_upper_3d[j]
        p4 = seam_upper_3d[i]
        norm = compute_normal(p1, p2, p3)
        if norm[0] * math.cos(YAW) - norm[1] * math.sin(YAW) < 0.85:
            poly = np.array([project_3d(*p1), project_3d(*p2), project_3d(*p3), project_3d(*p4)], dtype=np.int32)
            cv2.fillPoly(canvas, [poly], (18, 18, 20, 255), lineType=cv2.LINE_AA)

    # 4. Top Removable Shell Walls (Z: 23.5 -> 45, Warm Off-White)
    shell_lower_3d = get_rounded_rect_3d_points(65, 45, 23.5, 12, 12)
    shell_upper_3d = get_rounded_rect_3d_points(65, 45, 45, 12, 12)
    for i in range(len(shell_lower_3d)):
        j = (i + 1) % len(shell_lower_3d)
        p1 = shell_lower_3d[i]
        p2 = shell_lower_3d[j]
        p3 = shell_upper_3d[j]
        p4 = shell_upper_3d[i]
        norm = compute_normal(p1, p2, p3)
        if norm[0] * math.cos(YAW) - norm[1] * math.sin(YAW) < 0.85:
            poly = np.array([project_3d(*p1), project_3d(*p2), project_3d(*p3), project_3d(*p4)], dtype=np.int32)
            color = calculate_shading(norm, (234, 229, 220), ambient=0.32, diffuse=0.62, specular=0.18)
            cv2.fillPoly(canvas, [poly], color, lineType=cv2.LINE_AA)

    # 5. Top Shell Chamfer (Z: 45 -> 48)
    chamf_lower_3d = get_rounded_rect_3d_points(65, 45, 45, 12, 12)
    chamf_upper_3d = get_rounded_rect_3d_points(62, 42, 48, 10, 12)
    for i in range(len(chamf_lower_3d)):
        j = (i + 1) % len(chamf_lower_3d)
        p1 = chamf_lower_3d[i]
        p2 = chamf_lower_3d[j]
        p3 = chamf_upper_3d[j]
        p4 = chamf_upper_3d[i]
        norm = compute_normal(p1, p2, p3)
        poly = np.array([project_3d(*p1), project_3d(*p2), project_3d(*p3), project_3d(*p4)], dtype=np.int32)
        color = calculate_shading(norm, (244, 240, 232), ambient=0.35, diffuse=0.65, specular=0.22)
        cv2.fillPoly(canvas, [poly], color, lineType=cv2.LINE_AA)

    # 6. Top Lid Surface (Z: 48, Warm Off-White)
    top_3d = get_rounded_rect_3d_points(62, 42, 48, 10, 16)
    top_2d = np.array([project_3d(*p) for p in top_3d], dtype=np.int32)
    norm_top = np.array([0.0, 0.0, 1.0])
    top_color = calculate_shading(norm_top, (246, 242, 235), ambient=0.38, diffuse=0.62, specular=0.25)
    cv2.fillPoly(canvas, [top_2d], top_color, lineType=cv2.LINE_AA)

    # Recessed Center Plateau (Z: 46.5) with Falcon Orange Gasket Accent
    plat_outer_3d = get_rounded_rect_3d_points(44, 26, 48, 6, 12)
    plat_outer_2d = np.array([project_3d(*p) for p in plat_outer_3d], dtype=np.int32)
    cv2.polylines(canvas, [plat_outer_2d], True, (243, 107, 22, 255), 3, lineType=cv2.LINE_AA)
    
    plat_inner_3d = get_rounded_rect_3d_points(42, 24, 46.5, 5, 12)
    plat_inner_2d = np.array([project_3d(*p) for p in plat_inner_3d], dtype=np.int32)
    cv2.fillPoly(canvas, [plat_inner_2d], (235, 230, 222, 255), lineType=cv2.LINE_AA)
    cv2.polylines(canvas, [plat_inner_2d], True, (215, 210, 202, 255), 1, lineType=cv2.LINE_AA)

    # Technical Markings on Plateau
    text_pos = project_3d(-24, 0, 46.5)
    cv2.putText(canvas, "FALCON PROTO-01", (text_pos[0], text_pos[1] + 4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (160, 155, 146, 255), 1, lineType=cv2.LINE_AA)
    led_pos = project_3d(28, 0, 46.5)
    cv2.circle(canvas, led_pos, 4, (243, 107, 22, 255), -1, lineType=cv2.LINE_AA)

    # 7. Four Counterbored Socket Head Screws (+-48, +-30)
    for bx, by in [(-48, -28), (48, -28), (48, 28), (-48, 28)]:
        c_proj = project_3d(bx, by, 48)
        # Outer counterbore pocket
        cv2.circle(canvas, c_proj, 24, (200, 195, 186, 255), -1, lineType=cv2.LINE_AA)
        cv2.circle(canvas, c_proj, 24, (165, 160, 152, 255), 2, lineType=cv2.LINE_AA)
        # Inner cylindrical screw head (metallic steel `#3A3A3E`)
        cv2.circle(canvas, c_proj, 19, (55, 56, 60, 255), -1, lineType=cv2.LINE_AA)
        cv2.circle(canvas, c_proj, 19, (85, 86, 92, 255), 2, lineType=cv2.LINE_AA)
        # Hex socket keyway
        hex_pts = []
        for a in range(6):
            ang = a * math.pi / 3 + math.radians(20)
            hx = int(c_proj[0] + 9 * math.cos(ang))
            hy = int(c_proj[1] + 9 * math.sin(ang))
            hex_pts.append((hx, hy))
        cv2.fillPoly(canvas, [np.array(hex_pts, dtype=np.int32)], (20, 20, 24, 255), lineType=cv2.LINE_AA)

    # Layer line tactile micro-texture
    apply_layer_lines(canvas, None, spacing=4, intensity=0.06)

    # Composite with ground contact shadow
    shadow = create_contact_shadow()
    pil_obj = Image.fromarray(canvas)
    final_img = Image.alpha_composite(shadow, pil_obj)
    
    # Downsample from 2000x1600 to 1000x800 for high-quality anti-aliased output
    return final_img.resize((1000, 800), Image.Resampling.LANCZOS)

# ─── 2. MASTER CAD MODEL (04_design_cad.webp & 08_d2p_model.webp)
def render_cad_model(on_cream_bg=True):
    canvas = np.zeros((1600, 2000, 4), dtype=np.uint8)
    if on_cream_bg:
        canvas[:, :] = (242, 230, 218, 255)  # #F2E6DA warm paper background
    
    wire_color = (42, 40, 38, 255)
    orange_color = (243, 107, 22, 255)
    
    # Base Mounting Tabs
    for sign, x_start, x_end in [(-1, -65, -78), (1, 65, 78)]:
        tab_pts = [
            (x_start, -20, 0), (x_end, -18, 0), (x_end, 18, 0), (x_start, 20, 0),
            (x_start, 20, 6), (x_end, 18, 6), (x_end, -18, 6), (x_start, -20, 6)
        ]
        p2d = [project_3d(*p) for p in tab_pts]
        top_poly = np.array([p2d[4], p2d[5], p2d[6], p2d[7]], dtype=np.int32)
        cv2.fillPoly(canvas, [top_poly], (205, 198, 188, 255), lineType=cv2.LINE_AA)
        cv2.polylines(canvas, [top_poly], True, wire_color, 2, lineType=cv2.LINE_AA)
        hole_c = project_3d((x_start + x_end) / 2, 0, 6)
        cv2.circle(canvas, hole_c, 14, (160, 154, 145, 255), -1, lineType=cv2.LINE_AA)
        cv2.circle(canvas, hole_c, 14, wire_color, 2, lineType=cv2.LINE_AA)

    # Base Chassis CAD Shading
    base_lower_3d = get_rounded_rect_3d_points(65, 45, 0, 12, 12)
    base_upper_3d = get_rounded_rect_3d_points(65, 45, 22, 12, 12)
    for i in range(len(base_lower_3d)):
        j = (i + 1) % len(base_lower_3d)
        p1 = base_lower_3d[i]; p2 = base_lower_3d[j]; p3 = base_upper_3d[j]; p4 = base_upper_3d[i]
        norm = compute_normal(p1, p2, p3)
        if norm[0] * math.cos(YAW) - norm[1] * math.sin(YAW) < 0.85:
            poly = np.array([project_3d(*p1), project_3d(*p2), project_3d(*p3), project_3d(*p4)], dtype=np.int32)
            cv2.fillPoly(canvas, [poly], (175, 168, 158, 255), lineType=cv2.LINE_AA)
            cv2.polylines(canvas, [poly], True, wire_color, 1, lineType=cv2.LINE_AA)

    # Louvers
    for z_louver in [6, 10, 14, 18]:
        l_pts = [(-48, -45, z_louver), (-12, -45, z_louver), (-12, -45, z_louver + 2), (-48, -45, z_louver + 2)]
        l_poly = np.array([project_3d(*p) for p in l_pts], dtype=np.int32)
        cv2.fillPoly(canvas, [l_poly], (140, 134, 125, 255), lineType=cv2.LINE_AA)
        cv2.polylines(canvas, [l_poly], True, wire_color, 1, lineType=cv2.LINE_AA)

    # USB-C Cutout
    port_pts = [(16, -45, 8), (42, -45, 8), (42, -45, 16), (16, -45, 16)]
    port_poly = np.array([project_3d(*p) for p in port_pts], dtype=np.int32)
    cv2.fillPoly(canvas, [port_poly], (140, 134, 125, 255), lineType=cv2.LINE_AA)
    cv2.polylines(canvas, [port_poly], True, orange_color, 2, lineType=cv2.LINE_AA)

    # Seam Groove
    seam_pts = [project_3d(*p) for p in get_rounded_rect_3d_points(65, 45, 22, 12, 12)]
    cv2.polylines(canvas, [np.array(seam_pts, dtype=np.int32)], True, orange_color, 2, lineType=cv2.LINE_AA)

    # Top Shell CAD Shading
    shell_lower_3d = get_rounded_rect_3d_points(65, 45, 23.5, 12, 12)
    shell_upper_3d = get_rounded_rect_3d_points(65, 45, 45, 12, 12)
    for i in range(len(shell_lower_3d)):
        j = (i + 1) % len(shell_lower_3d)
        p1 = shell_lower_3d[i]; p2 = shell_lower_3d[j]; p3 = shell_upper_3d[j]; p4 = shell_upper_3d[i]
        norm = compute_normal(p1, p2, p3)
        if norm[0] * math.cos(YAW) - norm[1] * math.sin(YAW) < 0.85:
            poly = np.array([project_3d(*p1), project_3d(*p2), project_3d(*p3), project_3d(*p4)], dtype=np.int32)
            cv2.fillPoly(canvas, [poly], (205, 198, 188, 255), lineType=cv2.LINE_AA)
            cv2.polylines(canvas, [poly], True, wire_color, 1, lineType=cv2.LINE_AA)

    # Chamfer & Top Lid
    chamf_lower_3d = get_rounded_rect_3d_points(65, 45, 45, 12, 12)
    chamf_upper_3d = get_rounded_rect_3d_points(62, 42, 48, 10, 12)
    for i in range(len(chamf_lower_3d)):
        j = (i + 1) % len(chamf_lower_3d)
        poly = np.array([project_3d(*chamf_lower_3d[i]), project_3d(*chamf_lower_3d[j]),
                         project_3d(*chamf_upper_3d[j]), project_3d(*chamf_upper_3d[i])], dtype=np.int32)
        cv2.fillPoly(canvas, [poly], (220, 214, 205, 255), lineType=cv2.LINE_AA)
        cv2.polylines(canvas, [poly], True, wire_color, 1, lineType=cv2.LINE_AA)

    top_3d = get_rounded_rect_3d_points(62, 42, 48, 10, 16)
    top_2d = np.array([project_3d(*p) for p in top_3d], dtype=np.int32)
    cv2.fillPoly(canvas, [top_2d], (236, 230, 222, 255), lineType=cv2.LINE_AA)
    cv2.polylines(canvas, [top_2d], True, wire_color, 2, lineType=cv2.LINE_AA)

    # Plateau & Fastener Counterbores
    plat_outer_2d = np.array([project_3d(*p) for p in get_rounded_rect_3d_points(44, 26, 48, 6, 12)], dtype=np.int32)
    cv2.polylines(canvas, [plat_outer_2d], True, orange_color, 2, lineType=cv2.LINE_AA)
    
    for bx, by in [(-48, -28), (48, -28), (48, 28), (-48, 28)]:
        c_proj = project_3d(bx, by, 48)
        cv2.circle(canvas, c_proj, 22, (215, 208, 198, 255), -1, lineType=cv2.LINE_AA)
        cv2.circle(canvas, c_proj, 22, wire_color, 2, lineType=cv2.LINE_AA)
        cv2.circle(canvas, c_proj, 14, orange_color, 2, lineType=cv2.LINE_AA)
        # Center crosshair
        cv2.line(canvas, (c_proj[0] - 8, c_proj[1]), (c_proj[0] + 8, c_proj[1]), orange_color, 1, lineType=cv2.LINE_AA)
        cv2.line(canvas, (c_proj[0], c_proj[1] - 8), (c_proj[0], c_proj[1] + 8), orange_color, 1, lineType=cv2.LINE_AA)

    # Technical Callouts for DESIGN state
    if on_cream_bg:
        # Leader line to M3 Brass Inserts
        p_bolt = project_3d(48, -28, 48)
        cv2.line(canvas, p_bolt, (p_bolt[0] + 120, p_bolt[1] - 80), orange_color, 2, lineType=cv2.LINE_AA)
        cv2.line(canvas, (p_bolt[0] + 120, p_bolt[1] - 80), (p_bolt[0] + 280, p_bolt[1] - 80), orange_color, 2, lineType=cv2.LINE_AA)
        cv2.putText(canvas, "M3 FASTENER POCKET", (p_bolt[0] + 130, p_bolt[1] - 92),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.75, (20, 20, 20, 255), 2, lineType=cv2.LINE_AA)
        
        # Leader line to Louver Slots
        p_louv = project_3d(-30, -45, 12)
        cv2.line(canvas, p_louv, (p_louv[0] - 100, p_louv[1] + 80), orange_color, 2, lineType=cv2.LINE_AA)
        cv2.line(canvas, (p_louv[0] - 100, p_louv[1] + 80), (p_louv[0] - 260, p_louv[1] + 80), orange_color, 2, lineType=cv2.LINE_AA)
        cv2.putText(canvas, "VENTILATION LOUVERS", (p_louv[0] - 260, p_louv[1] + 68),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.75, (20, 20, 20, 255), 2, lineType=cv2.LINE_AA)
        
        # Coordinate Triad at Origin [X, Y, Z]
        orig = project_3d(0, 0, 0)
        px_axis = project_3d(24, 0, 0)
        py_axis = project_3d(0, 24, 0)
        pz_axis = project_3d(0, 0, 24)
        cv2.line(canvas, orig, px_axis, (243, 107, 22, 255), 2, lineType=cv2.LINE_AA)
        cv2.line(canvas, orig, py_axis, (42, 40, 38, 255), 2, lineType=cv2.LINE_AA)
        cv2.line(canvas, orig, pz_axis, (42, 40, 38, 255), 2, lineType=cv2.LINE_AA)

    pil_img = Image.fromarray(canvas)
    return pil_img.resize((1000, 800), Image.Resampling.LANCZOS)

# ─── 3. DIGITAL -> PHYSICAL: 07_d2p_idea.webp (Wireframe Blueprint)
def render_d2p_idea():
    canvas = np.zeros((1600, 2000, 4), dtype=np.uint8)
    wire_bright = (245, 241, 233, 210)
    orange_bright = (243, 107, 22, 255)
    
    # Contour loops at key elevations: Z=0, Z=22 (seam), Z=45 (chamfer), Z=48 (lid)
    for z, col, w in [(0, wire_bright, 2), (22, orange_bright, 2), (45, wire_bright, 2), (48, wire_bright, 2)]:
        pts = [project_3d(*p) for p in get_rounded_rect_3d_points(65, 45, z, 12, 16)]
        cv2.polylines(canvas, [np.array(pts, dtype=np.int32)], True, col, w, lineType=cv2.LINE_AA)
    
    # Vertical rib struts
    for p_low, p_high in zip(get_rounded_rect_3d_points(65, 45, 0, 12, 16), get_rounded_rect_3d_points(65, 45, 48, 12, 16)):
        p1 = project_3d(*p_low); p2 = project_3d(*p_high)
        cv2.line(canvas, p1, p2, (245, 241, 233, 75), 1, lineType=cv2.LINE_AA)

    # 4 Fastener Bosses with glowing vertex nodes
    for bx, by in [(-48, -28), (48, -28), (48, 28), (-48, 28)]:
        c_proj = project_3d(bx, by, 48)
        cv2.circle(canvas, c_proj, 18, orange_bright, 2, lineType=cv2.LINE_AA)
        cv2.circle(canvas, c_proj, 4, orange_bright, -1, lineType=cv2.LINE_AA)

    # Center Plateau & Origin Crosshair
    plat_pts = [project_3d(*p) for p in get_rounded_rect_3d_points(44, 26, 48, 6, 12)]
    cv2.polylines(canvas, [np.array(plat_pts, dtype=np.int32)], True, orange_bright, 2, lineType=cv2.LINE_AA)
    
    orig = project_3d(0, 0, 24)
    cv2.circle(canvas, orig, 6, orange_bright, -1, lineType=cv2.LINE_AA)
    cv2.line(canvas, (orig[0] - 25, orig[1]), (orig[0] + 25, orig[1]), orange_bright, 2, lineType=cv2.LINE_AA)
    cv2.line(canvas, (orig[0], orig[1] - 25), (orig[0], orig[1] + 25), orange_bright, 2, lineType=cv2.LINE_AA)

    # Technical Bounding Envelope
    bbox_corners = [
        (-78, -48, 0), (78, -48, 0), (78, 48, 0), (-78, 48, 0),
        (-78, -48, 52), (78, -48, 52), (78, 48, 52), (-78, 48, 52)
    ]
    p_box = [project_3d(*p) for p in bbox_corners]
    # Draw dashed bounding lines
    for i in range(4):
        cv2.line(canvas, p_box[i], p_box[(i+1)%4], (245, 241, 233, 40), 1, lineType=cv2.LINE_AA)
        cv2.line(canvas, p_box[i+4], p_box[((i+1)%4)+4], (245, 241, 233, 40), 1, lineType=cv2.LINE_AA)
        cv2.line(canvas, p_box[i], p_box[i+4], (245, 241, 233, 40), 1, lineType=cv2.LINE_AA)

    pil_img = Image.fromarray(canvas)
    return pil_img.resize((1000, 800), Image.Resampling.LANCZOS)

# ─── 4. DIGITAL -> PHYSICAL: 09_d2p_build.webp (Sliced Enclosure Layers)
def render_d2p_build():
    canvas = np.zeros((1600, 2000, 4), dtype=np.uint8)
    orange_toolpath = (243, 107, 22, 255)
    orange_dim = (243, 107, 22, 120)
    layer_strata = (70, 72, 80, 255)
    
    # 48 physical slices along Z axis from base to top
    for z in range(0, 49):
        # Determine exact geometry profile at height z
        if z <= 6:
            # Base with mounting tabs
            pts_main = get_rounded_rect_3d_points(65, 45, z, 12, 12)
        elif z <= 22:
            # Lower chassis
            pts_main = get_rounded_rect_3d_points(65, 45, z, 12, 12)
        elif z <= 24:
            # Parting seam
            pts_main = get_rounded_rect_3d_points(64.2, 44.2, z, 12, 12)
        elif z <= 44:
            # Upper shell
            pts_main = get_rounded_rect_3d_points(65, 45, z, 12, 12)
        else:
            # Top chamfer narrowing
            factor = (48 - z) / 4.0
            pts_main = get_rounded_rect_3d_points(62 + 3 * factor, 42 + 3 * factor, z, 10, 12)
        
        p2d = np.array([project_3d(*p) for p in pts_main], dtype=np.int32)
        
        # Every 4th layer gets glowing toolpath contour
        if z % 4 == 0:
            cv2.polylines(canvas, [p2d], True, orange_toolpath, 2, lineType=cv2.LINE_AA)
            # Infill hatching lines inside the layer contour
            if z % 8 == 0:
                p_left = project_3d(-40, 0, z)
                p_right = project_3d(40, 0, z)
                cv2.line(canvas, p_left, p_right, orange_dim, 1, lineType=cv2.LINE_AA)
        else:
            cv2.polylines(canvas, [p2d], True, layer_strata, 1, lineType=cv2.LINE_AA)

    # 4 Fastener counterbore vertical guide cylinders
    for bx, by in [(-48, -28), (48, -28), (48, 28), (-48, 28)]:
        p_base = project_3d(bx, by, 22)
        p_top = project_3d(bx, by, 48)
        cv2.line(canvas, p_base, p_top, orange_toolpath, 2, lineType=cv2.LINE_AA)
        cv2.circle(canvas, p_top, 16, orange_toolpath, 2, lineType=cv2.LINE_AA)

    # Slicing extruder nozzle indicator
    nozzle_pos = project_3d(32, -45, 36)
    cv2.circle(canvas, nozzle_pos, 7, (243, 107, 22, 255), -1, lineType=cv2.LINE_AA)
    cv2.circle(canvas, nozzle_pos, 14, (243, 107, 22, 140), 2, lineType=cv2.LINE_AA)

    pil_img = Image.fromarray(canvas)
    return pil_img.resize((1000, 800), Image.Resampling.LANCZOS)

# ─── 5. PRINT LAB: 02_custom_object.webp (Personalized Acoustic Wave Vessel)
def render_custom_object():
    canvas = np.zeros((1600, 2000, 4), dtype=np.uint8)
    
    # Parametric acoustic diffuser vessel in warm cream PLA with sculpted acoustic fins
    num_strata = 64
    for i in range(num_strata):
        z = i * 1.4
        t = i / num_strata
        # Modulated radius creating organic acoustic wave profile
        r = 38 + 14 * math.sin(t * math.pi * 3.5)
        # Twisted polygon slice
        pts_3d = []
        num_verts = 28
        twist = t * 1.2
        for v in range(num_verts):
            ang = v * (2 * math.pi / num_verts) + twist
            # Ripple modulation
            rad = r + 6 * math.sin(ang * 8)
            px = rad * math.cos(ang)
            py = rad * math.sin(ang)
            pts_3d.append((px, py, z))
        
        p2d = np.array([project_3d(*p) for p in pts_3d], dtype=np.int32)
        
        # Color gradient: dark graphite base to warm cream top
        cr = int(35 + t * (240 - 35))
        cg = int(36 + t * (235 - 36))
        cb = int(40 + t * (224 - 40))
        cv2.fillPoly(canvas, [p2d], (cr, cg, cb, 255), lineType=cv2.LINE_AA)
        cv2.polylines(canvas, [p2d], True, (max(0, cr - 25), max(0, cg - 25), max(0, cb - 25), 255), 1, lineType=cv2.LINE_AA)

    apply_layer_lines(canvas, None, spacing=4, intensity=0.07)
    shadow = create_contact_shadow(rx=360, ry=160, cy_offset=110)
    pil_obj = Image.fromarray(canvas)
    final_img = Image.alpha_composite(shadow, pil_obj)
    return final_img.resize((1000, 800), Image.Resampling.LANCZOS)

# ─── 6. PRINT LAB: 03_prototype_enclosure.webp (Internal Functional Assembly)
def render_prototype_assembly():
    canvas = np.zeros((1600, 2000, 4), dtype=np.uint8)
    
    # Base chassis with interior exposed (open shell):
    # Base floor and outer wall in graphite CF-PETG
    base_lower_3d = get_rounded_rect_3d_points(65, 45, 0, 12, 16)
    base_upper_3d = get_rounded_rect_3d_points(65, 45, 22, 12, 16)
    
    # Base floor plate
    floor_2d = np.array([project_3d(*p) for p in base_lower_3d], dtype=np.int32)
    cv2.fillPoly(canvas, [floor_2d], (30, 31, 35, 255), lineType=cv2.LINE_AA)

    # Internal PCB bay pocket (recessed inside base)
    pcb_3d = get_rounded_rect_3d_points(52, 34, 4, 6, 12)
    pcb_2d = np.array([project_3d(*p) for p in pcb_3d], dtype=np.int32)
    cv2.fillPoly(canvas, [pcb_2d], (20, 22, 25, 255), lineType=cv2.LINE_AA)
    cv2.polylines(canvas, [pcb_2d], True, (243, 107, 22, 255), 2, lineType=cv2.LINE_AA)

    # 4 Knurled Brass Heat-Set Threaded Inserts at Corner Standoffs
    for bx, by in [(-48, -28), (48, -28), (48, 28), (-48, 28)]:
        # Standoff pillar (Z: 0 -> 18)
        p_base = project_3d(bx, by, 0)
        p_top = project_3d(bx, by, 18)
        cv2.circle(canvas, p_top, 22, (45, 46, 52, 255), -1, lineType=cv2.LINE_AA)
        cv2.circle(canvas, p_top, 22, (65, 66, 74, 255), 2, lineType=cv2.LINE_AA)
        # Gold/Brass Knurled Insert
        cv2.circle(canvas, p_top, 16, (212, 160, 48, 255), -1, lineType=cv2.LINE_AA)
        cv2.circle(canvas, p_top, 16, (175, 125, 28, 255), 2, lineType=cv2.LINE_AA)
        # Internal threaded hole
        cv2.circle(canvas, p_top, 9, (35, 30, 18, 255), -1, lineType=cv2.LINE_AA)

    # Outer wall perimeter
    for i in range(len(base_lower_3d)):
        j = (i + 1) % len(base_lower_3d)
        p1 = base_lower_3d[i]; p2 = base_lower_3d[j]; p3 = base_upper_3d[j]; p4 = base_upper_3d[i]
        norm = compute_normal(p1, p2, p3)
        if norm[0] * math.cos(YAW) - norm[1] * math.sin(YAW) < 0.85:
            poly = np.array([project_3d(*p1), project_3d(*p2), project_3d(*p3), project_3d(*p4)], dtype=np.int32)
            color = calculate_shading(norm, (38, 39, 44), ambient=0.25, diffuse=0.65, specular=0.15)
            cv2.fillPoly(canvas, [poly], color, lineType=cv2.LINE_AA)
            cv2.polylines(canvas, [poly], True, (24, 24, 26, 255), 1, lineType=cv2.LINE_AA)

    # Snap-fit internal locking tabs
    for sx in [-25, 25]:
        s_pts = [(sx - 6, -42, 14), (sx + 6, -42, 14), (sx + 6, -42, 22), (sx - 6, -42, 22)]
        s_poly = np.array([project_3d(*p) for p in s_pts], dtype=np.int32)
        cv2.fillPoly(canvas, [s_poly], (243, 107, 22, 255), lineType=cv2.LINE_AA)

    apply_layer_lines(canvas, None, spacing=4, intensity=0.06)
    shadow = create_contact_shadow(rx=440, ry=180, cy_offset=125)
    pil_obj = Image.fromarray(canvas)
    final_img = Image.alpha_composite(shadow, pil_obj)
    return final_img.resize((1000, 800), Image.Resampling.LANCZOS)

# ─── 7. PRINT LAB: 06_figurine.webp (Collectible Falcon Bust)
def render_figurine():
    canvas = np.zeros((1600, 2000, 4), dtype=np.uint8)
    
    # 1. Multi-tier faceted pedestal
    # Base tier
    b1_pts = [project_3d(*p) for p in get_rounded_rect_3d_points(38, 38, 0, 8, 8)]
    b2_pts = [project_3d(*p) for p in get_rounded_rect_3d_points(38, 38, 16, 8, 8)]
    cv2.fillPoly(canvas, [np.array(b2_pts, dtype=np.int32)], (40, 40, 44, 255), lineType=cv2.LINE_AA)
    
    # Upper tier
    u1_pts = [project_3d(*p) for p in get_rounded_rect_3d_points(30, 30, 16, 6, 8)]
    u2_pts = [project_3d(*p) for p in get_rounded_rect_3d_points(30, 30, 28, 6, 8)]
    cv2.fillPoly(canvas, [np.array(u2_pts, dtype=np.int32)], (55, 56, 62, 255), lineType=cv2.LINE_AA)

    # 2. Sculpted Falcon Guardian Head / Bust in Matte Stone Resin
    # Torso chest facets
    chest_pts = [
        (-22, -18, 28), (22, -18, 28), (28, 18, 28), (-28, 18, 28),
        (0, -24, 62), (0, 0, 72)
    ]
    p_ch = [project_3d(*p) for p in chest_pts]
    # Front-left chest facet
    f1 = np.array([p_ch[0], p_ch[4], p_ch[5], p_ch[3]], dtype=np.int32)
    cv2.fillPoly(canvas, [f1], (210, 204, 195, 255), lineType=cv2.LINE_AA)
    # Front-right chest facet
    f2 = np.array([p_ch[1], p_ch[4], p_ch[5], p_ch[2]], dtype=np.int32)
    cv2.fillPoly(canvas, [f2], (185, 178, 168, 255), lineType=cv2.LINE_AA)

    # Falcon Beak / Crest facets
    head_pts = [
        (0, -32, 85), (-16, -14, 88), (16, -14, 88),
        (0, -42, 75),  # Beak tip
        (0, 16, 96),   # Crest back
        (-12, 10, 84), (12, 10, 84)
    ]
    p_hd = [project_3d(*p) for p in head_pts]
    # Beak left facet
    bk_l = np.array([p_hd[0], p_hd[3], p_hd[1]], dtype=np.int32)
    cv2.fillPoly(canvas, [bk_l], (243, 107, 22, 255), lineType=cv2.LINE_AA)
    # Beak right facet
    bk_r = np.array([p_hd[0], p_hd[3], p_hd[2]], dtype=np.int32)
    cv2.fillPoly(canvas, [bk_r], (215, 92, 16, 255), lineType=cv2.LINE_AA)
    # Forehead facet
    fh = np.array([p_hd[0], p_hd[1], p_hd[4], p_hd[2]], dtype=np.int32)
    cv2.fillPoly(canvas, [fh], (235, 230, 222, 255), lineType=cv2.LINE_AA)

    apply_layer_lines(canvas, None, spacing=4, intensity=0.05)
    shadow = create_contact_shadow(rx=300, ry=140, cy_offset=100)
    pil_obj = Image.fromarray(canvas)
    final_img = Image.alpha_composite(shadow, pil_obj)
    return final_img.resize((1000, 800), Image.Resampling.LANCZOS)

# ─── 8. 11_enclosure_exploded.webp (Exploded Assembly View)
def render_exploded_view():
    canvas = np.zeros((1600, 2000, 4), dtype=np.uint8)
    
    # Base remains at Z: 0 -> 22
    base_lower_3d = get_rounded_rect_3d_points(65, 45, 0, 12, 12)
    base_upper_3d = get_rounded_rect_3d_points(65, 45, 22, 12, 12)
    for i in range(len(base_lower_3d)):
        j = (i + 1) % len(base_lower_3d)
        p1 = base_lower_3d[i]; p2 = base_lower_3d[j]; p3 = base_upper_3d[j]; p4 = base_upper_3d[i]
        norm = compute_normal(p1, p2, p3)
        if norm[0] * math.cos(YAW) - norm[1] * math.sin(YAW) < 0.85:
            poly = np.array([project_3d(*p1), project_3d(*p2), project_3d(*p3), project_3d(*p4)], dtype=np.int32)
            cv2.fillPoly(canvas, [poly], (36, 37, 42, 255), lineType=cv2.LINE_AA)

    # Orange Gasket Seal hovering at Z: 36
    gasket_3d = get_rounded_rect_3d_points(62, 42, 36, 10, 16)
    gasket_2d = np.array([project_3d(*p) for p in gasket_3d], dtype=np.int32)
    cv2.polylines(canvas, [gasket_2d], True, (243, 107, 22, 255), 4, lineType=cv2.LINE_AA)

    # Top Shell elevated to Z: 54 -> 78
    z_elev = 32
    shell_lower_3d = get_rounded_rect_3d_points(65, 45, 23.5 + z_elev, 12, 12)
    shell_upper_3d = get_rounded_rect_3d_points(65, 45, 45 + z_elev, 12, 12)
    for i in range(len(shell_lower_3d)):
        j = (i + 1) % len(shell_lower_3d)
        p1 = shell_lower_3d[i]; p2 = shell_lower_3d[j]; p3 = shell_upper_3d[j]; p4 = shell_upper_3d[i]
        norm = compute_normal(p1, p2, p3)
        if norm[0] * math.cos(YAW) - norm[1] * math.sin(YAW) < 0.85:
            poly = np.array([project_3d(*p1), project_3d(*p2), project_3d(*p3), project_3d(*p4)], dtype=np.int32)
            cv2.fillPoly(canvas, [poly], (234, 229, 220, 255), lineType=cv2.LINE_AA)

    top_3d = get_rounded_rect_3d_points(62, 42, 48 + z_elev, 10, 16)
    top_2d = np.array([project_3d(*p) for p in top_3d], dtype=np.int32)
    cv2.fillPoly(canvas, [top_2d], (246, 242, 235, 255), lineType=cv2.LINE_AA)
    cv2.polylines(canvas, [top_2d], True, (215, 210, 202, 255), 2, lineType=cv2.LINE_AA)

    # 4 Screws hovering above lid at Z: 92
    for bx, by in [(-48, -28), (48, -28), (48, 28), (-48, 28)]:
        p_scr = project_3d(bx, by, 92)
        cv2.circle(canvas, p_scr, 16, (60, 62, 68, 255), -1, lineType=cv2.LINE_AA)
        cv2.circle(canvas, p_scr, 16, (90, 92, 100, 255), 2, lineType=cv2.LINE_AA)
        # Guide axis line from screw down into counterbore
        p_dest = project_3d(bx, by, 48 + z_elev)
        cv2.line(canvas, p_scr, p_dest, (243, 107, 22, 180), 1, lineType=cv2.LINE_AA)

    shadow = create_contact_shadow(rx=440, ry=180, cy_offset=125)
    pil_obj = Image.fromarray(canvas)
    final_img = Image.alpha_composite(shadow, pil_obj)
    return final_img.resize((1000, 800), Image.Resampling.LANCZOS)

# ─── 9. 12_enclosure_detail.webp (Macro Close-up Detail)
def render_detail_view():
    # Renders close-up view centered on corner fastener, chamfer, and parting seam
    canvas = np.zeros((1600, 2000, 4), dtype=np.uint8)
    
    # Corner chamfer wall
    pts_chamf = np.array([[200, 300], [1400, 150], [1800, 700], [400, 950]], dtype=np.int32)
    cv2.fillPoly(canvas, [pts_chamf], (242, 238, 230, 255), lineType=cv2.LINE_AA)
    
    # Parting line seam
    cv2.line(canvas, (200, 750), (1800, 560), (22, 22, 26, 255), 8, lineType=cv2.LINE_AA)
    # Lower chassis wall
    pts_lower = np.array([[200, 754], [1800, 564], [1800, 1400], [200, 1550]], dtype=np.int32)
    cv2.fillPoly(canvas, [pts_lower], (34, 35, 40, 255), lineType=cv2.LINE_AA)
    
    # Large macro counterbore pocket
    cb_c = (900, 450)
    cv2.circle(canvas, cb_c, 160, (205, 200, 192, 255), -1, lineType=cv2.LINE_AA)
    cv2.circle(canvas, cb_c, 160, (160, 155, 148, 255), 6, lineType=cv2.LINE_AA)
    # Metallic screw head
    cv2.circle(canvas, cb_c, 125, (52, 54, 58, 255), -1, lineType=cv2.LINE_AA)
    cv2.circle(canvas, cb_c, 125, (88, 90, 98, 255), 4, lineType=cv2.LINE_AA)
    # Hex socket
    hex_pts = []
    for a in range(6):
        ang = a * math.pi / 3 + math.radians(15)
        hx = int(cb_c[0] + 60 * math.cos(ang))
        hy = int(cb_c[1] + 60 * math.sin(ang))
        hex_pts.append((hx, hy))
    cv2.fillPoly(canvas, [np.array(hex_pts, dtype=np.int32)], (18, 18, 22, 255), lineType=cv2.LINE_AA)

    # Micro layer lines
    apply_layer_lines(canvas, None, spacing=6, intensity=0.09)
    
    pil_img = Image.fromarray(canvas)
    return pil_img.resize((1000, 800), Image.Resampling.LANCZOS)

# ─── MAIN GENERATION PIPELINE ────────────────────────────────────────────────
def main():
    print("Generating Master Physical Enclosure...")
    img_physical = render_master_enclosure()
    img_physical.save(os.path.join(OUTPUT_DIR, "01_hero_enclosure.webp"), "WEBP", quality=92)
    img_physical.save(os.path.join(OUTPUT_DIR, "10_d2p_object.webp"), "WEBP", quality=92)
    print("[OK] 01_hero_enclosure.webp & 10_d2p_object.webp generated.")

    print("Generating Print Lab Custom Object...")
    img_custom = render_custom_object()
    img_custom.save(os.path.join(OUTPUT_DIR, "02_custom_object.webp"), "WEBP", quality=92)
    print("[OK] 02_custom_object.webp generated.")

    print("Generating Print Lab Prototype Enclosure...")
    img_proto = render_prototype_assembly()
    img_proto.save(os.path.join(OUTPUT_DIR, "03_prototype_enclosure.webp"), "WEBP", quality=92)
    print("[OK] 03_prototype_enclosure.webp generated.")

    print("Generating Print Lab CAD & Wireframe Models...")
    img_cad = render_cad_model(on_cream_bg=True)
    img_cad.save(os.path.join(OUTPUT_DIR, "04_design_cad.webp"), "WEBP", quality=92)
    
    img_cad_alpha = render_cad_model(on_cream_bg=False)
    img_cad_alpha.save(os.path.join(OUTPUT_DIR, "05_design_wireframe.webp"), "WEBP", quality=92)
    img_cad_alpha.save(os.path.join(OUTPUT_DIR, "08_d2p_model.webp"), "WEBP", quality=92)
    print("[OK] 04_design_cad.webp, 05_design_wireframe.webp, & 08_d2p_model.webp generated.")

    print("Generating Print Lab Figurine...")
    img_fig = render_figurine()
    img_fig.save(os.path.join(OUTPUT_DIR, "06_figurine.webp"), "WEBP", quality=92)
    print("[OK] 06_figurine.webp generated.")

    print("Generating Digital -> Physical IDEA & BUILD States...")
    img_idea = render_d2p_idea()
    img_idea.save(os.path.join(OUTPUT_DIR, "07_d2p_idea.webp"), "WEBP", quality=92)
    
    img_build = render_d2p_build()
    img_build.save(os.path.join(OUTPUT_DIR, "09_d2p_build.webp"), "WEBP", quality=92)
    print("[OK] 07_d2p_idea.webp & 09_d2p_build.webp generated.")

    print("Generating Exploded View and Detail Macro...")
    img_exp = render_exploded_view()
    img_exp.save(os.path.join(OUTPUT_DIR, "11_enclosure_exploded.webp"), "WEBP", quality=92)
    
    img_det = render_detail_view()
    img_det.save(os.path.join(OUTPUT_DIR, "12_enclosure_detail.webp"), "WEBP", quality=92)
    print("[OK] 11_enclosure_exploded.webp & 12_enclosure_detail.webp generated.")

    print("\nALL 12 MASTER ARTIFACTS SUCCESSFULLY GENERATED!")

if __name__ == "__main__":
    main()
