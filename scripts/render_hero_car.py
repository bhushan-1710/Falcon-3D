"""
Falcon 3D Prints — Hero 3D-Printed Toy Car Procedural Photorealistic Renderer
Reference: Ivory FDM-printed toy hatchback car sitting on a dark build plate,
with 3D printer toolhead and nozzle hovering directly above the roof.
Straight-on side view, slightly low camera, soft studio lighting.
Matches exact 1200x900 RGBA footprint of hero-object-new.webp.
"""

import math
import time
import numpy as np
from PIL import Image

def length(v):
    return np.sqrt(np.sum(v * v, axis=-1, keepdims=True))

def normalize(v):
    l = np.sqrt(np.sum(v * v, axis=-1, keepdims=True))
    return np.where(l > 1e-8, v / l, v)

def smin(a, b, k=0.035):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1.0 - h) + a * h - k * h * (1.0 - h)

def smax(a, b, k=0.03):
    return -smin(-a, -b, k)

def sd_box(p, b):
    q = np.abs(p) - b
    outside = np.sqrt(np.sum(np.maximum(q, 0.0)**2, axis=-1, keepdims=True))
    inside = np.minimum(np.maximum(q[..., 0:1], np.maximum(q[..., 1:2], q[..., 2:3])), 0.0)
    return outside + inside

def sd_cylinder_z(p, r, h):
    d_xy = np.sqrt(p[..., 0:1]**2 + p[..., 1:2]**2) - r
    d_z = np.abs(p[..., 2:3]) - h
    outside = np.sqrt(np.maximum(d_xy, 0.0)**2 + np.maximum(d_z, 0.0)**2)
    inside = np.minimum(np.maximum(d_xy, d_z), 0.0)
    return outside + inside

def sd_cylinder_x(p, r, h):
    d_yz = np.sqrt(p[..., 1:2]**2 + p[..., 2:3]**2) - r
    d_x = np.abs(p[..., 0:1]) - h
    outside = np.sqrt(np.maximum(d_yz, 0.0)**2 + np.maximum(d_x, 0.0)**2)
    inside = np.minimum(np.maximum(d_yz, d_x), 0.0)
    return outside + inside

