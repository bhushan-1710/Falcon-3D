import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import cv2

# Master scale factor: viewBox is 300 x 340
# Render at 5x: 1500 x 1700 for ultra-crisp physical detail
SCALE = 5
W = 300 * SCALE # 1500
H = 340 * SCALE # 1700

def pt(x, y):
    return (int(round(x * SCALE)), int(round(y * SCALE)))

# Master geometry points (from ModelWireframe)
TOP_FACE = [(150, 52), (256, 108), (150, 164), (44, 108)]
TOP_INNER = [(150, 66), (238, 108), (150, 150), (62, 108)]
TOP_PLATEAU = [(150, 80), (218, 108), (150, 136), (82, 108)]

LID_LEFT = [(44, 108), (150, 164), (150, 192), (44, 136)]
LID_RIGHT = [(150, 164), (256, 108), (256, 136), (150, 192)]

BASE_LEFT = [(44, 136), (150, 192), (150, 282), (44, 226)]
BASE_RIGHT = [(150, 192), (256, 136), (256, 226), (150, 282)]

# Mounting ears:
# Left ear polygon: (44, 210) -> (20, 198) -> (20, 214) -> (44, 226)
EAR_LEFT_TOP = [(44, 210), (20, 198), (20, 204), (44, 216)]
EAR_LEFT_FRONT = [(20, 204), (44, 216), (44, 226), (20, 214)]

EAR_RIGHT_TOP = [(256, 210), (280, 198), (280, 204), (256, 216)]
EAR_RIGHT_FRONT = [(280, 204), (256, 216), (256, 226), (280, 214)]

BOSSES = [(150, 66), (238, 108), (150, 150), (62, 108)]

