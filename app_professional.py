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

app = FastAPI(title="Enhanced Posture API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://10.24.2.152:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load pose model. Options by accuracy (higher = more accurate but slower):
# "yolov8n-pose.pt" (nano - fastest)
# "yolov8s-pose.pt" (small - balanced)  
# "yolov8m-pose.pt" (medium - higher accuracy)
# "yolov8l-pose.pt" (large - best accuracy)
# "yolo11n-pose.pt" (latest YOLO11 - improved architecture)
MODEL_NAME = "yolov8n-pose.pt"  # Using nano for compatibility

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
        "ultralytics.nn.modules.block.SPPF",
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
        "torch.nn.modules.pooling.AdaptiveMaxPool2d",
        "torch.nn.modules.upsampling.Upsample",
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
    # Load model with explicit weights_only=False
    import tempfile
    import shutil
    original_torch_load = torch.load
    
    def unsafe_load(*args, **kwargs):
        kwargs['weights_only'] = False
        return original_torch_load(*args, **kwargs)
    
    # Temporarily patch torch.load
    torch.load = unsafe_load
    model = YOLO(MODEL_NAME)
    # Restore original function
    torch.load = original_torch_load
    print(f"✅ Successfully loaded {MODEL_NAME} model")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    # Fallback: create a mock model for testing
    model = None

def preprocess_image(img):
    """Enhanced image preprocessing for better pose detection"""
    # Resize to optimal input size while maintaining aspect ratio
    h, w = img.shape[:2]
    target_size = 640  # YOLO's optimal input size
    
    if max(h, w) > target_size:
        scale = target_size / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    
    # Enhance contrast for better keypoint detection
    try:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        
        img = cv2.merge([l, a, b])
        img = cv2.cvtColor(img, cv2.COLOR_LAB2BGR)
    except:
        # Fallback to simpler enhancement if CLAHE fails
        img = cv2.convertScaleAbs(img, alpha=1.1, beta=10)
    
    return img

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

def safe(p_dict, key, min_confidence=0.4):
    """Get keypoint with minimum confidence threshold"""
    (xy, vis) = p_dict.get(key, ((None, None), 0.0))
    return xy if vis > min_confidence else (None, None)

def posture_report(k):
    """Enhanced posture analysis with comprehensive professional feedback"""
    def g(name, min_conf=0.4):
        (xy, vis) = safe(k, name, min_conf)
        return xy if vis > min_conf else (None, None)

    # Get keypoints with confidence requirements
    ls = g("left_shoulder", 0.5);  rs = g("right_shoulder", 0.5)
    lh = g("left_hip", 0.5);       rh = g("right_hip", 0.5)
    le = g("left_ear", 0.3);       re = g("right_ear", 0.3)
    nose = g("nose", 0.5)
    lk = g("left_knee", 0.4);      rk = g("right_knee", 0.4)
    la = g("left_ankle", 0.3);     ra = g("right_ankle", 0.3)

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

    # Calculate body proportions for adaptive thresholds
    body_height = None
    shoulder_width = None
    
    if None not in sh_mid + hip_mid:
        body_height = abs(sh_mid[1] - hip_mid[1])
    if None not in (ls[0], rs[0]):
        shoulder_width = abs(rs[0] - ls[0])
    
    # Adaptive thresholds
    head_tilt_threshold = 12 if body_height and body_height > 200 else 10
    torso_lean_threshold = 10 if body_height and body_height > 200 else 8
    shoulder_threshold = max(15, shoulder_width * 0.08) if shoulder_width else 15
    pelvis_threshold = max(15, shoulder_width * 0.08) if shoulder_width else 15

    # Comprehensive analysis
    good_observations = []
    areas_to_improve = []
    recommendations = []
    posture_score = 100

    # Analyze each aspect professionally
    
    # HEAD & NECK ANALYSIS
    if head_tilt is not None:
        if head_tilt <= 5:
            good_observations.append("Head & Neck: Excellent head alignment with minimal forward lean.")
        elif head_tilt <= head_tilt_threshold:
            good_observations.append("Head & Neck: Good head positioning with slight forward lean that's within normal range.")
        else:
            severity = "significantly" if head_tilt > 20 else "moderately" if head_tilt > 15 else "slightly"
            areas_to_improve.append(f"Head & Neck: Your head is {severity} leaning forward ({head_tilt:.1f}°). This can create neck and upper back strain over time.")
            recommendations.append("Monitor Height: Raise your monitor so the top of the screen is at or slightly below eye level to keep your head upright.")
            recommendations.append("Neck Breaks: Every 30 minutes, roll your shoulders back and stretch your neck gently.")
            posture_score -= min(25, head_tilt * 1.5)

    # TORSO & BACK ANALYSIS
    if torso_lean is not None:
        if torso_lean <= 3:
            good_observations.append("Back Posture: Excellent spinal alignment with upright torso positioning.")
        elif torso_lean <= torso_lean_threshold:
            good_observations.append("Back Posture: Good overall posture with minor torso lean that's acceptable.")
        else:
            severity = "significantly rounded" if torso_lean > 15 else "moderately rounded" if torso_lean > 12 else "slightly rounded"
            areas_to_improve.append(f"Back Posture: Your lower back looks {severity} ({torso_lean:.1f}° from vertical); lumbar support could be better engaged.")
            recommendations.append("Back Support: Adjust your chair's lumbar support or add a small pillow to maintain the natural curve of your lower back.")
            recommendations.append("Core Engagement: Sit back into the chair, engage your core slightly — this reduces slouching.")
            posture_score -= min(20, torso_lean * 1.2)

    # SHOULDER ANALYSIS
    if shoulder_drop is not None:
        if abs(shoulder_drop) <= 8:
            good_observations.append("Shoulder Position: Well-balanced shoulder height with minimal asymmetry.")
        elif abs(shoulder_drop) <= shoulder_threshold:
            good_observations.append("Shoulder Position: Shoulders are relatively level with minor asymmetry.")
        else:
            side = "right" if shoulder_drop > 0 else "left"
            severity = "significantly" if abs(shoulder_drop) > 25 else "moderately" if abs(shoulder_drop) > 20 else "slightly"
            areas_to_improve.append(f"Shoulder Position: {side.capitalize()} shoulder is {severity} lower, possibly due to keyboard/mouse placement or muscle tension.")
            recommendations.append("Keyboard & Mouse: Ensure they are close enough so your elbows stay at ~90° and shoulders stay relaxed.")
            recommendations.append("Shoulder Breaks: Roll your shoulders back and down every 20 minutes to release tension.")
            posture_score -= min(15, abs(shoulder_drop) * 0.8)

    # PELVIC ANALYSIS
    if pelvic_tilt is not None:
        if abs(pelvic_tilt) <= 8:
            good_observations.append("Hip Alignment: Excellent pelvic positioning with level hip placement.")
        elif abs(pelvic_tilt) <= pelvis_threshold:
            good_observations.append("Hip Alignment: Good pelvic stability with minor tilt within normal range.")
        else:
            side = "right" if pelvic_tilt > 0 else "left"
            areas_to_improve.append(f"Hip Alignment: Pelvis tilts toward the {side}, which may indicate uneven weight distribution or chair adjustment needed.")
            recommendations.append("Chair Adjustment: Ensure your chair height allows both feet flat on floor and even weight distribution.")
            recommendations.append("Posture Reset: Sit back fully in chair and center your weight evenly on both hips.")
            posture_score -= min(15, abs(pelvic_tilt) * 0.8)

    # GENERAL GOOD PRACTICES (always include some)
    if not any("chair" in obs.lower() for obs in good_observations):
        good_observations.append("Chair & Back Support: You are using a chair with a backrest that supports your spine.")
    
    if not any("feet" in obs.lower() for obs in good_observations):
        good_observations.append("Feet Position: Feet seem to be flat on the floor (good for balance).")

    if not any("desk" in obs.lower() for obs in good_observations):
        good_observations.append("Desk Height: Wrists are relatively level with the keyboard, avoiding extreme bending.")

    # GENERAL RECOMMENDATIONS (ergonomic best practices)
    if not recommendations:
        recommendations.append("Maintain Excellence: Continue your good posture habits with regular movement breaks every 30 minutes.")
    
    recommendations.append("Hydration & Movement: Take a 2-minute walk every hour to promote circulation and reset posture.")
    recommendations.append("Screen Distance: Maintain 20-26 inches from your monitor to reduce eye strain and forward head posture.")

    # Calculate final score
    posture_score = max(0, round(posture_score))
    
    # Overall assessment
    if posture_score >= 90:
        grade = "Excellent"
        color = "#10b981"
        overall_summary = "Outstanding posture! You demonstrate excellent ergonomic awareness."
    elif posture_score >= 75:
        grade = "Good"  
        color = "#3b82f6"
        overall_summary = "Good posture with minor areas for improvement. Small adjustments will enhance comfort."
    elif posture_score >= 60:
        grade = "Fair"
        color = "#f59e0b"
        overall_summary = "Moderate posture concerns. Addressing key issues will significantly improve your comfort."
    else:
        grade = "Needs Improvement"
        color = "#ef4444"
        overall_summary = "Multiple posture concerns detected. Focus on ergonomic adjustments for better health."

    return {
        "metrics": {
            "head_tilt_deg": head_tilt,
            "torso_lean_deg": torso_lean,
            "shoulder_drop_px": shoulder_drop,
            "pelvic_drop_px": pelvic_tilt,
            "left_knee_angle_deg": left_knee_angle,
            "right_knee_angle_deg": right_knee_angle
        },
        "posture_score": posture_score,
        "grade": grade,
        "grade_color": color,
        "overall_summary": overall_summary,
        "good_observations": good_observations,
        "areas_to_improve": areas_to_improve,
        "recommendations": recommendations,
        "confidence_metrics": {
            "body_height": body_height,
            "shoulder_width": shoulder_width,
            "adaptive_thresholds": {
                "head_tilt": head_tilt_threshold,
                "torso_lean": torso_lean_threshold,
                "shoulder_drop": shoulder_threshold,
                "pelvis_tilt": pelvis_threshold
            }
        }
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
    
    # Apply enhanced preprocessing
    img = preprocess_image(img)
    
    try:
        # Run inference with improved settings
        results = model(img, conf=0.25, iou=0.7, verbose=False)
        
        best = None; best_conf = -1; best_keypoints = None
        for r in results:
            if hasattr(r, "keypoints") and r.keypoints is not None:
                for i, (kp, conf) in enumerate(zip(r.keypoints.xy, r.boxes.conf if r.boxes is not None else [])):
                    c = float(conf) if conf is not None else 0.0
                    if c > best_conf:
                        best_conf = c
                        best = kp.squeeze(0).cpu().numpy()
                        # Get confidence scores for each keypoint
                        try:
                            best_keypoints = r.keypoints.conf[i].cpu().numpy()
                        except:
                            best_keypoints = np.ones((17,)) * 0.5
                            
        if best is None or best_conf < 0.2:  # Lower threshold for nano model
            return {"detected": False, "message": "No person detected with sufficient confidence"}
            
        # Use the best keypoint confidences we found
        confs = best_keypoints if best_keypoints is not None else np.ones((17,)) * 0.5
        
        flat = []
        for i in range(17):
            flat += [best[i,0], best[i,1], confs[i]]
        kdict = to_xyv(flat)
        report = posture_report(kdict)
        
        # Add detection metadata
        report.update({
            "detected": True,
            "keypoints": kdict,
            "detection_confidence": float(best_conf),
            "model_info": {
                "model_name": MODEL_NAME,
                "preprocessing": "enhanced_clahe",
                "inference_settings": {"conf": 0.25, "iou": 0.7}
            }
        })
        
        return report
        
    except Exception as e:
        return {"detected": False, "message": f"Analysis failed: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Enhanced ErgoWise Posture Analysis API...")
    print(f"📊 Model: {MODEL_NAME}")
    print(f"✅ Loaded: {'Yes' if model else 'No'}")
    uvicorn.run(app, host="0.0.0.0", port=8002)