"""
Falcon 3D Prints — Master Hero 3D Object Procedural Photorealistic Renderer
Reproduces the visual character of the user's reference image:
- Authentic FDM additive-manufacturing physical print
- Visible horizontal FDM layer lines wrapping naturally around curved surfaces
- Warm ivory / off-white matte PLA filament material
- Distinctive aerodynamic centrifugal blower / impeller housing with curved lofted profile,
  helical stator blades, central hub with Falcon-orange accent ring
- Technical charcoal mounting base with 4 counterbored Allen hex screws
- Photographic eye-level studio lighting with directional key light and soft contact drop shadow
- Super-sampled anti-aliased composite exported to WebP
"""

import math
import time
import numpy as np
from PIL import Image, ImageFilter

def length(v):
    return np.sqrt(np.sum(v * v, axis=-1, keepdims=True))

def normalize(v):
    l = np.sqrt(np.sum(v * v, axis=-1, keepdims=True))
    return np.where(l > 1e-8, v / l, v)

def smin(a, b, k=0.08):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1.0 - h) + a * h - k * h * (1.0 - h)

def scene_sdf(p):
    x = p[..., 0]
    y = p[..., 1]
    z = p[..., 2]

    # --- 1. Base Mount Plate (Technical Charcoal) ---
    bx = np.abs(x) - 0.72
    by = np.abs(y - (-0.62)) - 0.08
    bz = np.abs(z) - 0.82
    r_plate = 0.08
    q_x = np.maximum(bx, 0.0)
    q_y = np.maximum(by, 0.0)
    q_z = np.maximum(bz, 0.0)
    d_base = np.sqrt(q_x*q_x + q_y*q_y + q_z*q_z) + np.minimum(np.maximum(bx, np.maximum(by, bz)), 0.0) - r_plate

    # Mounting holes / counterbores at 4 corners
    cx = np.abs(x) - 0.56
    cz = np.abs(z) - 0.66
    d_cyl_hole = np.sqrt(cx*cx + cz*cz) - 0.085
    d_hole = np.maximum(d_cyl_hole, by - 0.035)
    d_base = np.maximum(d_base, -d_hole)

    # Base pylon cradle supporting housing
    cradle_x = np.abs(x) - 0.36
    cradle_y = y - (-0.42)
    cradle_z = np.abs(z) - 0.52
    d_cradle = np.sqrt(np.maximum(cradle_x, 0.0)**2 + np.maximum(np.abs(cradle_y) - 0.16, 0.0)**2 + np.maximum(cradle_z, 0.0)**2) - 0.09

    # --- 2. Main Aerodynamic Housing (Warm Ivory PLA) ---
    hc_x = x
    hc_y = y - 0.08
    hc_z = z - (-0.05)

    r_axis = np.sqrt(hc_x*hc_x + hc_y*hc_y)
    
    # Lofted bellmouth curve
    z_norm = np.clip((hc_z - (-0.75)) / 1.4, 0.0, 1.0)
    target_radius = 0.54 + 0.16 * np.sin(z_norm * 3.14159 * 0.7) + 0.14 * (z_norm ** 4)

    # Outer shell
    d_outer_cylinder = r_axis - target_radius
    d_z_cap = np.maximum(hc_z - 0.65, -0.75 - hc_z)
    d_shell_raw = np.maximum(d_outer_cylinder, d_z_cap)

    # Smooth rounded front intake rim
    d_rim_torus = np.sqrt((r_axis - (0.54 + 0.16*np.sin(0.7*3.14) + 0.14))**2 + (hc_z - 0.65)**2) - 0.048
    d_outer = smin(d_shell_raw, d_rim_torus, k=0.06)

    # Inner cavity
    inner_radius = target_radius - 0.13
    d_inner = r_axis - inner_radius
    d_hollow = np.maximum(d_outer, -(d_inner))

    # --- 3. Internal Hub & Impeller Blades ---
    # Center hub cone
    hub_target_r = 0.22 - 0.12 * (hc_z - (-0.3))
    d_hub = np.maximum(r_axis - np.maximum(hub_target_r, 0.07), np.maximum(hc_z - 0.44, -0.6 - hc_z))
    d_tip = np.sqrt(hc_x*hc_x + hc_y*hc_y + (hc_z - 0.42)**2) - 0.08
    d_hub = smin(d_hub, d_tip, k=0.05)

    # 3 thick, cleanly printable helical blades
    angle = np.arctan2(hc_y, hc_x)
    twist = 0.9 * (hc_z - 0.0)
    blade_angle = (angle + twist) % (2.0 * math.pi / 3.0) - (math.pi / 3.0)
    d_vanes = (r_axis * np.abs(np.sin(blade_angle))) - 0.058
    d_vanes = np.maximum(d_vanes, np.maximum(r_axis - (target_radius - 0.04), -(r_axis - 0.13)))
    d_vanes = np.maximum(d_vanes, np.maximum(hc_z - 0.35, -0.45 - hc_z))

    # --- 4. Tangential Exhaust Spigot / Side Duct ---
    duct_x = x - 0.46
    duct_y = y - 0.42
    duct_z = z - (-0.22)
    d_duct = np.sqrt(duct_x*duct_x + duct_y*duct_y) - 0.23
    d_duct = np.maximum(d_duct, np.abs(duct_z) - 0.34)
    d_duct_hollow = np.maximum(d_duct, -(np.sqrt(duct_x*duct_x + duct_y*duct_y) - 0.17))

    # Combine Ivory components
    d_ivory = smin(d_hollow, d_hub, k=0.08)
    d_ivory = smin(d_ivory, d_vanes, k=0.05)
    d_ivory = smin(d_ivory, d_duct_hollow, k=0.10)
    d_ivory = smin(d_ivory, d_cradle, k=0.08)

    # Combine with Base plate
    d_scene = np.minimum(d_ivory, d_base)

    # Orange accent ring on hub
    d_orange_ring = np.maximum(np.abs(hc_z - 0.30) - 0.024, np.abs(r_axis - 0.16) - 0.02)

    return d_scene, d_ivory, d_base, d_orange_ring