def render():
    np.random.seed(42)
    canvas = np.zeros((H, W, 4), dtype=np.float32)

    # Precompute 2D coordinate grid
    y_grid, x_grid = np.meshgrid(np.arange(H, dtype=np.float32), np.arange(W, dtype=np.float32), indexing='ij')

    # 1. Soft, realistic contact shadow on ground
    shadow_img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow_img)
    # Ambient ground shadow
    sdraw.ellipse([pt(15, 260), pt(285, 332)], fill=(15, 15, 18, 55))
    # Mid contact pool
    sdraw.ellipse([pt(35, 266), pt(265, 318)], fill=(12, 12, 15, 110))
    # Tight occlusion shadow directly along bottom edge
    tight_pts = [pt(40, 226), pt(150, 282), pt(260, 226), pt(265, 235), pt(150, 298), pt(35, 235)]
    sdraw.polygon(tight_pts, fill=(8, 8, 10, 160))
    
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(radius=12 * SCALE / 2))
    canvas = np.array(shadow_img, dtype=np.float32)

    def poly_mask(polygon_pts):
        mask = np.zeros((H, W), dtype=np.uint8)
        p_arr = np.array([pt(x, y) for x, y in polygon_pts], dtype=np.int32)
        cv2.fillPoly(mask, [p_arr], 255)
        return mask

    # 2. Mounting Flange Ears (Left & Right)
    # Left Ear Top
    el_top_mask = poly_mask(EAR_LEFT_TOP)
    canvas[el_top_mask > 0] = np.array([238, 234, 226, 255], dtype=np.float32)
    # Left Ear Front wall
    el_fr_mask = poly_mask(EAR_LEFT_FRONT)
    canvas[el_fr_mask > 0] = np.array([215, 210, 202, 255], dtype=np.float32)

    # Right Ear Top
    er_top_mask = poly_mask(EAR_RIGHT_TOP)
    canvas[er_top_mask > 0] = np.array([220, 216, 208, 255], dtype=np.float32)
    # Right Ear Front wall
    er_fr_mask = poly_mask(EAR_RIGHT_FRONT)
    canvas[er_fr_mask > 0] = np.array([175, 170, 162, 255], dtype=np.float32)

    # Ear Holes / Screw holes with beveled countersink
    for cx, cy, is_left in [(28, 206, True), (272, 206, False)]:
        c_x, c_y = pt(cx, cy)
        rx = int(3.5 * SCALE)
        ry = int(2.0 * SCALE)
        # Outer countersink shadow
        cv2.ellipse(canvas, (c_x, c_y), (rx + int(0.8 * SCALE), ry + int(0.5 * SCALE)), 0, 0, 360, (60, 58, 54, 210), -1, cv2.LINE_AA)
        # Brass insert ring inside ear hole
        cv2.ellipse(canvas, (c_x, c_y), (rx, ry), 0, 0, 360, (200, 160, 60, 255), -1, cv2.LINE_AA)
        # Inner through-hole
        cv2.ellipse(canvas, (c_x, c_y), (rx - int(1.2 * SCALE), ry - int(0.7 * SCALE)), 0, 0, 360, (20, 18, 16, 255), -1, cv2.LINE_AA)

    # 3. Base Body Left Face
    base_l_mask = poly_mask(BASE_LEFT)
    t_y = np.clip((y_grid - 136 * SCALE) / ((282 - 136) * SCALE), 0, 1)
    
    # Warm ivory with realistic lighting gradient and subtle corner ambient occlusion
    # Left face faces towards key light (top-left)
    base_l_r = 236 - t_y * 14
    base_l_g = 232 - t_y * 14
    base_l_b = 224 - t_y * 14
    base_l_color = np.dstack([base_l_r, base_l_g, base_l_b, np.full((H, W), 255, dtype=np.float32)])
    canvas[base_l_mask > 0] = base_l_color[base_l_mask > 0]

    # 4. Base Body Right Face
    base_r_mask = poly_mask(BASE_RIGHT)
    # Right face is in fill light / shadow side
    base_r_r = 192 - t_y * 16
    base_r_g = 188 - t_y * 16
    base_r_b = 180 - t_y * 16
    base_r_color = np.dstack([base_r_r, base_r_g, base_r_b, np.full((H, W), 255, dtype=np.float32)])
    canvas[base_r_mask > 0] = base_r_color[base_r_mask > 0]

    # 5. Base Left Face: Realistic Vent Louvers
    # Each louver has: slot opening, internal fin sloping back, and bottom rim highlight
    louver_lines = [
        ((70, 178), (122, 208)),
        ((70, 192), (122, 222)),
        ((70, 206), (122, 236))
    ]
    for p1, p2 in louver_lines:
        p1_pt, p2_pt = pt(*p1), pt(*p2)
        # Deep interior slot
        cv2.line(canvas, p1_pt, p2_pt, (26, 25, 28, 255), int(3.2 * SCALE), cv2.LINE_AA)
        # Internal angled fin (shows internal wall thickness)
        fin_p1 = (p1_pt[0], p1_pt[1] + int(0.9 * SCALE))
        fin_p2 = (p2_pt[0], p2_pt[1] + int(0.9 * SCALE))
        cv2.line(canvas, fin_p1, fin_p2, (110, 106, 100, 255), int(1.4 * SCALE), cv2.LINE_AA)
        # Lower edge highlight (plastic lip catching light)
        lip_p1 = (p1_pt[0], p1_pt[1] + int(2.2 * SCALE))
        lip_p2 = (p2_pt[0], p2_pt[1] + int(2.2 * SCALE))
        cv2.line(canvas, lip_p1, lip_p2, (252, 249, 244, 220), int(1.0 * SCALE), cv2.LINE_AA)

    # 6. Base Right Face: Realistic I/O Cutout (recessed rectangular socket)
    io_poly = np.array([pt(178, 214), pt(228, 184), pt(228, 204), pt(178, 234)], dtype=np.int32)
    # Beveled socket wall (chamfer)
    cv2.fillPoly(canvas, [io_poly], (50, 48, 54, 255), lineType=cv2.LINE_AA)
    # Recessed inner void
    io_inner_poly = np.array([pt(182, 213), pt(224, 188), pt(224, 201), pt(182, 226)], dtype=np.int32)
    cv2.fillPoly(canvas, [io_inner_poly], (20, 19, 22, 255), lineType=cv2.LINE_AA)
    # Internal metal connector shield (USB-C socket inside)
    usb_shield = np.array([pt(194, 214), pt(212, 203), pt(212, 208), pt(194, 219)], dtype=np.int32)
    cv2.fillPoly(canvas, [usb_shield], (85, 82, 90, 255), lineType=cv2.LINE_AA)
    cv2.fillPoly(canvas, [np.array([pt(197, 214), pt(209, 207), pt(209, 209), pt(197, 216)], dtype=np.int32)], (12, 12, 14, 255), lineType=cv2.LINE_AA)
    # Lower sill highlight catching bounce light
    cv2.line(canvas, pt(178, 234), pt(228, 204), (228, 224, 216, 240), int(1.4 * SCALE), cv2.LINE_AA)

    # 7. Parting Seam Line & Undercut Shadow (between Base and Lid)
    seam_p1, seam_p2, seam_p3 = pt(44, 136), pt(150, 192), pt(256, 136)
    # Deep shadow cast by lid overhang onto base
    cv2.line(canvas, (seam_p1[0], seam_p1[1] + int(1.2 * SCALE)), (seam_p2[0], seam_p2[1] + int(1.2 * SCALE)), (30, 28, 32, 190), int(2.6 * SCALE), cv2.LINE_AA)
    cv2.line(canvas, (seam_p2[0], seam_p2[1] + int(1.2 * SCALE)), (seam_p3[0], seam_p3[1] + int(1.2 * SCALE)), (24, 22, 26, 210), int(2.6 * SCALE), cv2.LINE_AA)
    # Realistic mechanical split groove (parting line)
    cv2.line(canvas, seam_p1, seam_p2, (45, 42, 46, 255), int(1.4 * SCALE), cv2.LINE_AA)
    cv2.line(canvas, seam_p2, seam_p3, (40, 38, 42, 255), int(1.4 * SCALE), cv2.LINE_AA)

    # 8. Lid Body Vertical Drop
    # Left Lid Face
    lid_l_mask = poly_mask(LID_LEFT)
    lid_l_r = 242 - t_y * 8
    lid_l_g = 238 - t_y * 8
    lid_l_b = 230 - t_y * 8
    lid_l_color = np.dstack([lid_l_r, lid_l_g, lid_l_b, np.full((H, W), 255, dtype=np.float32)])
    canvas[lid_l_mask > 0] = lid_l_color[lid_l_mask > 0]

    # Right Lid Face
    lid_r_mask = poly_mask(LID_RIGHT)
    lid_r_r = 196 - t_y * 10
    lid_r_g = 192 - t_y * 10
    lid_r_b = 184 - t_y * 10
    lid_r_color = np.dstack([lid_r_r, lid_r_g, lid_r_b, np.full((H, W), 255, dtype=np.float32)])
    canvas[lid_r_mask > 0] = lid_r_color[lid_r_mask > 0]

    # 9. Realistic FDM Layer Striations across all vertical faces
    # True FDM micro-grooves: each layer has rounded convex surface catching light on top, shading on bottom
    layer_period = 2.2 * SCALE # ~0.2mm layer height
    phase_y = (y_grid % layer_period) / layer_period # 0 to 1
    # Micro-layer shading: top of layer is highlighted, bottom is in micro-crevice shadow
    fdm_ridge = np.sin(phase_y * 2 * math.pi) * 3.8
    # Subtle layer-to-layer flow irregularity (micro-imperfections)
    wobble = np.sin(y_grid * 0.12) * np.cos(x_grid * 0.08) * 1.5
    fdm_texture = fdm_ridge + wobble

    vertical_mask = (base_l_mask > 0) | (base_r_mask > 0) | (lid_l_mask > 0) | (lid_r_mask > 0) | (el_fr_mask > 0) | (er_fr_mask > 0)
    for c in range(3):
        canvas[vertical_mask, c] = np.clip(canvas[vertical_mask, c] + fdm_texture[vertical_mask], 0, 255)

    # 10. Top Lid Face (Upward-facing surface)
    top_mask = poly_mask(TOP_FACE)
    top_r = np.full((H, W), 250, dtype=np.float32)
    top_g = np.full((H, W), 247, dtype=np.float32)
    top_b = np.full((H, W), 240, dtype=np.float32)
    top_color = np.dstack([top_r, top_g, top_b, np.full((H, W), 255, dtype=np.float32)])
    canvas[top_mask > 0] = top_color[top_mask > 0]

    # Realistic top-surface 45-degree rectilinear FDM raster texture
    diag = (x_grid + y_grid) * (math.pi / (1.6 * SCALE))
    top_raster = np.sin(diag) * 2.2
    canvas[top_mask > 0, 0] = np.clip(canvas[top_mask > 0, 0] + top_raster[top_mask > 0], 0, 255)
    canvas[top_mask > 0, 1] = np.clip(canvas[top_mask > 0, 1] + top_raster[top_mask > 0], 0, 255)
    canvas[top_mask > 0, 2] = np.clip(canvas[top_mask > 0, 2] + top_raster[top_mask > 0], 0, 255)

    # 2 concentric outer perimeters / shells around TOP_FACE
    top_pts_arr = np.array([pt(x, y) for x, y in TOP_FACE], dtype=np.int32)
    cv2.polylines(canvas, [top_pts_arr], True, (230, 226, 218, 255), int(1.2 * SCALE), lineType=cv2.LINE_AA)

    # 11. Inner Chamfer Step
    inner_mask = poly_mask(TOP_INNER)
    inner_r = np.full((H, W), 244, dtype=np.float32)
    inner_g = np.full((H, W), 241, dtype=np.float32)
    inner_b = np.full((H, W), 234, dtype=np.float32)
    inner_color = np.dstack([inner_r, inner_g, inner_b, np.full((H, W), 255, dtype=np.float32)])
    canvas[inner_mask > 0] = inner_color[inner_mask > 0]
    # Subtle raster inside inner chamfer
    canvas[inner_mask > 0, 0] = np.clip(canvas[inner_mask > 0, 0] + top_raster[inner_mask > 0] * 0.7, 0, 255)
    canvas[inner_mask > 0, 1] = np.clip(canvas[inner_mask > 0, 1] + top_raster[inner_mask > 0] * 0.7, 0, 255)
    canvas[inner_mask > 0, 2] = np.clip(canvas[inner_mask > 0, 2] + top_raster[inner_mask > 0] * 0.7, 0, 255)

    # Restrained Falcon Orange pinstripe accent groove along inner chamfer boundary
    inner_poly_pts = np.array([pt(x, y) for x, y in TOP_INNER], dtype=np.int32)
    # Chamfer drop shadow
    cv2.polylines(canvas, [inner_poly_pts], True, (120, 115, 108, 180), int(1.4 * SCALE), lineType=cv2.LINE_AA)
    # Fine Falcon Orange accent line
    cv2.polylines(canvas, [inner_poly_pts], True, (243, 107, 22, 175), int(0.9 * SCALE), lineType=cv2.LINE_AA)

    # 12. Recessed Central Plateau
    plateau_mask = poly_mask(TOP_PLATEAU)
    plateau_r = np.full((H, W), 238, dtype=np.float32)
    plateau_g = np.full((H, W), 235, dtype=np.float32)
    plateau_b = np.full((H, W), 228, dtype=np.float32)
    plateau_color = np.dstack([plateau_r, plateau_g, plateau_b, np.full((H, W), 255, dtype=np.float32)])
    canvas[plateau_mask > 0] = plateau_color[plateau_mask > 0]
    canvas[plateau_mask > 0, 0] = np.clip(canvas[plateau_mask > 0, 0] + top_raster[plateau_mask > 0] * 0.5, 0, 255)
    canvas[plateau_mask > 0, 1] = np.clip(canvas[plateau_mask > 0, 1] + top_raster[plateau_mask > 0] * 0.5, 0, 255)
    canvas[plateau_mask > 0, 2] = np.clip(canvas[plateau_mask > 0, 2] + top_raster[plateau_mask > 0] * 0.5, 0, 255)

    # Drop shadow cast inside recessed plateau along top-rear edges
    p_pts = [pt(x, y) for x, y in TOP_PLATEAU]
    cv2.line(canvas, p_pts[3], p_pts[0], (55, 52, 48, 120), int(2.0 * SCALE), cv2.LINE_AA)
    cv2.line(canvas, p_pts[0], p_pts[1], (55, 52, 48, 120), int(2.0 * SCALE), cv2.LINE_AA)
    # Highlight along front lip of recessed plateau
    cv2.line(canvas, p_pts[1], p_pts[2], (255, 255, 252, 190), int(1.4 * SCALE), cv2.LINE_AA)
    cv2.line(canvas, p_pts[2], p_pts[3], (255, 255, 252, 190), int(1.4 * SCALE), cv2.LINE_AA)

    # 13. 4 Knurled Brass Heat-Set Inserts on Top Face
    # BOSSES = [(150, 66), (238, 108), (150, 150), (62, 108)]
    for bx, by in BOSSES:
        cx, cy = pt(bx, by)
        rx = int(6.0 * SCALE)
        ry = int(3.5 * SCALE)
        
        # Melted thermoplastic raised rim / heat-set volcano collar (real FDM detail)
        cv2.ellipse(canvas, (cx, cy), (rx + int(1.5 * SCALE), ry + int(0.9 * SCALE)), 0, 0, 360, (255, 252, 245, 200), int(0.9 * SCALE), cv2.LINE_AA)
        cv2.ellipse(canvas, (cx, cy), (rx + int(1.0 * SCALE), ry + int(0.6 * SCALE)), 0, 0, 360, (190, 185, 175, 255), -1, cv2.LINE_AA)
        cv2.ellipse(canvas, (cx, cy), (rx + int(0.4 * SCALE), ry + int(0.2 * SCALE)), 0, 0, 360, (50, 46, 40, 200), int(0.8 * SCALE), cv2.LINE_AA)
        
        # Rich brass knurled collar
        cv2.ellipse(canvas, (cx, cy), (rx, ry), 0, 0, 360, (216, 172, 68, 255), -1, cv2.LINE_AA)
        
        # Micro knurling teeth around circumference
        for angle_deg in range(0, 360, 15):
            rad = math.radians(angle_deg)
            x_outer = int(cx + rx * math.cos(rad))
            y_outer = int(cy + ry * math.sin(rad))
            x_inner = int(cx + (rx - int(1.4 * SCALE)) * math.cos(rad))
            y_inner = int(cy + (ry - int(0.8 * SCALE)) * math.sin(rad))
            
            # Anisotropic metallic glint
            glint = 245 if (math.sin(rad) < -0.2) else (170 if math.sin(rad) > 0.2 else 210)
            brass_c = (int(glint), int(glint * 0.76), int(glint * 0.32), 255)
            cv2.line(canvas, (x_inner, y_inner), (x_outer, y_outer), brass_c, int(0.9 * SCALE), cv2.LINE_AA)
        
        # Inner threaded hole
        rx_hole = int(2.9 * SCALE)
        ry_hole = int(1.7 * SCALE)
        cv2.ellipse(canvas, (cx, cy), (rx_hole, ry_hole), 0, 0, 360, (24, 22, 20, 255), -1, cv2.LINE_AA)
        # Internal M3 screw thread spiral glint
        cv2.ellipse(canvas, (cx, cy), (rx_hole, ry_hole), 0, 180, 360, (195, 160, 80, 220), int(0.7 * SCALE), cv2.LINE_AA)

    # 14. Crisp Physical Edges and Specular Chamfer Highlights
    # Top face perimeter bevel
    # Top rear edges: subtle dark silhouette against background
    cv2.line(canvas, pt(44, 108), pt(150, 52), (180, 175, 168, 220), int(1.2 * SCALE), cv2.LINE_AA)
    cv2.line(canvas, pt(150, 52), pt(256, 108), (170, 165, 158, 220), int(1.2 * SCALE), cv2.LINE_AA)
    # Top front edges: crisp highlight catching top-light
    cv2.line(canvas, pt(44, 108), pt(150, 164), (255, 255, 252, 240), int(1.4 * SCALE), cv2.LINE_AA)
    cv2.line(canvas, pt(150, 164), pt(256, 108), (252, 250, 244, 240), int(1.4 * SCALE), cv2.LINE_AA)

    # Central vertical corner ridge (from (150, 164) down through (150, 192), to (150, 282))
    # Signature dividing ridge between lit left side and shadowed right side
    cv2.line(canvas, pt(150, 164), pt(150, 192), (255, 255, 255, 230), int(1.4 * SCALE), cv2.LINE_AA) # lid ridge
    cv2.line(canvas, pt(150, 192), pt(150, 282), (255, 255, 252, 220), int(1.4 * SCALE), cv2.LINE_AA) # base ridge

    # Left and right vertical silhouette edges
    cv2.line(canvas, pt(44, 108), pt(44, 136), (225, 220, 210, 200), int(1.1 * SCALE), cv2.LINE_AA)
    cv2.line(canvas, pt(44, 136), pt(44, 226), (215, 210, 200, 200), int(1.1 * SCALE), cv2.LINE_AA)
    cv2.line(canvas, pt(256, 108), pt(256, 136), (165, 160, 150, 220), int(1.1 * SCALE), cv2.LINE_AA)
    cv2.line(canvas, pt(256, 136), pt(256, 226), (155, 150, 140, 220), int(1.1 * SCALE), cv2.LINE_AA)

    # Base bottom edge (ground contact line)
    cv2.line(canvas, pt(44, 226), pt(150, 282), (35, 33, 36, 230), int(1.6 * SCALE), cv2.LINE_AA)
    cv2.line(canvas, pt(150, 282), pt(256, 226), (30, 28, 32, 230), int(1.6 * SCALE), cv2.LINE_AA)

    # 15. Fine Matte Grain Texture across solid object
    solid_mask = canvas[:, :, 3] > 40
    matte_grain = (np.random.randn(H, W) * 2.2).astype(np.float32)
    for c in range(3):
        canvas[solid_mask, c] = np.clip(canvas[solid_mask, c] + matte_grain[solid_mask], 0, 255)

    final_img = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), mode='RGBA')
    return final_img

if __name__ == '__main__':
    img = render()
    img.save('test_physical_enclosure.png', 'PNG')
    # Save directly to public assets as WebP
    out_webp = 'public/assets/transform/transform-physical.webp'
    img.save(out_webp, 'WEBP', quality=95)
    print(f'Successfully rendered and saved to {out_webp}!')
