from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
# Ensure torch uses weights_only=False when loading trusted checkpoints.
# This must be set before importing torch so the loader picks it up.
os.environ['TORCH_WEIGHTS_ONLY'] = 'False'
import numpy as np
import cv2
import torch
from ultralytics import YOLO

app = FastAPI(title="Posture API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://10.24.2.152:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load a small pose model. Options: "yolo11n-pose.pt" (latest) or "yolov8n-pose.pt".
# Ultralytics will auto-download weights on first run.
MODEL_NAME = "yolov8n-pose.pt"

# Create model with weights_only=False to bypass PyTorch security restriction

# Some PyTorch versions use a safe unpickler that blocks arbitrary globals when
# loading checkpoints. Trusted ultralytics checkpoints contain a PoseModel class
# that must be allowlisted for deserialization. We attempt to register the
# The prior approach added ad-hoc allowlists for each failing global. To
# reduce maintenance and avoid repeated edits, create a helper that attempts
# to import and register a curated list of common classes used in ultralytics
# and torch checkpoints. Only run this for trusted checkpoints!
def register_safe_globals():
    import importlib
    try:
        import torch as _torch
    except Exception:
        return

    candidates = [
        # ultralytics classes
        "ultralytics.nn.tasks.PoseModel",
        "ultralytics.nn.modules.block.C2f",
    "ultralytics.nn.modules.block.Bottleneck",
        "ultralytics.nn.modules.conv.Conv",
        # common torch classes
        "torch.nn.modules.conv.Conv2d",
        "torch.nn.modules.batchnorm.BatchNorm2d",
        "torch.nn.modules.container.Sequential",
    "torch.nn.modules.container.ModuleList",
        "torch.nn.modules.activation.SiLU",
        # Add a few extra frequently-used classes that may appear
        "torch.nn.modules.linear.Linear",
        "torch.nn.modules.pooling.MaxPool2d",
        "torch.nn.modules.pooling.AdaptiveAvgPool2d",
        "collections.OrderedDict",
    ]

    for path in candidates:
        parts = path.split('.')
        mod_name = '.'.join(parts[:-1])
        cls_name = parts[-1]
        try:
            mod = importlib.import_module(mod_name)
            cls = getattr(mod, cls_name)
        except Exception:
            # If importing fails, skip silently; it's harmless to miss one
            continue

        # Try preferred API then fallback API
        try:
            _torch.serialization.add_safe_globals([cls])
        except Exception:
            try:
                _torch.serialization.safe_globals([cls])
            except Exception:
                pass

# Run allowlisting for a set of expected classes. This reduces repeated
# edits; keep this conservative and only register classes we expect in
# trusted ultralytics checkpoints.
register_safe_globals()
try:
    model = YOLO(MODEL_NAME)
except Exception as e:
    print(f"Error loading model: {e}")
    # Fallback: create a mock model for testing
    model = None

COCO_KPTS = [
    "nose","left_eye","right_eye","left_ear","right_ear",
    "left_shoulder","right_shoulder","left_elbow","right_elbow",
    "left_wrist","right_wrist","left_hip","right_hip",
    "left_knee","right_knee","left_ankle","right_ankle"
]

def angle_deg(p1, p2, p3):
    a = np.array(p1) - np.array(p2)
    b = np.array(p3) - np.array(p2)
    na = np.linalg.norm(a); nb = np.linalg.norm(b)
    if na == 0 or nb == 0: return None
    cosang = np.clip(np.dot(a, b) / (na * nb), -1.0, 1.0)
    return float(np.degrees(np.arccos(cosang)))

def line_angle_from_vertical(p_top, p_bottom):
    v = np.array(p_top) - np.array(p_bottom)
    if np.linalg.norm(v) == 0: return None
    vu = np.array([0, -1.0])
    v = v / (np.linalg.norm(v) + 1e-9)
    ang = np.degrees(np.arccos(np.clip(np.dot(v, vu), -1.0, 1.0)))
    return float(ang)

def midpoint(p, q):
    return ((p[0]+q[0])/2.0, (p[1]+q[1])/2.0)

def to_xyv(kpts_row):
    pts = {}
    for i, name in enumerate(COCO_KPTS):
        x = float(kpts_row[3*i]); y = float(kpts_row[3*i+1]); v = float(kpts_row[3*i+2])
        pts[name] = ((x, y), v)
    return pts

def safe(p_dict, key):
    return p_dict.get(key, ((None, None), 0.0))

def posture_report(k):
    def g(name):
        (xy, vis) = safe(k, name)
        return xy if vis > 0.3 else (None, None)

    ls = g("left_shoulder");  rs = g("right_shoulder")
    lh = g("left_hip");       rh = g("right_hip")
    le = g("left_ear");       re = g("right_ear")
    nose = g("nose")
    lk = g("left_knee");      rk = g("right_knee")
    la = g("left_ankle");     ra = g("right_ankle")

    sh_mid = midpoint(ls, rs) if None not in (ls[0], rs[0]) else (None, None)
    hip_mid = midpoint(lh, rh) if None not in (lh[0], rh[0]) else (None, None)
    ear_mid = midpoint(le, re) if None not in (le[0], re[0]) else (None, None)

    torso_lean = line_angle_from_vertical(sh_mid, hip_mid) if None not in sh_mid+hip_mid else None
    head_ref = ear_mid if None not in ear_mid else nose
    head_tilt = line_angle_from_vertical(head_ref, sh_mid) if None not in head_ref+sh_mid else None

    shoulder_drop = None
    if None not in (ls[1], rs[1]):
        shoulder_drop = float(rs[1] - ls[1])

    pelvic_tilt = None
    if None not in (lh[1], rh[1]):
        pelvic_tilt = float(rh[1] - lh[1])

    left_knee_angle = angle_deg(lh, lk, la) if None not in lh+lk+la else None
    right_knee_angle = angle_deg(rh, rk, ra) if None not in rh+rk+ra else None

    tips = []
    if head_tilt is not None and head_tilt > 10:
        tips.append(f"Forward head tilt ~{head_tilt:.1f}°. Try gently tucking the chin and lengthening the back of the neck.")
    if torso_lean is not None and torso_lean > 8:
        tips.append(f"Torso leaning ~{torso_lean:.1f}° from vertical. Stack ribs over pelvis; engage core lightly.")
    if shoulder_drop is not None and abs(shoulder_drop) > 12:
        side = "right" if shoulder_drop > 0 else "left"
        tips.append(f"{side.capitalize()} shoulder lower. Balance shoulder height and relax upper traps.")
    if pelvic_tilt is not None and abs(pelvic_tilt) > 12:
        side = "right" if pelvic_tilt > 0 else "left"
        tips.append(f"Pelvis dips on the {side}. Level hips; think ‘tall through the crown’ while engaging glutes.")
    for knee_name, kn in [("left", left_knee_angle), ("right", right_knee_angle)]:
        if kn is not None and kn < 170:
            tips.append(f"{knee_name.capitalize()} knee bent (~{kn:.0f}°). Soften stance evenly or straighten gently.")

    return {
        "metrics": {
            "head_tilt_deg": head_tilt,
            "torso_lean_deg": torso_lean,
            "shoulder_drop_px": shoulder_drop,
            "pelvic_drop_px": pelvic_tilt,
            "left_knee_angle_deg": left_knee_angle,
            "right_knee_angle_deg": right_knee_angle
        },
        "tips": tips
    }

class Health(BaseModel):
    status: str

@app.get("/health", response_model=Health)
def health():
    return {"status": "ok"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if model is None:
        return {"detected": False, "message": "Model not loaded. Please check server logs."}
    
    data = await file.read()
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return JSONResponse(status_code=400, content={"error": "Invalid image"})
    
    try:
        results = model(img)
        best = None; best_conf = -1
        for r in results:
            if hasattr(r, "keypoints") and r.keypoints is not None:
                for kp, bbox, conf in zip(r.keypoints.xy, r.boxes.xyxy if r.boxes is not None else [], 
                                          r.boxes.conf if r.boxes is not None else []):
                    c = float(conf) if conf is not None else 0.0
                    if c > best_conf:
                        best_conf = c
                        best = kp.squeeze(0).cpu().numpy()
        if best is None:
            return {"detected": False, "message": "No person detected"}
        try:
            all_kpts = results[0].keypoints
            confs = all_kpts.conf[0].cpu().numpy() if all_kpts.conf is not None else np.ones((17,))
        except:
            confs = np.ones((17,))
        flat = []
        for i in range(17):
            flat += [best[i,0], best[i,1], confs[i]]
        kdict = to_xyv(flat)
        report = posture_report(kdict)
        return {"detected": True, "keypoints": kdict, **report}
    except Exception as e:
        return {"detected": False, "message": f"Analysis failed: {str(e)}"}