# =============================================================================
# SCENE SDF DEFINITION
# =============================================================================
def get_scene_distance(p):
    x = p[..., 0:1]
    y = p[..., 1:2]
    z = p[..., 2:3]

    # 1. BUILD PLATE — very thin, subordinate to the car
    # Reduced to a slim 6px half-height slab (total ~12px), visually understated
    p_plate = p - np.array([-0.01, -0.006, 0.0], dtype=np.float32)
    d_plate = sd_box(p_plate, np.array([0.44, 0.006, 0.20], dtype=np.float32)) - 0.002

    # 2. CAR BODY (Compact Hatchback matching reference photo)
    # Wheel locations: Rear (-0.23, 0.080), Front (+0.21, 0.080), radius = 0.080
    
    # 2a. Lower chassis & rocker panel:
    p_lower = p - np.array([-0.01, 0.115, 0.0], dtype=np.float32)
    d_lower = sd_box(p_lower, np.array([0.31, 0.055, 0.160], dtype=np.float32)) - 0.025

    # Rounded front nose & bumper at +X:
    p_front_nose = p - np.array([0.30, 0.105, 0.0], dtype=np.float32)
    d_front_nose = sd_box(p_front_nose, np.array([0.035, 0.045, 0.150], dtype=np.float32)) - 0.035
    d_lower = smin(d_lower, d_front_nose, k=0.04)

    # Rounded rear bumper at -X:
    p_rear_bumper = p - np.array([-0.33, 0.105, 0.0], dtype=np.float32)
    d_rear_bumper = sd_box(p_rear_bumper, np.array([0.035, 0.045, 0.150], dtype=np.float32)) - 0.035
    d_lower = smin(d_lower, d_rear_bumper, k=0.04)

    # 2b. Hood (compact, smooth aerodynamic curve):
    p_hood = p - np.array([0.20, 0.145, 0.0], dtype=np.float32)
    d_hood = sd_box(p_hood, np.array([0.10, 0.030, 0.150], dtype=np.float32)) - 0.025
    d_hood_slope = ((x - 0.18) * 0.45 + (y - 0.15) * 0.89)
    d_hood = smax(d_hood, d_hood_slope, k=0.03)
    d_body_base = smin(d_lower, d_hood, k=0.035)

    # 2c. Cabin & Roof (Greenhouse):
    # Windshield slopes up from x = +0.11, y = 0.18 to x = -0.01, y = 0.355
    # Roof apex at x = -0.02, y = 0.360 (directly below nozzle tip)
    # Rear hatch slopes down from x = -0.23, y = 0.355 to x = -0.32, y = 0.18
    p_cabin = p - np.array([-0.10, 0.255, 0.0], dtype=np.float32)
    d_cabin_box = sd_box(p_cabin, np.array([0.17, 0.090, 0.140], dtype=np.float32)) - 0.025

    # Slanted front windshield plane
    d_windshield_plane = ((x - (-0.01)) * 0.76 + (y - 0.355) * 0.65)
    # Slanted rear hatch plane
    d_hatch_plane = (-(x - (-0.22)) * 0.70 + (y - 0.355) * 0.71)

    d_cabin_shaped = smax(d_cabin_box, d_windshield_plane, k=0.04)
    d_cabin_shaped = smax(d_cabin_shaped, d_hatch_plane, k=0.04)

    # Subtle rear roof spoiler lip at x = -0.25, y = 0.360
    p_spoiler = p - np.array([-0.240, 0.355, 0.0], dtype=np.float32)
    d_spoiler = sd_box(p_spoiler, np.array([0.020, 0.010, 0.140], dtype=np.float32)) - 0.012
    d_cabin_shaped = smin(d_cabin_shaped, d_spoiler, k=0.02)

    d_car_solid = smin(d_body_base, d_cabin_shaped, k=0.035)

    # 2d. Wheel arches
    p_rear_arch = p - np.array([-0.23, 0.080, 0.0], dtype=np.float32)
    d_rear_arch = sd_cylinder_z(p_rear_arch, 0.106, 0.22)
    p_front_arch = p - np.array([0.21, 0.080, 0.0], dtype=np.float32)
    d_front_arch = sd_cylinder_z(p_front_arch, 0.106, 0.22)

    d_car_arches = smax(d_car_solid, -d_rear_arch, k=0.016)
    d_car_arches = smax(d_car_arches, -d_front_arch, k=0.016)
    # Ground clearance between wheels
    d_car_arches = smax(d_car_arches, -(y - 0.042), k=0.015)

    # 2e. Windows Cutouts (through cabin shell)
    # Front window: x from -0.05 to +0.06, y from 0.20 to 0.325
    p_fwin = p - np.array([0.005, 0.265, 0.0], dtype=np.float32)
    d_fwin = sd_box(p_fwin, np.array([0.050, 0.055, 0.25], dtype=np.float32)) - 0.008
    d_fwin_cut = smax(d_fwin, ((x - 0.00) * 0.74 + (y - 0.325) * 0.67), k=0.02)

    # Rear window: x from -0.18 to -0.09, y from 0.20 to 0.325
    # B-pillar is between x = -0.08 and -0.06
    p_rwin = p - np.array([-0.135, 0.265, 0.0], dtype=np.float32)
    d_rwin = sd_box(p_rwin, np.array([0.045, 0.055, 0.25], dtype=np.float32)) - 0.008
    d_rwin_cut = smax(d_rwin, (-(x - (-0.17)) * 0.70 + (y - 0.325) * 0.71), k=0.02)

    d_windows_combined = np.minimum(d_fwin_cut, d_rwin_cut)
    d_car_hollow = smax(d_car_arches, -d_windows_combined, k=0.012)

    # 2f. Orange Interior Cabin Core — REMOVED (reads as detached, unexplained)
    # Windows are now transparent cut-throughs; interior is empty (correct for an
    # in-progress print where the cabin shell is being deposited layer by layer)
    d_orange_core = np.full_like(d_car_hollow, 1e6)  # effectively disabled

    # 3. WHEELS (radius = 0.080, bottom touches y = 0.00 exactly!)
    p_rw = p - np.array([-0.23, 0.080, 0.150], dtype=np.float32)
    d_rw_rim = sd_cylinder_z(p_rw, 0.080, 0.024) - 0.003
    p_fw = p - np.array([0.21, 0.080, 0.150], dtype=np.float32)
    d_fw_rim = sd_cylinder_z(p_fw, 0.080, 0.024) - 0.003

    p_rw_back = p - np.array([-0.23, 0.080, -0.150], dtype=np.float32)
    d_rw_back = sd_cylinder_z(p_rw_back, 0.080, 0.024) - 0.003
    p_fw_back = p - np.array([0.21, 0.080, -0.150], dtype=np.float32)
    d_fw_back = sd_cylinder_z(p_fw_back, 0.080, 0.024) - 0.003

    d_wheels = np.minimum(np.minimum(d_rw_rim, d_fw_rim), np.minimum(d_rw_back, d_fw_back))

    # 4. TOOLHEAD & NOZZLE ASSEMBLY (Matching reference photo)
    # 4a. Conical Brass Nozzle:
    # Tip at x = -0.02, y = 0.375 (gap of 0.015 units above car roof at y=0.360)
    ny_norm = np.clip((y - 0.375) / 0.045, 0.0, 1.0)
    nozzle_r = 0.006 + 0.026 * ny_norm
    d_nozzle_cone = np.sqrt((x - (-0.02))**2 + z**2) - nozzle_r
    d_nozzle_y = np.maximum(y - 0.420, 0.375 - y)
    d_nozzle = np.maximum(d_nozzle_cone, d_nozzle_y)

    # 4b. Hotend assembly:
    # Hexagonal / square heater block:
    p_block = p - np.array([-0.02, 0.435, 0.0], dtype=np.float32)
    d_block = sd_box(p_block, np.array([0.038, 0.015, 0.038], dtype=np.float32)) - 0.004

    # Cylindrical heatsink collar with fins:
    p_fins = p - np.array([-0.02, 0.478, 0.0], dtype=np.float32)
    d_fins_cyl = sd_cylinder_z(p_fins, 0.054, 0.028) - 0.004
    fin_slots = 0.003 * np.sin(p_fins[..., 1:2] * 400.0)
    d_fins = d_fins_cyl + fin_slots

    d_hotend = np.minimum(d_block, d_fins)

    # 4c. Toolhead carriage housing (white printed PLA):
    p_head = p - np.array([-0.02, 0.655, 0.0], dtype=np.float32)
    d_head_main = sd_box(p_head, np.array([0.125, 0.145, 0.125], dtype=np.float32)) - 0.015

    # 45-degree chamfered vertical corners
    chamfer_l = (-(x - (-0.02)) * 0.707 + np.abs(z) * 0.707) - 0.155
    chamfer_r = ((x - (-0.02)) * 0.707 + np.abs(z) * 0.707) - 0.155
    d_head_chamfered = smax(d_head_main, chamfer_l, k=0.015)
    d_head_chamfered = smax(d_head_chamfered, chamfer_r, k=0.015)

    # Flared side wings
    p_wing_l = p - np.array([-0.165, 0.655, 0.0], dtype=np.float32)
    d_wing_l = sd_box(p_wing_l, np.array([0.030, 0.115, 0.095], dtype=np.float32)) - 0.012
    p_wing_r = p - np.array([0.125, 0.655, 0.0], dtype=np.float32)
    d_wing_r = sd_box(p_wing_r, np.array([0.030, 0.115, 0.095], dtype=np.float32)) - 0.012

    d_toolhead_body = smin(d_head_chamfered, np.minimum(d_wing_l, d_wing_r), k=0.025)

    # 4d. Dark top clip
    p_top_clip = p - np.array([-0.02, 0.820, 0.0], dtype=np.float32)
    d_top_clip = sd_box(p_top_clip, np.array([0.080, 0.020, 0.090], dtype=np.float32)) - 0.008

    # 4e. Guide rails (horizontal chrome cylindrical rods)
    p_rod1 = p - np.array([0.0, 0.725, -0.055], dtype=np.float32)
    d_rod1 = sd_cylinder_x(p_rod1, 0.013, 0.52)
    p_rod2 = p - np.array([0.0, 0.680, -0.055], dtype=np.float32)
    d_rod2 = sd_cylinder_x(p_rod2, 0.011, 0.52)
    d_rails = np.minimum(d_rod1, d_rod2)

    # Final combined scene distance — orange core removed from composition
    d_ivory = np.minimum(d_car_hollow, d_toolhead_body)
    d_scene = np.minimum(
        np.minimum(d_ivory, d_wheels),
        np.minimum(
            d_plate,
            np.minimum(d_nozzle, np.minimum(d_hotend, np.minimum(d_top_clip, d_rails)))
        )
    )

    return d_scene

