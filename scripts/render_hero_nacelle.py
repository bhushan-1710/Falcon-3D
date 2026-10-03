"""
render_hero_nacelle.py — Reference-Grade 3D-Printed Aerodynamic Nacelle & Impeller Stator Prototype
A distinctive functional mechanical artifact designed to showcase additive manufacturing:
Aerodynamic toroidal shroud, curved bellmouth intake, internal stator guide vanes, streamlined center hub,
thin Falcon-orange accent ring, sturdy generative mounting pylon, grounded charcoal baseplate,
and authentic reference-quality FDM horizontal layer lines.
"""

import math
import time
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

def normalize(v):
    norm = np.linalg.norm(v, axis=-1, keepdims=True)
    return np.where(norm > 1e-9, v / norm, v)

def smin(a, b, k=0.04):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * h + a * (1.0 - h) - k * h * (1.0 - h)

def sd_box(p, b):
    q = np.abs(p) - b
    outside = np.linalg.norm(np.maximum(q, 0.0), axis=-1)
    inside = np.minimum(np.max(q, axis=-1), 0.0)
    return outside + inside

def sd_cylinder_x(p, r, h):
    d_yz = np.hypot(p[..., 1], p[..., 2]) - r
    d_x = np.abs(p[..., 0]) - h
    outside = np.hypot(np.maximum(d_yz, 0.0), np.maximum(d_x, 0.0))
    inside = np.minimum(np.maximum(d_yz, d_x), 0.0)
    return outside + inside

def sd_cylinder_y(p, r, h):
    d_xz = np.hypot(p[..., 0], p[..., 2]) - r
    d_y = np.abs(p[..., 1]) - h
    outside = np.hypot(np.maximum(d_xz, 0.0), np.maximum(d_y, 0.0))
    inside = np.minimum(np.maximum(d_xz, d_y), 0.0)
    return outside + inside

def sd_cylinder_z(p, r, h):
    d_xy = np.hypot(p[..., 0], p[..., 1]) - r
    d_z = np.abs(p[..., 2]) - h
    outside = np.hypot(np.maximum(d_xy, 0.0), np.maximum(d_z, 0.0))
    inside = np.minimum(np.maximum(d_xy, d_z), 0.0)
    return outside + inside

