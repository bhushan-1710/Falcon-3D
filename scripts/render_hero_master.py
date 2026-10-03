"""
render_hero_master.py — Precision Procedural Raymarching for Falcon 3D Prints Hero Artifact
Creates an engineered, sculpted, high-end 3D-printed mechanical/electronics enclosure prototype.
Distinctive chamfered/octagonal silhouette, layered shell, corner fastener bosses with visible Allen hex screws,
heatsink vanes, structural lid ribs, and realistic 3D print texture.
"""

import math
import time
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

def normalize(v):
    norm = np.linalg.norm(v, axis=-1, keepdims=True)
    return np.where(norm > 1e-9, v / norm, v)

def sd_box(p, b):
    q = np.abs(p) - b
    outside = np.linalg.norm(np.maximum(q, 0.0), axis=-1)
    inside = np.minimum(np.max(q, axis=-1), 0.0)
    return outside + inside

def sd_chamfered_enclosure(p, half_x, half_y, half_z, chamfer, corner_r):
    """
    Sculpted octagonal engineering body:
    Combines rectangular bounds with 45-degree corner facets and rounding.
    """
    q = np.abs(p) - np.array([half_x - corner_r, half_y - corner_r, half_z - corner_r])
    d_box = np.linalg.norm(np.maximum(q, 0.0), axis=-1) + np.minimum(np.max(q, axis=-1), 0.0) - corner_r
    
    d_corner = (np.abs(p[..., 0]) + np.abs(p[..., 1])) * 0.70710678 - (chamfer - corner_r)
    d_corner_cut = np.maximum(d_corner, np.abs(p[..., 2]) - half_z) - corner_r
    
    return np.maximum(d_box, d_corner_cut)

def sd_cylinder_z(p, r, h):
    d_xy = np.hypot(p[..., 0], p[..., 1]) - r
    d_z = np.abs(p[..., 2]) - h
    outside = np.hypot(np.maximum(d_xy, 0.0), np.maximum(d_z, 0.0))
    inside = np.minimum(np.maximum(d_xy, d_z), 0.0)
    return outside + inside