def get_scene_distance(p):
    d_scene, _, _, _ = scene_sdf(p)
    return d_scene[..., None]

def calc_normal(p, eps=0.002):
    dx = np.zeros_like(p); dx[..., 0] = eps
    dy = np.zeros_like(p); dy[..., 1] = eps
    dz = np.zeros_like(p); dz[..., 2] = eps

    nx = (get_scene_distance(p + dx) - get_scene_distance(p - dx))[..., 0]
    ny = (get_scene_distance(p + dy) - get_scene_distance(p - dy))[..., 0]
    nz = (get_scene_distance(p + dz) - get_scene_distance(p - dz))[..., 0]
    n = np.stack([nx, ny, nz], axis=-1)
    return normalize(n)

def render_hero_final_asset(out_path):
    print(f"Rendering photorealistic 3D-printed Hero object to {out_path}...")
    t0 = time.time()

    # High-resolution render target (supersampled 1500x1125, downsampled to 1200x900)
    W_HI = 1500
    H_HI = 1125
    W_TARGET = 1200
    H_TARGET = 900

    # Camera setup (Authentic studio product photography angle)
    cam_pos = np.array([1.85, 0.95, 3.15], dtype=np.float32)
    cam_target = np.array([-0.06, -0.16, 0.0], dtype=np.float32)
    fwd = cam_target - cam_pos
    fwd /= np.linalg.norm(fwd)
    right = np.cross(fwd, np.array([0.0, 1.0, 0.0], dtype=np.float32))
    right /= np.linalg.norm(right)
    up = np.cross(right, fwd)

    fov_scale = 0.49

    # Studio Lighting setup
    # Key light: Soft directional key from high-left
    light_key = normalize(np.array([-0.72, 0.88, 0.62], dtype=np.float32))
    # Fill light: Cool ambient bounce from right
    light_fill = normalize(np.array([0.82, 0.28, 0.42], dtype=np.float32))
    # Top rim: Subtle edge highlight catching top layer ridges
    light_rim = normalize(np.array([0.08, 0.94, -0.78], dtype=np.float32))

    # Output buffer for hi-res render
    final_rgba = np.zeros((H_HI, W_HI, 4), dtype=np.float32)

    CHUNK_SIZE = 45
    num_chunks = (H_HI + CHUNK_SIZE - 1) // CHUNK_SIZE

    for chunk_idx in range(num_chunks):
        y_start = chunk_idx * CHUNK_SIZE
        y_end = min(y_start + CHUNK_SIZE, H_HI)
        chunk_h = y_end - y_start

        px = np.tile(np.arange(W_HI), (chunk_h, 1))
        py = np.repeat(np.arange(y_start, y_end), W_HI).reshape(chunk_h, W_HI)

        ndc_x = ((px + 0.5) / W_HI * 2.0 - 1.0) * (W_HI / H_HI) * fov_scale
        ndc_y = -((py + 0.5) / H_HI * 2.0 - 1.0) * fov_scale

        ray_dir = ndc_x[..., None] * right + ndc_y[..., None] * up + fwd
        ray_dir = normalize(ray_dir)

        t_ray = np.full((chunk_h, W_HI, 1), 1.9, dtype=np.float32)
        hit_mask = np.zeros((chunk_h, W_HI), dtype=bool)
        ray_orig = np.broadcast_to(cam_pos, (chunk_h, W_HI, 3)).copy()

        MAX_STEPS = 68
        SURF_DIST = 0.003
        MAX_DIST = 6.8

        for step in range(MAX_STEPS):
            pos = ray_orig + t_ray * ray_dir
            dist = get_scene_distance(pos)
            
            close = dist[:, :, 0] < SURF_DIST
            far = t_ray[:, :, 0] > MAX_DIST
            
            hit_mask = hit_mask | close
            
            step_d = np.clip(dist[:, :, 0] * 0.88, 0.002, 0.35)
            active = (~hit_mask) & (~far)
            if not np.any(active):
                break
            t_ray[active, 0] += step_d[active]

        if np.any(hit_mask):
            hit_p = ray_orig + t_ray * ray_dir
            hit_p_active = hit_p[hit_mask]

            normal_raw = calc_normal(hit_p_active)

            # --- AUTHENTIC HORIZONTAL FDM LAYER LINES ---
            # Layer height matching the reference scale (~130 distinct layers)
            layer_height = 0.0145
            py_coord = hit_p_active[:, 1]

            # Subtle stepper motor micro-variation
            stepper_jitter = 0.0006 * np.sin(py_coord * 210.0) + 0.0003 * np.sin(py_coord * 520.0)
            layer_phase = ((py_coord + stepper_jitter) % layer_height) / layer_height # [0, 1]

            # Rounded filament bead profile
            layer_slope = np.sin((layer_phase - 0.5) * 3.14159)
            slope_factor = np.sqrt(np.maximum(1.0 - normal_raw[:, 1]**2, 0.0))
            layer_bump = (layer_slope * 0.36 * slope_factor)[:, None]

            normal_perturbed = normal_raw.copy()
            normal_perturbed[:, 1:2] += layer_bump
            normal_perturbed = normalize(normal_perturbed)

            # Material classification
            _, d_iv, d_bs, d_org = scene_sdf(hit_p_active)
            is_ivory = (d_iv <= d_bs + 0.01)
            is_base = ~is_ivory
            is_orange = (d_org < 0.015) & is_ivory

            # Palette matching reference photo
            col_ivory_base = np.array([0.945, 0.925, 0.875], dtype=np.float32)  # Warm ivory PLA
            col_charcoal = np.array([0.17, 0.18, 0.19], dtype=np.float32)       # Technical charcoal
            col_orange = np.array([0.95, 0.42, 0.09], dtype=np.float32)         # Falcon Orange accent

            albedo = np.zeros_like(hit_p_active)
            albedo[is_ivory] = col_ivory_base
            albedo[is_base] = col_charcoal
            albedo[is_orange] = col_orange

            # Lighting
            n_dot_l = np.clip(np.sum(normal_perturbed * light_key, axis=-1, keepdims=True), 0.0, 1.0)
            diff_key = n_dot_l ** 1.12

            n_dot_fill = np.clip(np.sum(normal_perturbed * light_fill, axis=-1, keepdims=True), 0.0, 1.0)
            diff_fill = n_dot_fill * 0.36

            view_dir = normalize(cam_pos - hit_p_active)
            rim_val = np.clip(np.sum(normal_perturbed * light_rim, axis=-1, keepdims=True), 0.0, 1.0)
            fresnel = (1.0 - np.clip(np.sum(normal_raw * view_dir, axis=-1, keepdims=True), 0.0, 1.0)) ** 3.0
            rim_light = rim_val * fresnel * 0.42

            h_key = normalize(light_key + view_dir)
            spec = np.clip(np.sum(normal_perturbed * h_key, axis=-1, keepdims=True), 0.0, 1.0) ** 18.0 * 0.15

            # Crevice ambient occlusion between layer ridges
            layer_ao = (1.0 - 0.20 * (1.0 - np.sin(layer_phase * 3.14159)) * slope_factor)[:, None]
            base_ao = np.clip((hit_p_active[:, 1:2] - (-0.62)) / 0.45, 0.48, 1.0)
            ao = layer_ao * base_ao

            lit_color = albedo * (diff_key * 0.86 + diff_fill + 0.18) * ao + rim_light + spec
            lit_color[is_ivory] = np.clip(lit_color[is_ivory] * 1.06, 0.0, 1.0)

            chunk_rgb = np.zeros((chunk_h, W_HI, 3), dtype=np.float32)
            chunk_rgb[hit_mask] = np.clip(lit_color, 0.0, 1.0)

            chunk_alpha = np.zeros((chunk_h, W_HI, 1), dtype=np.float32)
            chunk_alpha[hit_mask] = 1.0

            final_rgba[y_start:y_end, :, :3] = chunk_rgb
            final_rgba[y_start:y_end, :, 3:4] = chunk_alpha

        print(f"  Chunk {chunk_idx + 1}/{num_chunks} done")

    # --- Ground Contact Shadow Generation ---
    print("Compositing realistic soft studio contact drop shadow...")
    yy, xx = np.mgrid[0:H_HI, 0:W_HI]
    sc_y, sc_x = H_HI * 0.73, W_HI * 0.50

    # Tight crisp contact occlusion
    dx1 = (xx - sc_x) / (W_HI * 0.28)
    dy1 = (yy - sc_y) / (H_HI * 0.055)
    tight_shadow = np.clip(1.0 - np.sqrt(dx1*dx1 + dy1*dy1), 0.0, 1.0) ** 2.2 * 0.48

    # Broad soft diffuse ambient shadow
    dx2 = (xx - sc_x) / (W_HI * 0.40)
    dy2 = (yy - sc_y - 14) / (H_HI * 0.11)
    diffuse_shadow = np.clip(1.0 - np.sqrt(dx2*dx2 + dy2*dy2), 0.0, 1.0) ** 1.6 * 0.26

    ground_shadow_alpha = np.maximum(tight_shadow, diffuse_shadow)

    # Object alpha & color
    obj_rgb = final_rgba[:, :, :3]
    obj_a = final_rgba[:, :, 3]

    # Composite ground shadow beneath object
    shadow_col = np.array([0.08, 0.08, 0.09], dtype=np.float32)
    # Background under object receives shadow where object is transparent
    comp_a = obj_a + ground_shadow_alpha * (1.0 - obj_a)
    comp_rgb = (obj_rgb * obj_a[..., None] + shadow_col * (ground_shadow_alpha * (1.0 - obj_a))[..., None]) / np.maximum(comp_a[..., None], 1e-5)

    comp_rgba = np.zeros((H_HI, W_HI, 4), dtype=np.float32)
    comp_rgba[:, :, :3] = comp_rgb
    comp_rgba[:, :, 3] = comp_a

    # Anti-aliasing via high-quality downsampling to 1200x900
    hi_img = Image.fromarray((np.clip(comp_rgba, 0.0, 1.0) * 255.0).astype(np.uint8), mode="RGBA")
    final_img = hi_img.resize((W_TARGET, H_TARGET), Image.Resampling.LANCZOS)

    # Save to output path
    final_img.save(out_path, "WEBP", quality=95)
    print(f"Asset successfully saved to {out_path} in {time.time() - t0:.2f}s")

if __name__ == "__main__":
    out = "c:/Users/User/OneDrive/Desktop/Clients/Falcon_3d_prints/falcon-web/public/assets/falcon/artifacts/hero-object-new.webp"
    render_hero_final_asset(out)