def scene_sdf(p):
    """
    Evaluates signed distance to the ducted nacelle assembly.
    Center axis is along X, centered at Y=0, Z=0.05.
    Materials:
      1: Warm Ivory PLA (Aerodynamic Cowl, Vanes, Hub)
      2: Charcoal Matte Baseplate & Mounting Pylon
      3: Falcon Orange Accent (Center Hub Ring & Intake Flange)
      4: Dark Steel Fasteners (M3 Hex Socket Screws)
    """
    p_center = p - np.array([0.0, 0.0, 0.05])
    rad_yz = np.hypot(p_center[..., 1], p_center[..., 2])
    
    # ── 1. WARM IVORY AERODYNAMIC SHROUD / COWL ────────────────────────────
    # Outer radius 0.44, inner radius 0.34, length along X is 0.56 (-0.28 to +0.28)
    # Bellmouth intake flare at front (+X): inner radius widens smoothly to 0.37
    x_pos = p_center[..., 0]
    flare = 0.03 * np.clip((x_pos - 0.10) / 0.18, 0.0, 1.0)
    r_inner = 0.33 + flare
    r_outer = 0.43 - 0.02 * np.clip((x_pos - 0.10) / 0.18, 0.0, 1.0)
    
    d_outer = np.hypot(np.maximum(rad_yz - r_outer, 0.0), np.maximum(np.abs(x_pos) - 0.27, 0.0)) - 0.02
    d_inner = -(rad_yz - r_inner)
    d_cowl = np.maximum(d_outer, d_inner)

    # 4 Exterior Cooling Fins / Stiffener Ribs along the cowl exterior
    d_ribs = 1e5
    for ang in [math.pi * 0.25, math.pi * 0.75, math.pi * 1.25, math.pi * 1.75]:
        ry = rad_yz * np.cos(ang)
        rz = rad_yz * np.sin(ang)
        p_rib = np.stack([x_pos, p_center[..., 1] * math.cos(ang) + p_center[..., 2] * math.sin(ang),
                          -p_center[..., 1] * math.sin(ang) + p_center[..., 2] * math.cos(ang)], axis=-1)
        d_rb = sd_box(p_rib - np.array([0.0, 0.44, 0.0]), np.array([0.24, 0.016, 0.025])) - 0.008
        d_ribs = np.minimum(d_ribs, d_rb)
    d_cowl = smin(d_cowl, d_ribs, 0.025)

    # ── 2. CENTRAL STREAMLINED MOTOR POD / HUB ─────────────────────────────
    # Nose cone extending along X from -0.26 to +0.26, radius 0.125
    r_hub = 0.125 * np.clip(1.0 - 0.45 * np.maximum(x_pos - 0.05, 0.0) / 0.20, 0.1, 1.0)
    d_hub_cyl = np.hypot(np.maximum(rad_yz - r_hub, 0.0), np.maximum(np.abs(x_pos) - 0.24, 0.0)) - 0.015
    # Rounded nose tip
    p_tip = p_center - np.array([0.22, 0.0, 0.0])
    d_tip = np.linalg.norm(p_tip, axis=-1) - 0.09
    d_hub = smin(d_hub_cyl, d_tip, 0.03)

    # ── 3. INTERNAL STATOR GUIDE VANES (6 Aerodynamic Blades) ──────────────
    # Radiate from hub (r=0.12) to shroud inner wall (r=0.34)
    d_vanes = 1e5
    y_c = p_center[..., 1]
    z_c = p_center[..., 2]
    for i in range(6):
        ang = i * (math.pi / 3.0) + (x_pos * 0.4) # subtle aerodynamic twist
        cos_a = np.cos(ang)
        sin_a = np.sin(ang)
        # Distance to blade plane
        dist_plane = np.abs(y_c * sin_a - z_c * cos_a) - 0.012
        # Radial bounds [0.10, 0.36]
        dist_rad = np.maximum(0.11 - rad_yz, rad_yz - 0.35)
        # X bounds [-0.18, 0.18]
        dist_x = np.abs(x_pos) - 0.18
        d_v = np.maximum(np.maximum(dist_plane, dist_rad), dist_x) - 0.006
        d_vanes = np.minimum(d_vanes, d_v)

    d_ivory = smin(d_cowl, d_hub, 0.03)
    d_ivory = smin(d_ivory, d_vanes, 0.02)

    # ── 4. CHARCOAL STRUCTURAL PYLON & GROUNDED BASEPLATE ──────────────────
    # Pylon extends down from bottom of cowl (z = -0.38) to baseplate (z = -0.22)
    p_pylon = p - np.array([0.0, 0.0, -0.23])
    d_pylon = sd_box(p_pylon, np.array([0.22, 0.065, 0.09])) - 0.025
    # Weight-saving generative cutout in pylon
    p_pyhole = p - np.array([0.0, 0.0, -0.23])
    d_pyhole = sd_cylinder_y(p_pyhole, 0.055, 0.12)
    d_pylon = np.maximum(d_pylon, -d_pyhole)

    # Heavy-duty mounting baseplate (grounded on z = -0.32)
    p_base = p - np.array([0.0, 0.0, -0.28])
    q_bp = np.abs(p_base) - np.array([0.46, 0.36, 0.04])
    d_baseplate = np.linalg.norm(np.maximum(q_bp, 0.0), axis=-1) + np.minimum(np.max(q_bp, axis=-1), 0.0) - 0.025

    d_charcoal = smin(d_pylon, d_baseplate, 0.035)

    # ── 5. FASTENERS: 4 M3 Counterbored Socket Bolts in Baseplate ──────────
    bolt_coords = [
        (-0.38, -0.28),
        ( 0.38, -0.28),
        (-0.38,  0.28),
        ( 0.38,  0.28),
    ]
    d_holes = 1e5
    d_screws = 1e5
    for bx, by in bolt_coords:
        p_h = p - np.array([bx, by, -0.25])
        d_holes = np.minimum(d_holes, sd_cylinder_z(p_h, 0.048, 0.05))
        
        p_sc = p - np.array([bx, by, -0.27])
        d_s = sd_cylinder_z(p_sc, 0.036, 0.02)
        p_hx = p - np.array([bx, by, -0.26])
        d_hx = sd_cylinder_z(p_hx, 0.018, 0.015)
        d_s = np.maximum(d_s, -d_hx)
        d_screws = np.minimum(d_screws, d_s)

    d_charcoal = np.maximum(d_charcoal, -d_holes)

    # ── 6. FALCON ORANGE ACCENT: Anodized Hub Ring & Port Gasket ───────────
    # Thin anodized orange ring around center hub nose seam (x = 0.04)
    p_hub_ring = p_center - np.array([0.04, 0.0, 0.0])
    d_oring = np.hypot(np.maximum(rad_yz - 0.128, 0.0), np.maximum(np.abs(p_hub_ring[..., 0]) - 0.012, 0.0)) - 0.005
    d_orange = d_oring

    # ── COMBINE MATERIALS ──────────────────────────────────────────────────
    d_min = d_charcoal
    mat = np.full(p.shape[:-1], 2, dtype=np.int32) # Charcoal

    ivory_mask = d_ivory < d_min
    d_min = np.where(ivory_mask, d_ivory, d_min)
    mat = np.where(ivory_mask, 1, mat) # Warm Ivory PLA

    screw_mask = d_screws < d_min
    d_min = np.where(screw_mask, d_screws, d_min)
    mat = np.where(screw_mask, 4, mat) # Screws

    orange_mask = d_orange < d_min
    d_min = np.where(orange_mask, d_orange, d_min)
    mat = np.where(orange_mask, 3, mat) # Falcon orange

    return d_min, mat