def get_surface_materials(p, d_scene):
    x = p[..., 0:1]
    y = p[..., 1:2]
    z = p[..., 2:3]

    # Orange core — REMOVED from material classifier
    # d_orange_core is effectively disabled; no orange surface is sampled
    d_orange_core = np.full((p.shape[0], 1), 1e6, dtype=np.float32)

    # Wheels
    p_rw = p - np.array([-0.23, 0.080, 0.150], dtype=np.float32)
    d_rw_rim = sd_cylinder_z(p_rw, 0.080, 0.024) - 0.003
    p_fw = p - np.array([0.21, 0.080, 0.150], dtype=np.float32)
    d_fw_rim = sd_cylinder_z(p_fw, 0.080, 0.024) - 0.003
    p_rw_back = p - np.array([-0.23, 0.080, -0.150], dtype=np.float32)
    d_rw_back = sd_cylinder_z(p_rw_back, 0.080, 0.024) - 0.003
    p_fw_back = p - np.array([0.21, 0.080, -0.150], dtype=np.float32)
    d_fw_back = sd_cylinder_z(p_fw_back, 0.080, 0.024) - 0.003
    d_wheels = np.minimum(np.minimum(d_rw_rim, d_fw_rim), np.minimum(d_rw_back, d_fw_back))

    # Plate (thin) & top clip
    p_plate = p - np.array([-0.01, -0.006, 0.0], dtype=np.float32)
    d_plate = sd_box(p_plate, np.array([0.44, 0.006, 0.20], dtype=np.float32)) - 0.002
    p_top_clip = p - np.array([-0.02, 0.820, 0.0], dtype=np.float32)
    d_top_clip = sd_box(p_top_clip, np.array([0.080, 0.020, 0.090], dtype=np.float32)) - 0.008

    # Nozzle
    ny_norm = np.clip((y - 0.375) / 0.045, 0.0, 1.0)
    nozzle_r = 0.006 + 0.026 * ny_norm
    d_nozzle_cone = np.sqrt((x - (-0.02))**2 + z**2) - nozzle_r
    d_nozzle_y = np.maximum(y - 0.420, 0.375 - y)
    d_nozzle = np.maximum(d_nozzle_cone, d_nozzle_y)

    # Metals (hotend + rails)
    p_block = p - np.array([-0.02, 0.435, 0.0], dtype=np.float32)
    d_block = sd_box(p_block, np.array([0.038, 0.015, 0.038], dtype=np.float32)) - 0.004
    p_fins = p - np.array([-0.02, 0.478, 0.0], dtype=np.float32)
    d_fins = sd_cylinder_z(p_fins, 0.054, 0.028) - 0.004
    d_hotend = np.minimum(d_block, d_fins)

    p_rod1 = p - np.array([0.0, 0.725, -0.055], dtype=np.float32)
    d_rod1 = sd_cylinder_x(p_rod1, 0.013, 0.52)
    p_rod2 = p - np.array([0.0, 0.680, -0.055], dtype=np.float32)
    d_rod2 = sd_cylinder_x(p_rod2, 0.011, 0.52)
    d_rails = np.minimum(d_rod1, d_rod2)

    eps = 0.006
    is_orange = (d_orange_core <= d_scene + eps)
    is_wheels = (d_wheels <= d_scene + eps) & (~is_orange)
    is_plate_clip = (np.minimum(d_plate, d_top_clip) <= d_scene + eps) & (~is_orange) & (~is_wheels)
    is_nozzle = (d_nozzle <= d_scene + eps) & (~is_orange) & (~is_wheels) & (~is_plate_clip)
    is_metals = (np.minimum(d_hotend, d_rails) <= d_scene + eps) & (~is_orange) & (~is_wheels) & (~is_plate_clip) & (~is_nozzle)

    mat_id = np.zeros(d_scene.shape[0], dtype=np.int32)
    mat_id[is_orange[:, 0]] = 1
    mat_id[is_wheels[:, 0]] = 2
    mat_id[is_plate_clip[:, 0]] = 3
    mat_id[is_nozzle[:, 0]] = 4
    mat_id[is_metals[:, 0]] = 5

    return mat_id

