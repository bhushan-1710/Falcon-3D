"""
render_hero_gripper.py — Reference-Grade 3D-Printed Robotic Gripper End-Effector
A distinctive, functional mechanical prototype with a striking silhouette:
Circular mounting flange, cylindrical ribbed actuator housing, dual pivot knuckles with Falcon-orange bushings,
and two sweeping curved articulated robotic fingers with generative cutouts.
Features unmistakable horizontal FDM layer lines matching the reference photograph.
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

def sd_cylinder_z(p, r, h):
    d_xy = np.hypot(p[..., 0], p[..., 1]) - r
    d_z = np.abs(p[..., 2]) - h
    outside = np.hypot(np.maximum(d_xy, 0.0), np.maximum(d_z, 0.0))
    inside = np.minimum(np.maximum(d_xy, d_z), 0.0)
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

def sd_capsule(p, a, b, r):
    pa = p - a
    ba = b - a
    h = np.clip(np.sum(pa * ba, axis=-1, keepdims=True) / np.sum(ba * ba), 0.0, 1.0)
    return np.linalg.norm(pa - ba * h, axis=-1) - r

def scene_sdf(p):
    """
    Evaluates signed distance to the robotic gripper prototype.
    Materials:
      1: Warm Ivory PLA (Actuator Body & Arched Gripper Fingers)
      2: Charcoal Matte Structural Flange & Collar
      3: Falcon Orange Accent (Pivot Bushings & Cable Port)
      4: Dark Steel Fasteners (M4 Socket Screws)
    """
    # ── 1. CHARCOAL BASE MOUNTING FLANGE (Grounded on z = -0.30 to -0.22) ──
    # Circular flange with 4 bolt tabs
    p_flange = p - np.array([0.0, 0.0, -0.26])
    d_flange = sd_cylinder_z(p_flange, 0.36, 0.04) - 0.015

    # 4 Flange bolt counterbores and screws
    d_holes = 1e5
    d_screws = 1e5
    for ang in [math.pi * 0.25, math.pi * 0.75, math.pi * 1.25, math.pi * 1.75]:
        bx = 0.28 * math.cos(ang)
        by = 0.28 * math.sin(ang)
        p_h = p - np.array([bx, by, -0.24])
        d_holes = np.minimum(d_holes, sd_cylinder_z(p_h, 0.042, 0.04))
        
        p_sc = p - np.array([bx, by, -0.26])
        d_s = sd_cylinder_z(p_sc, 0.034, 0.016)
        # Hex socket key
        p_hx = p - np.array([bx, by, -0.25])
        d_hx = sd_cylinder_z(p_hx, 0.016, 0.012)
        d_s = np.maximum(d_s, -d_hx)
        d_screws = np.minimum(d_screws, d_s)

    d_flange = np.maximum(d_flange, -d_holes)

    # ── 2. WARM IVORY ACTUATOR MOTOR HOUSING (z = -0.22 to 0.04) ───────────
    p_motor = p - np.array([0.0, 0.0, -0.08])
    d_motor = sd_cylinder_z(p_motor, 0.24, 0.14) - 0.02

    # Vertical cooling ribs along the cylindrical motor housing
    # 8 ribs around circumference
    ang_motor = np.arctan2(p[..., 1], p[..., 0])
    rad_motor = np.hypot(p[..., 0], p[..., 1])
    rib_pattern = np.cos(ang_motor * 8.0)
    d_ribs = rad_motor - (0.24 + 0.02 * np.maximum(rib_pattern, 0.0))
    d_motor_ribbed = np.maximum(d_ribs, np.abs(p[..., 2] - (-0.08)) - 0.13) - 0.01
    d_body = smin(d_motor, d_motor_ribbed, 0.02)

    # Charcoal middle clamping collar
    p_collar = p - np.array([0.0, 0.0, -0.06])
    d_collar = sd_cylinder_z(p_collar, 0.26, 0.035) - 0.012

    # ── 3. DUAL PIVOT KNUCKLES & CLEVIS (z = 0.04 to 0.12) ─────────────────
    # Heavy-duty pivot knuckles on left (y = -0.16) and right (y = +0.16)
    d_knuckles = 1e5
    d_orange_bush = 1e5
    for sy in [-0.17, 0.17]:
        p_k = p - np.array([0.0, sy, 0.08])
        d_k = sd_cylinder_x(p_k, 0.09, 0.055) - 0.012
        d_knuckles = np.minimum(d_knuckles, d_k)

        # Pivot axle bolt along X
        p_axle = p - np.array([0.0, sy, 0.08])
        d_ax = sd_cylinder_x(p_axle, 0.035, 0.075)
        d_screws = np.minimum(d_screws, d_ax)

        # Falcon Orange anodized bushing ring
        d_b_out = sd_cylinder_x(p_axle, 0.062, 0.008)
        d_b_in = sd_cylinder_x(p_axle, 0.040, 0.02)
        d_orange_bush = np.minimum(d_orange_bush, np.maximum(d_b_out, -d_b_in))

    # Clevis fork base connecting motor housing to knuckles
    p_fork = p - np.array([0.0, 0.0, 0.04])
    d_fork = sd_cylinder_z(p_fork, 0.22, 0.05) - 0.015
    d_upper_base = smin(d_body, d_fork, 0.03)
    d_upper_base = smin(d_upper_base, d_knuckles, 0.03)

    # ── 4. TWO SWEEPING ARTICULATED GRIPPER FINGERS (Warm Ivory PLA) ───────
    # Left Finger: Arches forward (+X) and curves inward (+Y)
    # 3 sweeping jointed segments
    p0_l = np.array([0.0, -0.17, 0.08])
    p1_l = np.array([0.24, -0.19, 0.16])
    p2_l = np.array([0.46, -0.12, 0.21])
    p3_l = np.array([0.56, -0.04, 0.23])

    d_f1_l = sd_capsule(p, p0_l, p1_l, 0.070)
    d_f2_l = sd_capsule(p, p1_l, p2_l, 0.058)
    d_f3_l = sd_capsule(p, p2_l, p3_l, 0.044)
    d_finger_left = smin(smin(d_f1_l, d_f2_l, 0.03), d_f3_l, 0.025)

    # Right Finger: Symmetrically arches forward (+X) and curves inward (-Y)
    p0_r = np.array([0.0,  0.17, 0.08])
    p1_r = np.array([0.24,  0.19, 0.16])
    p2_r = np.array([0.46,  0.12, 0.21])
    p3_r = np.array([0.56,  0.04, 0.23])

    d_f1_r = sd_capsule(p, p0_r, p1_r, 0.070)
    d_f2_r = sd_capsule(p, p1_r, p2_r, 0.058)
    d_f3_r = sd_capsule(p, p2_r, p3_r, 0.044)
    d_finger_right = smin(smin(d_f1_r, d_f2_r, 0.03), d_f3_r, 0.025)

    d_fingers = np.minimum(d_finger_left, d_finger_right)

    # Weight-saving generative truss holes in the finger midsection
    # Cutout holes along Y through each finger
    p_h_l = p - np.array([0.24, -0.19, 0.16])
    d_cut_l = sd_cylinder_y(p_h_l, 0.035, 0.15)
    p_h_r = p - np.array([0.24,  0.19, 0.16])
    d_cut_r = sd_cylinder_y(p_h_r, 0.035, 0.15)
    d_fingers = np.maximum(d_fingers, -np.minimum(d_cut_l, d_cut_r))

    # Inner tactile silicone grip pads on finger tips (Charcoal)
    p_pad_l = p - np.array([0.54, -0.03, 0.23])
    d_pad_l = sd_capsule(p, np.array([0.48, -0.06, 0.22]), np.array([0.56, -0.03, 0.23]), 0.022)
    p_pad_r = p - np.array([0.54,  0.03, 0.23])
    d_pad_r = sd_capsule(p, np.array([0.48,  0.06, 0.22]), np.array([0.56,  0.03, 0.23]), 0.022)
    d_pads = np.minimum(d_pad_l, d_pad_r)

    # Combine ivory parts: upper base + knuckles + fingers
    d_ivory = smin(d_upper_base, d_fingers, 0.035)

    # Combine charcoal parts: flange + collar + grip pads
    d_charcoal = np.minimum(d_flange, d_collar)
    d_charcoal = np.minimum(d_charcoal, d_pads)

    # ── MATERIAL ARBITRATION ───────────────────────────────────────────────
    d_min = d_charcoal
    mat = np.full(p.shape[:-1], 2, dtype=np.int32) # Charcoal

    ivory_mask = d_ivory < d_min
    d_min = np.where(ivory_mask, d_ivory, d_min)
    mat = np.where(ivory_mask, 1, mat) # Warm Ivory PLA

    screw_mask = d_screws < d_min
    d_min = np.where(screw_mask, d_screws, d_min)
    mat = np.where(screw_mask, 4, mat) # Screws

    orange_mask = d_orange_bush < d_min
    d_min = np.where(orange_mask, d_orange_bush, d_min)
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
    print(f"Rendering Reference-Grade 3D-Printed Robotic Gripper Artifact at {width}x{height}...")
    t0 = time.time()

    # 3/4 Perspective View looking over the curved pincer fingers and down into the flange
    yaw = math.radians(42)
    pitch = math.radians(24)
    dist = 2.40

    cam_x = dist * math.cos(pitch) * math.sin(yaw)
    cam_y = -dist * math.cos(pitch) * math.cos(yaw)
    cam_z = dist * math.sin(pitch) - 0.02
    ro = np.array([cam_x, cam_y, cam_z], dtype=np.float32)
    target = np.array([0.16, 0.0, -0.02], dtype=np.float32)
    
    forward = normalize(target - ro)
    world_up = np.array([0.0, 0.0, 1.0], dtype=np.float32)
    right = normalize(np.cross(forward, world_up))
    up = normalize(np.cross(right, forward))

    aspect = width / height
    fov_tan = math.tan(math.radians(26.0))
    
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

    max_steps = 50
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

    # Lighting setup (Soft Studio Key + Cool Fill + Rim)
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

    # ── 5. GROUNDED CONTACT SHADOW (z = -0.30) ─────────────────────────────
    print("Projecting physical contact shadow...")
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

    center_ground = project_ground(np.array([0.0, 0.0, -0.30]))
    if center_ground:
        cx, cy = center_ground
        rx = int(width * 0.28)
        ry = int(height * 0.125)
        off_x = int(width * 0.035)
        off_y = int(height * 0.035)

        s_draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(8, 8, 10, 200))
        s_draw.ellipse([cx - int(rx*1.22) + off_x, cy - int(ry*1.20) + off_y,
                        cx + int(rx*1.22) + off_x, cy + int(ry*1.20) + off_y], fill=(14, 14, 16, 115))
        s_draw.ellipse([cx - int(rx*1.65) + off_x*2, cy - int(ry*1.55) + off_y*2,
                        cx + int(rx*1.65) + off_x*2, cy + int(ry*1.55) + off_y*2], fill=(18, 18, 20, 50))

    shadow_blurred = shadow_canvas.filter(ImageFilter.GaussianBlur(radius=32))

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