def get_normal(p, eps=1.2e-3):
    dx = np.array([eps, 0, 0])
    dy = np.array([0, eps, 0])
    dz = np.array([0, 0, eps])
    nx = scene_sdf(p + dx)[0] - scene_sdf(p - dx)[0]
    ny = scene_sdf(p + dy)[0] - scene_sdf(p - dy)[0]
    nz = scene_sdf(p + dz)[0] - scene_sdf(p - dz)[0]
    return normalize(np.stack([nx, ny, nz], axis=-1))

def render_hero(width=1400, height=1120):
    print(f"Rendering Reference-Grade 3D-Printed Nacelle Artifact at {width}x{height}...")
    t0 = time.time()

    # 3/4 Perspective View looking into intake bellmouth and over the cowl
    yaw = math.radians(40)
    pitch = math.radians(22)
    dist = 2.45

    cam_x = dist * math.cos(pitch) * math.sin(yaw)
    cam_y = -dist * math.cos(pitch) * math.cos(yaw)
    cam_z = dist * math.sin(pitch) - 0.02
    ro = np.array([cam_x, cam_y, cam_z], dtype=np.float32)
    target = np.array([0.02, 0.0, -0.04], dtype=np.float32)
    
    forward = normalize(target - ro)
    world_up = np.array([0.0, 0.0, 1.0], dtype=np.float32)
    right = normalize(np.cross(forward, world_up))
    up = normalize(np.cross(right, forward))

    aspect = width / height
    fov_tan = math.tan(math.radians(25.5))
    
    y_coords, x_coords = np.mgrid[-1:1:height*1j, -1:1:width*1j]
    x_coords *= aspect * fov_tan
    y_coords *= -fov_tan

    rd = normalize(
        x_coords[..., None] * right +
        y_coords[..., None] * up +
        forward
    )

    p = np.broadcast_to(ro, rd.shape).copy()
    hit_mask = np.zeros((height, width), dtype=bool)
    active_mask = np.ones((height, width), dtype=bool)
    material_grid = np.zeros((height, width), dtype=np.int32)

    # Bounding sphere acceleration
    oc = ro - target
    b_term = np.sum(rd * oc, axis=-1)
    c_term = np.sum(oc * oc) - (1.18 ** 2)
    disc = b_term * b_term - c_term
    valid_rays = disc >= 0
    t_start = np.maximum(0.0, -b_term - np.sqrt(np.maximum(0.0, disc))) - 0.08
    p = ro + rd * np.maximum(0.0, t_start)[..., None]
    active_mask = valid_rays

    max_steps = 48
    for step in range(max_steps):
        if not np.any(active_mask):
            break
        
        pts = p[active_mask]
        dist_vals, mats = scene_sdf(pts)
        
        hit = dist_vals < 0.0020
        miss = dist_vals > 2.0
        
        active_indices = np.where(active_mask)
        cur_y = active_indices[0]
        cur_x = active_indices[1]
        
        hit_y = cur_y[hit]
        hit_x = cur_x[hit]
        hit_mask[hit_y, hit_x] = True
        material_grid[hit_y, hit_x] = mats[hit]
        
        done = hit | miss
        active_mask[cur_y[done], cur_x[done]] = False
        p[active_mask] += rd[active_mask] * dist_vals[~done, None]

    print(f"Raymarching completed in {time.time() - t0:.2f}s. Computing authentic FDM print layers & studio lighting...")

    # Lighting vectors
    key_light = normalize(np.array([-0.42, -0.65, 0.88]))
    fill_light = normalize(np.array([0.70, 0.40, 0.25]))
    rim_light = normalize(np.array([0.15, 0.85, 0.45]))
    view_dir = normalize(ro - p)

    rgb = np.zeros((height, width, 3), dtype=np.float32)
    alpha = np.zeros((height, width), dtype=np.float32)

    if np.any(hit_mask):
        hit_pts = p[hit_mask]
        hit_mats = material_grid[hit_mask]
        normals = get_normal(hit_pts)
        v_dirs = view_dir[hit_mask]

        # ── AUTHENTIC 3D-PRINT LAYER STAIRCASE PERTURBATION ───────────────
        # Matching reference photograph: prominent, tactile horizontal micro-ridges
        layer_h = 0.0135 # ~0.28mm scale
        z_world = hit_pts[:, 2]
        layer_phase = (z_world / layer_h) * 2.0 * math.pi
        
        # Micro-ridge normal perturbation: light catches the top edge of each layer bead
        ridge_factor = 0.16 * np.sin(layer_phase) * np.clip(1.0 - np.abs(normals[:, 2]) * 0.35, 0.0, 1.0)
        perturbed_normals = normals.copy()
        perturbed_normals[:, 2] += ridge_factor * (hit_mats != 4)
        perturbed_normals = normalize(perturbed_normals)

        # Diffuse
        n_dot_key = np.maximum(0.0, np.sum(perturbed_normals * key_light, axis=-1))
        n_dot_fill = np.maximum(0.0, np.sum(perturbed_normals * fill_light, axis=-1))
        n_dot_rim = np.maximum(0.0, np.sum(perturbed_normals * rim_light, axis=-1))

        # Specular Blinn-Phong (Matte FDM PLA)
        h_key = normalize(key_light + v_dirs)
        n_dot_hk = np.maximum(0.0, np.sum(perturbed_normals * h_key, axis=-1))
        spec_key = np.power(n_dot_hk, 24.0)

        # Ambient Occlusion
        ao1 = scene_sdf(hit_pts + normals * 0.025)[0] / 0.025
        ao2 = scene_sdf(hit_pts + normals * 0.07)[0] / 0.07
        ao = np.clip(0.30 + 0.70 * np.minimum(ao1, ao2), 0.0, 1.0)

        # Warm Ivory Filament translucency and micro-layer color modulation
        filament_layer = 1.0 + 0.045 * np.sin(layer_phase)
        c_ivory = np.array([0.945, 0.925, 0.875]) * filament_layer[:, None]
        c_charcoal = np.array([0.165, 0.165, 0.185]) * filament_layer[:, None]
        c_orange = np.array([0.953, 0.420, 0.086])
        c_screw = np.array([0.22, 0.23, 0.26])

        albedo = np.zeros((len(hit_pts), 3), dtype=np.float32)
        albedo[hit_mats == 1] = c_ivory[hit_mats == 1]
        albedo[hit_mats == 2] = c_charcoal[hit_mats == 2]
        albedo[hit_mats == 3] = c_orange
        albedo[hit_mats == 4] = c_screw

        col_key = np.array([1.0, 0.98, 0.95])
        col_fill = np.array([0.45, 0.48, 0.54])
        col_rim = np.array([0.32, 0.34, 0.38])
        col_ambient = np.array([0.18, 0.18, 0.19])

        lit = (
            albedo * (
                col_key * n_dot_key[:, None] * 0.88 +
                col_fill * n_dot_fill[:, None] * 0.32 +
                col_rim * n_dot_rim[:, None] * 0.18 +
                col_ambient * ao[:, None]
            ) +
            spec_key[:, None] * 0.16 * (hit_mats == 1)[:, None] +
            spec_key[:, None] * 0.45 * (hit_mats == 4)[:, None]
        )

        rgb[hit_mask] = np.clip(lit, 0.0, 1.0)
        alpha[hit_mask] = 1.0

    # ── 7. GROUNDED CONTACT SHADOW (z = -0.32) ─────────────────────────────
    print("Projecting physical contact shadow onto ground plane...")
    shadow_canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_canvas)

    def project_ground(world_p):
        v = world_p - ro
        dist_fwd = np.dot(v, forward)
        if dist_fwd <= 0.01:
            return None
        px = np.dot(v, right) / (dist_fwd * aspect * fov_tan)
        py = -np.dot(v, up) / (dist_fwd * fov_tan)
        sx = int((px + 1.0) * 0.5 * width)
        sy = int((py + 1.0) * 0.5 * height)
        return (sx, sy)

    center_ground = project_ground(np.array([0.0, 0.0, -0.32]))
    if center_ground:
        cx, cy = center_ground
        rx = int(width * 0.30)
        ry = int(height * 0.135)
        off_x = int(width * 0.035)
        off_y = int(height * 0.035)

        s_draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(8, 8, 10, 200))
        s_draw.ellipse([cx - int(rx*1.22) + off_x, cy - int(ry*1.20) + off_y,
                        cx + int(rx*1.22) + off_x, cy + int(ry*1.20) + off_y], fill=(14, 14, 16, 115))
        s_draw.ellipse([cx - int(rx*1.65) + off_x*2, cy - int(ry*1.55) + off_y*2,
                        cx + int(rx*1.65) + off_x*2, cy + int(ry*1.55) + off_y*2], fill=(18, 18, 20, 50))

    shadow_blurred = shadow_canvas.filter(ImageFilter.GaussianBlur(radius=34))

    obj_rgba = (np.dstack([rgb, alpha]) * 255).astype(np.uint8)
    obj_img = Image.fromarray(obj_rgba, "RGBA")

    composite = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    composite.paste(shadow_blurred, (0, 0), shadow_blurred)
    composite.paste(obj_img, (0, 0), obj_img)

    final_out = composite.resize((1000, 800), Image.Resampling.LANCZOS)

    out_path = "c:/Users/User/OneDrive/Desktop/Clients/Falcon_3d_prints/falcon-web/public/assets/falcon/artifacts/hero-object-new.webp"
    final_out.save(out_path, "WEBP", quality=95)
    print(f"Successfully saved Reference-Grade Hero artifact to {out_path} ({final_out.size}) in {time.time() - t0:.2f}s total!")

    out_alias = "c:/Users/User/OneDrive/Desktop/Clients/Falcon_3d_prints/falcon-web/public/assets/falcon/artifacts/01_hero_enclosure.webp"
    final_out.save(out_alias, "WEBP", quality=95)
    print(f"Synced alias to {out_alias}")

if __name__ == "__main__":
    render_hero(1350, 1080)