def calc_normal(p, eps=0.0016):
    dx = np.zeros_like(p); dx[..., 0] = eps
    dy = np.zeros_like(p); dy[..., 1] = eps
    dz = np.zeros_like(p); dz[..., 2] = eps

    nx = (get_scene_distance(p + dx) - get_scene_distance(p - dx))[..., 0]
    ny = (get_scene_distance(p + dy) - get_scene_distance(p - dy))[..., 0]
    nz = (get_scene_distance(p + dz) - get_scene_distance(p - dz))[..., 0]
    n = np.stack([nx, ny, nz], axis=-1)
    return normalize(n)

def render_hero_car():
    print("Initializing Falcon 3D-Printed Toy Car procedural raymarch renderer...", flush=True)
    t0 = time.time()

    # Resolution: 1.5x supersampled (1800 x 1350), downsampled to 1200 x 900
    W_HI = 1800
    H_HI = 1350
    W_TARGET = 1200
    H_TARGET = 900

    # Camera setup calibrated to exactly match previous Hero object footprint:
    # Baseline Y lands at exactly 736, Center X = 600
    cam_pos = np.array([-0.015, 0.360, 2.45], dtype=np.float32)
    cam_target = np.array([-0.015, 0.340, 0.0], dtype=np.float32)
    fwd = cam_target - cam_pos
    fwd /= np.linalg.norm(fwd)
    right = np.cross(fwd, np.array([0.0, 1.0, 0.0], dtype=np.float32))
    right /= np.linalg.norm(right)
    up = np.cross(right, fwd)

    fov_scale = 0.285

    # Photographic Studio Lights (soft diffused side-biased lighting)
    light_key = normalize(np.array([-0.55, 0.75, 0.85], dtype=np.float32))
    light_fill = normalize(np.array([0.70, 0.35, 0.70], dtype=np.float32))
    light_rim = normalize(np.array([0.0, 0.95, -0.65], dtype=np.float32))
    light_bounce = normalize(np.array([0.0, -1.0, 0.3], dtype=np.float32))

    final_rgba = np.zeros((H_HI, W_HI, 4), dtype=np.float32)

    CHUNK_SIZE = 90
    num_chunks = (H_HI + CHUNK_SIZE - 1) // CHUNK_SIZE

    print(f"Rendering {H_HI}x{W_HI} in {num_chunks} chunks...", flush=True)

    for chunk_idx in range(num_chunks):
        t_chunk_start = time.time()
        y_start = chunk_idx * CHUNK_SIZE
        y_end = min(y_start + CHUNK_SIZE, H_HI)
        chunk_h = y_end - y_start

        px = np.tile(np.arange(W_HI), (chunk_h, 1))
        py = np.repeat(np.arange(y_start, y_end), W_HI).reshape(chunk_h, W_HI)

        ndc_x = ((px + 0.5) / W_HI * 2.0 - 1.0) * (W_HI / H_HI) * fov_scale
        ndc_y = -((py + 0.5) / H_HI * 2.0 - 1.0) * fov_scale

        ray_dir = ndc_x[..., None] * right + ndc_y[..., None] * up + fwd
        ray_dir = normalize(ray_dir)

        t_ray = np.full((chunk_h, W_HI, 1), 1.5, dtype=np.float32)
        hit_mask = np.zeros((chunk_h, W_HI), dtype=bool)
        ray_orig = np.broadcast_to(cam_pos, (chunk_h, W_HI, 3)).copy()

        MAX_STEPS = 64
        SURF_DIST = 0.0024
        MAX_DIST = 4.2

        for step in range(MAX_STEPS):
            pos = ray_orig + t_ray * ray_dir
            dist = get_scene_distance(pos)

            close = dist[:, :, 0] < SURF_DIST
            far = t_ray[:, :, 0] > MAX_DIST

            hit_mask = hit_mask | close

            step_d = np.clip(dist[:, :, 0] * 0.90, 0.0018, 0.30)
            active = (~hit_mask) & (~far)
            if not np.any(active):
                break
            t_ray[active, 0] += step_d[active]

        if np.any(hit_mask):
            hit_p = ray_orig + t_ray * ray_dir
            hit_p_active = hit_p[hit_mask]

            normal_raw = calc_normal(hit_p_active)

            d_hit = get_scene_distance(hit_p_active)
            mat_id_active = get_surface_materials(hit_p_active, d_hit)

            # --- AUTHENTIC DENSE FDM LAYER LINES ---
            layer_height = 0.0055
            py_coord = hit_p_active[:, 1]
            px_coord = hit_p_active[:, 0]

            stepper_jitter = 0.00025 * np.sin(py_coord * 320.0) + 0.00015 * np.sin(py_coord * 840.0)
            layer_phase = ((py_coord + stepper_jitter) % layer_height) / layer_height

            layer_slope = np.sin((layer_phase - 0.5) * 3.14159)
            slope_factor = np.sqrt(np.maximum(1.0 - normal_raw[:, 1]**2, 0.0))

            is_printed = (mat_id_active == 0) | (mat_id_active == 1) | (mat_id_active == 2)
            layer_bump = np.where(is_printed[:, None], (layer_slope * 0.44 * slope_factor)[:, None], 0.0)

            # Stepped roof texture
            roof_stepped = np.sin(px_coord * 110.0) * 0.08
            is_roof = (py_coord > 0.32) & (py_coord < 0.38) & (mat_id_active == 0)
            layer_bump = np.where(is_roof[:, None], layer_bump + (roof_stepped * 0.15)[:, None], layer_bump)

            normal_perturbed = normal_raw.copy()
            normal_perturbed[:, 1:2] += layer_bump
            normal_perturbed = normalize(normal_perturbed)

            # --- WHEEL LATTICE / INFILL PATTERN ---
            dist_to_rw = np.sqrt((px_coord - (-0.23))**2 + (py_coord - 0.080)**2)
            dist_to_fw = np.sqrt((px_coord - 0.21)**2 + (py_coord - 0.080)**2)
            dist_to_center = np.minimum(dist_to_rw, dist_to_fw)
            
            wheel_center_x = np.where(px_coord < 0.0, -0.23, 0.21)
            angle = np.arctan2(py_coord - 0.080, px_coord - wheel_center_x)
            num_spokes = 16.0
            spoke_wave = np.cos(angle * num_spokes)
            spoke_ridge = np.clip(spoke_wave * 2.5, -1.0, 1.0)
            in_hub_gap = (dist_to_center > 0.022) & (dist_to_center < 0.072)

            is_wheel = (mat_id_active == 2)
            spoke_relief = np.where(is_wheel & in_hub_gap, spoke_wave * 0.25, 0.0)[:, None]
            normal_perturbed[:, 0:1] += spoke_relief * np.sin(angle)[:, None]
            normal_perturbed[:, 1:2] += spoke_relief * -np.cos(angle)[:, None]
            normal_perturbed = normalize(normal_perturbed)

            # --- COLOR ASSIGNMENT ---
            thermal_var = 0.012 * np.sin(py_coord * 70.0)
            col_ivory = np.array([0.942, 0.920, 0.865], dtype=np.float32) + thermal_var[:, None]

            col_toolhead_white = np.array([0.965, 0.962, 0.950], dtype=np.float32)
            col_printed_base = np.where(py_coord[:, None] > 0.48, col_toolhead_white, col_ivory)

            # Falcon Orange interior (#F36B16)
            col_orange = np.array([0.953, 0.420, 0.086], dtype=np.float32)

            spoke_darken = np.where(in_hub_gap & (spoke_ridge < 0.0), 0.52, 1.0)[:, None]
            col_wheel = col_ivory * spoke_darken

            col_dark = np.array([0.135, 0.138, 0.145], dtype=np.float32)
            col_brass = np.array([0.772, 0.628, 0.350], dtype=np.float32)
            col_chrome = np.array([0.780, 0.810, 0.840], dtype=np.float32)

            albedo = np.zeros((hit_p_active.shape[0], 3), dtype=np.float32)
            albedo[mat_id_active == 0] = col_printed_base[mat_id_active == 0]
            albedo[mat_id_active == 1] = col_orange
            albedo[mat_id_active == 2] = col_wheel[mat_id_active == 2]
            albedo[mat_id_active == 3] = col_dark
            albedo[mat_id_active == 4] = col_brass
            albedo[mat_id_active == 5] = col_chrome

            # --- LIGHTING CALCULATIONS ---
            n_dot_l = np.clip(np.sum(normal_perturbed * light_key, axis=-1, keepdims=True), 0.0, 1.0)
            diff_key = n_dot_l ** 1.05

            n_dot_fill = np.clip(np.sum(normal_perturbed * light_fill, axis=-1, keepdims=True), 0.0, 1.0)
            diff_fill = n_dot_fill * 0.35

            n_dot_bounce = np.clip(np.sum(normal_perturbed * light_bounce, axis=-1, keepdims=True), 0.0, 1.0)
            diff_bounce = n_dot_bounce * 0.14 * np.array([0.96, 0.94, 0.90], dtype=np.float32)

            view_dir = normalize(cam_pos - hit_p_active)
            rim_val = np.clip(np.sum(normal_perturbed * light_rim, axis=-1, keepdims=True), 0.0, 1.0)
            fresnel = (1.0 - np.clip(np.sum(normal_raw * view_dir, axis=-1, keepdims=True), 0.0, 1.0)) ** 3.2
            rim_light = rim_val * fresnel * 0.28

            ambient = 0.15

            is_metal = (mat_id_active == 4) | (mat_id_active == 5)
            half_vec = normalize(light_key + view_dir)
            spec_val = np.clip(np.sum(normal_raw * half_vec, axis=-1, keepdims=True), 0.0, 1.0) ** 32.0
            specular = np.where(is_metal[:, None], spec_val * 0.45, 0.0)

            total_light = ambient + diff_key * 0.72 + diff_fill + diff_bounce + rim_light
            shaded_rgb = np.clip(albedo * total_light + specular, 0.0, 1.0)

            # Soft ambient occlusion near nozzle gap
            near_nozzle_gap = np.clip(np.abs(py_coord - 0.368) / 0.022, 0.0, 1.0)
            shaded_rgb *= (0.75 + 0.25 * near_nozzle_gap[:, None])

            # Wheels contact shadow onto build plate
            is_plate = (mat_id_active == 3) & (py_coord < 0.015)
            rw_shadow = np.clip(np.abs(px_coord - (-0.23)) / 0.11, 0.0, 1.0)
            fw_shadow = np.clip(np.abs(px_coord - 0.21) / 0.11, 0.0, 1.0)
            wheel_plate_ao = np.minimum(rw_shadow, fw_shadow)
            plate_ao_factor = np.where(is_plate, 0.50 + 0.50 * wheel_plate_ao, 1.0)[:, None]
            shaded_rgb *= plate_ao_factor

            chunk_rgba = final_rgba[y_start:y_end]
            chunk_rgba[hit_mask, :3] = shaded_rgb
            chunk_rgba[hit_mask, 3] = 1.0
            final_rgba[y_start:y_end] = chunk_rgba

        dt_chunk = time.time() - t_chunk_start
        print(f"  Chunk {chunk_idx+1}/{num_chunks} processed in {dt_chunk:.2f}s.", flush=True)

    # =========================================================================
    # GROUND CONTACT DROP SHADOW UNDER BUILD PLATE
    # =========================================================================
    print("Generating grounded contact drop shadow beneath build plate...", flush=True)
    yy, xx = np.mgrid[0:H_HI, 0:W_HI]

    # Baseline where the build plate bottom sits in 1350-res: Y ~ 1105 (Y ~ 736 in 900-res)
    dx_plate = (xx - 900.0) / 460.0
    dy_plate = (yy - 1108.0) / 38.0
    dist_plate_shadow = np.sqrt(dx_plate**2 + dy_plate**2)
    shadow_tight = np.clip(1.0 - dist_plate_shadow, 0.0, 1.0) ** 1.6 * 0.42

    dy_soft = (yy - 1118.0) / 68.0
    dx_soft = (xx - 900.0) / 540.0
    dist_soft = np.sqrt(dx_soft**2 + dy_soft**2)
    shadow_soft = np.clip(1.0 - dist_soft, 0.0, 1.0) ** 1.3 * 0.22

    ground_shadow_alpha = np.maximum(shadow_tight, shadow_soft)

    # Composite ground shadow beneath object
    obj_rgb = final_rgba[:, :, :3]
    obj_a = final_rgba[:, :, 3]

    shadow_col = np.array([0.08, 0.08, 0.09], dtype=np.float32)
    comp_a = obj_a + ground_shadow_alpha * (1.0 - obj_a)
    comp_rgb = (obj_rgb * obj_a[..., None] + shadow_col * (ground_shadow_alpha * (1.0 - obj_a))[..., None]) / np.maximum(comp_a[..., None], 1e-5)

    comp_rgba = np.zeros((H_HI, W_HI, 4), dtype=np.float32)
    comp_rgba[:, :, :3] = comp_rgb
    comp_rgba[:, :, 3] = comp_a

    # Anti-aliasing via high-quality downsampling to 1200x900
    hi_img = Image.fromarray((np.clip(comp_rgba, 0.0, 1.0) * 255.0).astype(np.uint8), mode="RGBA")
    final_img = hi_img.resize((W_TARGET, H_TARGET), Image.Resampling.LANCZOS)

    # Save final asset
    asset_path = "public/assets/falcon/artifacts/hero-printed-car.webp"
    final_img.save(asset_path, "WEBP", quality=96)
    print(f"New asset saved to {asset_path}", flush=True)

    # Generate Checkpoint Preview on Warm Paper Background (#F5F1E9)
    preview_bg = Image.new("RGBA", (W_TARGET, H_TARGET), (245, 241, 233, 255))
    preview_composite = Image.alpha_composite(preview_bg, final_img)
    preview_path = "scripts/hero_car_preview.png"
    preview_composite.save(preview_path, "PNG")
    print(f"Checkpoint preview saved to {preview_path} in {time.time() - t0:.2f}s", flush=True)

    # Measure output footprint
    arr = np.array(final_img)
    alpha = arr[:, :, 3]
    y_solid, x_solid = np.where(alpha > 200)
    y_all, x_all = np.where(alpha > 1)
    print(f"Footprint measurement:", flush=True)
    print(f"  Solid object: X in [{x_solid.min()}, {x_solid.max()}] (Width = {x_solid.max()-x_solid.min()}), Center X = {(x_solid.min()+x_solid.max())/2.0:.1f}", flush=True)
    print(f"  Solid object: Y in [{y_solid.min()}, {y_solid.max()}] (Height = {y_solid.max()-y_solid.min()}), Baseline Y = {y_solid.max()}", flush=True)
    print(f"  Full shadow reaches: X in [{x_all.min()}, {x_all.max()}], Y in [{y_all.min()}, {y_all.max()}]", flush=True)

if __name__ == "__main__":
    render_hero_car()