def scene_sdf(p):
    """
    Returns (distance, material_id)
    Materials:
      1: Upper shell (warm off-white FDM matte print)
      2: Base chassis & heatsink vanes (charcoal matte near-black)
      3: Falcon orange accent (parting gasket & connector tongue)
      4: Fasteners (M3 hex socket cap screws in dark steel)
      5: Center structural lid ribs (graphite accent)
    """
    # 1. Base Chassis (Charcoal Structural Tray)
    p_base = p - np.array([0.0, 0.0, -0.21])
    d_base = sd_chamfered_enclosure(p_base, 0.65, 0.45, 0.105, 0.74, 0.045)
    
    # 2. Upper Shell (Warm Off-White Printed Body)
    p_shell = p - np.array([0.0, 0.0, 0.05])
    d_shell = sd_chamfered_enclosure(p_shell, 0.68, 0.48, 0.145, 0.78, 0.05)
    
    # Top lid sculpted plateau: shallow recessed boundary
    p_top_inset = p - np.array([0.0, 0.0, 0.20])
    d_top_inset = sd_chamfered_enclosure(p_top_inset, 0.46, 0.28, 0.02, 0.50, 0.025)
    d_shell = np.maximum(d_shell, -d_top_inset)

    # 4 Corner Fastener Bosses with M3 Socket Cap Screws
    screw_coords = [
        (-0.52, -0.34),
        ( 0.52, -0.34),
        (-0.52,  0.34),
        ( 0.52,  0.34),
    ]
    
    d_holes = 1e5
    d_screws = 1e5
    for sx, sy in screw_coords:
        p_c = p - np.array([sx, sy, 0.16])
        # Cylindrical counterbore well
        d_h = sd_cylinder_z(p_c, 0.052, 0.05)
        d_holes = np.minimum(d_holes, d_h)
        
        # M3 Socket head cap screw seated slightly higher for visibility
        p_screw = p - np.array([sx, sy, 0.145])
        d_s = sd_cylinder_z(p_screw, 0.040, 0.02)
        # Hex socket key recess in screw head
        p_hex = p - np.array([sx, sy, 0.155])
        d_hex = sd_cylinder_z(p_hex, 0.020, 0.015)
        d_s = np.maximum(d_s, -d_hex)
        d_screws = np.minimum(d_screws, d_s)
        
    d_shell = np.maximum(d_shell, -d_holes)

    # Center structural lid detailing: 3 sculpted low-profile heatsink/airflow ribs
    d_top_ribs = 1e5
    for rx in [-0.20, 0.0, 0.20]:
        p_rib = p - np.array([rx, 0.0, 0.19])
        d_r = sd_chamfered_enclosure(p_rib, 0.05, 0.22, 0.012, 0.18, 0.008)
        d_top_ribs = np.minimum(d_top_ribs, d_r)
    d_shell = np.minimum(d_shell, d_top_ribs)

    # Side Ventilation Louver Slots (Left/Front flanks)
    d_louvers = 1e5
    for vz in [-0.03, 0.03, 0.09]:
        p_vane = p - np.array([-0.25, -0.48, vz])
        d_v = sd_box(p_vane, np.array([0.22, 0.03, 0.016])) - 0.006
        d_louvers = np.minimum(d_louvers, d_v)
    d_shell = np.maximum(d_shell, -d_louvers)

    # Recessed USB-C I/O Port on right flank
    p_usbc_cut = p - np.array([0.68, 0.0, -0.02])
    d_usbc_cut = sd_box(p_usbc_cut, np.array([0.04, 0.11, 0.042])) - 0.012
    d_shell = np.maximum(d_shell, -d_usbc_cut)

    # 3. Orange Accent Details (Restrained: gasket & connector tongue)
    p_gasket = p - np.array([0.0, 0.0, -0.10])
    d_gasket = sd_chamfered_enclosure(p_gasket, 0.675, 0.475, 0.006, 0.77, 0.03)
    
    p_tongue = p - np.array([0.665, 0.0, -0.02])
    d_tongue = sd_box(p_tongue, np.array([0.02, 0.055, 0.007])) - 0.003
    d_orange = np.minimum(d_gasket, d_tongue)

    # Combine materials
    d_min = d_base
    mat = np.full(p.shape[:-1], 2, dtype=np.int32) # Base charcoal

    shell_mask = d_shell < d_min
    d_min = np.where(shell_mask, d_shell, d_min)
    mat = np.where(shell_mask, 1, mat) # Upper shell off-white

    screw_mask = d_screws < d_min
    d_min = np.where(screw_mask, d_screws, d_min)
    mat = np.where(screw_mask, 4, mat) # Fasteners steel

    orange_mask = d_orange < d_min
    d_min = np.where(orange_mask, d_orange, d_min)
    mat = np.where(orange_mask, 3, mat) # Orange accents

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
    print(f"Raymarching redesigned Hero master enclosure at {width}x{height}...")
    t0 = time.time()

    # Camera setup: Classic 3/4 industrial product perspective
    # Slightly closer (dist: 2.58) so it fills the hero framing naturally
    yaw = math.radians(35)
    pitch = math.radians(24)
    dist = 2.58

    cam_x = dist * math.cos(pitch) * math.sin(yaw)
    cam_y = -dist * math.cos(pitch) * math.cos(yaw)
    cam_z = dist * math.sin(pitch) - 0.04
    ro = np.array([cam_x, cam_y, cam_z], dtype=np.float32)
    target = np.array([0.0, 0.0, -0.06], dtype=np.float32)
    
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
    c_term = np.sum(oc * oc) - (1.20 ** 2)
    disc = b_term * b_term - c_term
    valid_rays = disc >= 0
    t_start = np.maximum(0.0, -b_term - np.sqrt(np.maximum(0.0, disc))) - 0.08
    p = ro + rd * np.maximum(0.0, t_start)[..., None]
    active_mask = valid_rays

    max_steps = 46
    for step in range(max_steps):
        if not np.any(active_mask):
            break
        
        pts = p[active_mask]
        dist_vals, mats = scene_sdf(pts)
        
        hit = dist_vals < 0.0022
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

    print(f"Raymarching completed in {time.time() - t0:.2f}s. Computing studio lighting & materials...")

    # Lighting vectors (Studio Product Key + Cool Fill + Rim)
    key_light = normalize(np.array([-0.42, -0.68, 0.88]))
    fill_light = normalize(np.array([0.65, 0.45, 0.30]))
    rim_light = normalize(np.array([0.20, 0.85, 0.45]))
    view_dir = normalize(ro - p)

    rgb = np.zeros((height, width, 3), dtype=np.float32)
    alpha = np.zeros((height, width), dtype=np.float32)

    if np.any(hit_mask):
        hit_pts = p[hit_mask]
        hit_mats = material_grid[hit_mask]
        normals = get_normal(hit_pts)
        v_dirs = view_dir[hit_mask]

        n_dot_key = np.maximum(0.0, np.sum(normals * key_light, axis=-1))
        n_dot_fill = np.maximum(0.0, np.sum(normals * fill_light, axis=-1))
        n_dot_rim = np.maximum(0.0, np.sum(normals * rim_light, axis=-1))

        h_key = normalize(key_light + v_dirs)
        n_dot_hk = np.maximum(0.0, np.sum(normals * h_key, axis=-1))
        spec_key = np.power(n_dot_hk, 28.0)

        # Ambient Occlusion
        ao1 = scene_sdf(hit_pts + normals * 0.025)[0] / 0.025
        ao2 = scene_sdf(hit_pts + normals * 0.07)[0] / 0.07
        ao = np.clip(0.32 + 0.68 * np.minimum(ao1, ao2), 0.0, 1.0)

        # Micro 3D-print layer striations along Z
        z_pos = hit_pts[:, 2]
        layer_mod = 1.0 + 0.030 * np.sin(z_pos * 520.0)

        # Colors
        c_shell = np.array([0.93, 0.91, 0.87]) * layer_mod[:, None]
        c_base = np.array([0.15, 0.15, 0.17]) * layer_mod[:, None]
        c_orange = np.array([0.953, 0.420, 0.086])
        c_screw = np.array([0.24, 0.25, 0.28])

        albedo = np.zeros((len(hit_pts), 3), dtype=np.float32)
        albedo[hit_mats == 1] = c_shell[hit_mats == 1]
        albedo[hit_mats == 2] = c_base[hit_mats == 2]
        albedo[hit_mats == 3] = c_orange
        albedo[hit_mats == 4] = c_screw

        col_key = np.array([1.0, 0.98, 0.95])
        col_fill = np.array([0.42, 0.46, 0.52])
        col_rim = np.array([0.30, 0.32, 0.36])
        col_ambient = np.array([0.16, 0.16, 0.17])

        lit = (
            albedo * (
                col_key * n_dot_key[:, None] * 0.88 +
                col_fill * n_dot_fill[:, None] * 0.32 +
                col_rim * n_dot_rim[:, None] * 0.20 +
                col_ambient * ao[:, None]
            ) +
            spec_key[:, None] * 0.16 * (hit_mats == 1)[:, None] +
            spec_key[:, None] * 0.45 * (hit_mats == 4)[:, None]
        )

        rgb[hit_mask] = np.clip(lit, 0.0, 1.0)
        alpha[hit_mask] = 1.0

    # Grounded Physical Contact Shadow
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
        rx = int(width * 0.32)
        ry = int(height * 0.14)
        off_x = int(width * 0.038)
        off_y = int(height * 0.038)

        s_draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(8, 8, 10, 195))
        s_draw.ellipse([cx - int(rx*1.22) + off_x, cy - int(ry*1.20) + off_y,
                        cx + int(rx*1.22) + off_x, cy + int(ry*1.20) + off_y], fill=(14, 14, 16, 110))
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
    print(f"Successfully saved new Hero artifact to {out_path} ({final_out.size}) in {time.time() - t0:.2f}s total!")

    out_alias = "c:/Users/User/OneDrive/Desktop/Clients/Falcon_3d_prints/falcon-web/public/assets/falcon/artifacts/01_hero_enclosure.webp"
    final_out.save(out_alias, "WEBP", quality=95)
    print(f"Synced alias to {out_alias}")

if __name__ == "__main__":
    render_hero(1350, 1080)
