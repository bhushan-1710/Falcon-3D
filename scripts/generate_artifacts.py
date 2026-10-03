"""
Falcon 3D Prints — Master Artifact Generator Engine
Generates the cohesive, engineered, tactile, premium master object family
and renders all 12 required local assets for Hero, Print Lab, and Digital -> Physical.
"""

import math
import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUTPUT_DIR = "public/assets/falcon/artifacts"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── MASTER 3D PROJECTION SYSTEM ─────────────────────────────────────────────
# Shared across all states for pixel-perfect geometric continuity.
YAW = math.radians(34)
PITCH = math.radians(26)
SCALE = 8.0  # At 2x supersampling (2000x1600 canvas)
CX = 1000.0
CY = 860.0

LIGHT_DIR = np.array([-0.55, -0.65, 0.75])
LIGHT_DIR = LIGHT_DIR / np.linalg.norm(LIGHT_DIR)

FILL_LIGHT = np.array([0.7, 0.3, 0.4])
FILL_LIGHT = FILL_LIGHT / np.linalg.norm(FILL_LIGHT)

def project_3d(x, y, z):
    """Projects 3D point (x, y, z) into 2D camera coordinates."""
    xc = x * math.cos(YAW) - y * math.sin(YAW)
    yt = x * math.sin(YAW) + y * math.cos(YAW)
    yc = yt * math.sin(PITCH) - z * math.cos(PITCH)
    return (CX + SCALE * xc, CY + SCALE * yc)

def compute_normal(v0, v1, v2):
    """Computes normalized surface normal of triangle (v0, v1, v2)."""
    edge1 = np.array(v1) - np.array(v0)
    edge2 = np.array(v2) - np.array(v0)
    n = np.cross(edge1, edge2)
    norm = np.linalg.norm(n)
    if norm < 1e-6:
        return np.array([0.0, 0.0, 1.0])
    return n / norm

def calculate_shading(normal, base_color, ambient=0.28, diffuse=0.62, specular=0.18, shininess=24):
    """Calculates directional Lambertian + Blinn-Phong shading."""
    n_dot_l = max(0.0, np.dot(normal, LIGHT_DIR))
    n_dot_fill = max(0.0, np.dot(normal, FILL_LIGHT))
    
    # Halfway vector for specular
    view_dir = np.array([0.0, 0.0, 1.0])
    half_vec = (LIGHT_DIR + view_dir)
    half_vec = half_vec / np.linalg.norm(half_vec)
    n_dot_h = max(0.0, np.dot(normal, half_vec))
    spec = (n_dot_h ** shininess) * specular
    
    intensity = ambient + diffuse * (0.85 * n_dot_l + 0.25 * n_dot_fill)
    intensity = min(1.0, intensity)
    
    r = int(min(255, base_color[0] * intensity + 255 * spec))
    g = int(min(255, base_color[1] * intensity + 255 * spec))
    b = int(min(255, base_color[2] * intensity + 255 * spec))
    return (r, g, b, 255)

# ─── MASTER ENCLOSURE GEOMETRY SPECIFICATION ─────────────────────────────────
# Enclosure Dimensions: Length (X): 130mm (-65 to +65), Width (Y): 90mm (-45 to +45)
# Base chassis: Z: 0 to 22 (Matte Black / Graphite)
# Seam groove: Z: 22 to 23.5 (Recessed 1.2mm)
# Top shell: Z: 23.5 to 48 (Warm off-white)
# Top chamfer: Z: 45 to 48 (45-degree bevel)
# Recessed center island: Z: 46 (Inset 18mm, subtle Falcon-orange seal)
# 4 Corner Fasteners: counterbores at (+-48, +-32)

def generate_rounded_rect_points(half_w, half_l, r, num_corner_pts=8):
    """Generates 2D perimeter points of a rounded rectangle with corner radius r."""
    pts = []
    # Corners: Top-Right, Top-Left, Bottom-Left, Bottom-Right
    centers = [
        (half_w - r, half_l - r, 0, math.pi / 2),
        (-half_w + r, half_l - r, math.pi / 2, math.pi),
        (-half_w + r, -half_l + r, math.pi, 3 * math.pi / 2),
        (half_w - r, -half_l + r, 3 * math.pi / 2, 2 * math.pi),
    ]
    for cx, cy, start_ang, end_ang in centers:
        for i in range(num_corner_pts):
            theta = start_ang + (end_ang - start_ang) * (i / (num_corner_pts - 1))
            pts.append((cx + r * math.cos(theta), cy + r * math.sin(theta)))
    return pts

def render_ground_contact_shadow(draw, w, h, center_proj, radius_x=380, radius_y=160, opacity=0.42):
    """Renders physically grounded soft contact shadow beneath the enclosure."""
    cx, cy = center_proj
    shadow_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_img)
    
    # Layer 1: Broad ambient occlusion
    s_draw.ellipse([cx - radius_x, cy - radius_y + 120, cx + radius_x, cy + radius_y + 120],
                   fill=(12, 12, 12, int(255 * opacity * 0.4)))
    # Layer 2: Tight core contact shadow
    s_draw.ellipse([cx - radius_x * 0.68, cy - radius_y * 0.55 + 130, cx + radius_x * 0.68, cy + radius_y * 0.55 + 130],
                   fill=(8, 8, 8, int(255 * opacity * 0.75)))
    # Layer 3: Direct contact footprint
    s_draw.ellipse([cx - radius_x * 0.42, cy - radius_y * 0.35 + 138, cx + radius_x * 0.42, cy + radius_y * 0.35 + 138],
                   fill=(5, 5, 5, int(255 * opacity * 0.95)))
    
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(radius=28))
    return shadow_img

print("Master geometry helper initialized successfully.")
