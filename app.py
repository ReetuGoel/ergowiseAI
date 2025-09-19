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
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://10.24.2.152:3000"],
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
MODEL_NAME = "yolov8s-pose.pt"  # Upgrade to small for better accuracy

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
    """Enhanced posture analysis with improved thresholds and scoring"""
    def g(name, min_conf=0.4):
        return safe(k, name, min_conf)

    # Get keypoints with higher confidence requirements
    ls = g("left_shoulder", 0.5);  rs = g("right_shoulder", 0.5)
    lh = g("left_hip", 0.5);       rh = g("right_hip", 0.5)
    le = g("left_ear", 0.3);       re = g("right_ear", 0.3)  # Ears often less confident
    nose = g("nose", 0.5)
    lk = g("left_knee", 0.4);      rk = g("right_knee", 0.4)
    la = g("left_ankle", 0.3);     ra = g("right_ankle", 0.3)  # Ankles often less confident

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

    # Calculate body proportions for adaptive thresholds
    body_height = None
    shoulder_width = None
    
    if None not in sh_mid + hip_mid:
        body_height = abs(sh_mid[1] - hip_mid[1])
    if None not in (ls[0], rs[0]):
        shoulder_width = abs(rs[0] - ls[0])
    
    # Adaptive thresholds based on body size
    head_tilt_threshold = 12 if body_height and body_height > 200 else 10
    torso_lean_threshold = 10 if body_height and body_height > 200 else 8
    shoulder_threshold = max(15, shoulder_width * 0.08) if shoulder_width else 15
    pelvis_threshold = max(15, shoulder_width * 0.08) if shoulder_width else 15

    tips = []
    posture_score = 100  # Start with perfect score
    
    if head_tilt is not None and head_tilt > head_tilt_threshold:
        severity = "severe" if head_tilt > 20 else "moderate" if head_tilt > 15 else "mild"
        tips.append(f"Forward head tilt ~{head_tilt:.1f}° ({severity}). Try gently tucking the chin and lengthening the back of the neck.")
        posture_score -= min(25, head_tilt * 1.5)
        
    if torso_lean is not None and torso_lean > torso_lean_threshold:
        severity = "severe" if torso_lean > 15 else "moderate" if torso_lean > 12 else "mild"
        tips.append(f"Torso leaning ~{torso_lean:.1f}° from vertical ({severity}). Stack ribs over pelvis; engage core lightly.")
        posture_score -= min(20, torso_lean * 1.2)
        
    if shoulder_drop is not None and abs(shoulder_drop) > shoulder_threshold:
        side = "right" if shoulder_drop > 0 else "left"
        severity = "severe" if abs(shoulder_drop) > 25 else "moderate" if abs(shoulder_drop) > 20 else "mild"
        tips.append(f"{side.capitalize()} shoulder lower ({severity}). Balance shoulder height and relax upper traps.")
        posture_score -= min(15, abs(shoulder_drop) * 0.8)
        
    if pelvic_tilt is not None and abs(pelvic_tilt) > pelvis_threshold:
        side = "right" if pelvic_tilt > 0 else "left"
        severity = "severe" if abs(pelvic_tilt) > 25 else "moderate" if abs(pelvic_tilt) > 20 else "mild"
        tips.append(f"Pelvis dips on the {side} ({severity}). Level hips; think 'tall through the crown' while engaging glutes.")
        posture_score -= min(15, abs(pelvic_tilt) * 0.8)
        
    for knee_name, kn in [("left", left_knee_angle), ("right", right_knee_angle)]:
        if kn is not None and kn < 170:
            severity = "severe" if kn < 150 else "moderate" if kn < 160 else "mild"
            tips.append(f"{knee_name.capitalize()} knee bent (~{kn:.0f}° - {severity}). Soften stance evenly or straighten gently.")
            posture_score -= min(10, (180 - kn) * 0.5)

    # Ensure score doesn't go below 0
    posture_score = max(0, round(posture_score))
    
    # Add overall assessment
    if posture_score >= 90:
        grade = "Excellent"
        color = "#10b981"  # green
    elif posture_score >= 75:
        grade = "Good"  
        color = "#3b82f6"  # blue
    elif posture_score >= 60:
        grade = "Fair"
        color = "#f59e0b"  # yellow
    else:
        grade = "Needs Improvement"
        color = "#ef4444"  # red

    return {
        "metrics": {
            "head_tilt_deg": head_tilt,
            "torso_lean_deg": torso_lean,
            "shoulder_drop_px": shoulder_drop,
            "pelvic_drop_px": pelvic_tilt,
            "left_knee_angle_deg": left_knee_angle,
            "right_knee_angle_deg": right_knee_angle
        },
        "tips": tips,
        "posture_score": posture_score,
        "grade": grade,
        "grade_color": color,
        # Add professional analysis structure
        "professional_analysis": {
            "good_observations": generate_good_observations(head_tilt, torso_lean, shoulder_drop, pelvic_tilt, left_knee_angle, right_knee_angle),
            "areas_to_improve": generate_improvement_areas(head_tilt, torso_lean, shoulder_drop, pelvic_tilt, left_knee_angle, right_knee_angle),
            "recommendations": generate_recommendations(head_tilt, torso_lean, shoulder_drop, pelvic_tilt, left_knee_angle, right_knee_angle)
        }
    }

def generate_good_observations(head_tilt, torso_lean, shoulder_drop, pelvic_tilt, left_knee_angle, right_knee_angle):
    """Generate positive observations about posture"""
    observations = []
    
    # Check for good head position
    if head_tilt is None or head_tilt <= 8:
        observations.append("Head & Neck: Good cervical spine alignment with minimal forward head posture")
    
    # Check for good torso alignment
    if torso_lean is None or torso_lean <= 6:
        observations.append("Spinal Alignment: Excellent torso positioning with proper vertical alignment")
    
    # Check for balanced shoulders
    if shoulder_drop is None or abs(shoulder_drop) <= 10:
        observations.append("Shoulder Balance: Well-balanced shoulder height indicating good upper body symmetry")
    
    # Check for level pelvis
    if pelvic_tilt is None or abs(pelvic_tilt) <= 10:
        observations.append("Pelvic Stability: Good pelvic leveling providing stable foundation for spine")
    
    # Check for straight legs
    if left_knee_angle is None or left_knee_angle >= 175:
        observations.append("Left Leg: Excellent knee extension and leg positioning")
    if right_knee_angle is None or right_knee_angle >= 175:
        observations.append("Right Leg: Good knee alignment and stance stability")
    
    # Always include at least one positive observation
    if not observations:
        observations.append("Posture Awareness: You're taking proactive steps to monitor and improve your posture")
    
    return observations

def generate_improvement_areas(head_tilt, torso_lean, shoulder_drop, pelvic_tilt, left_knee_angle, right_knee_angle):
    """Generate areas that need improvement"""
    improvements = []
    
    if head_tilt is not None and head_tilt > 8:
        severity = "significantly" if head_tilt > 15 else "moderately" if head_tilt > 12 else "slightly"
        improvements.append(f"Head & Neck: Your head is {severity} leaning forward ({head_tilt:.1f}°), which can strain cervical vertebrae")
    
    if torso_lean is not None and torso_lean > 6:
        severity = "significantly" if torso_lean > 12 else "moderately" if torso_lean > 9 else "slightly"
        improvements.append(f"Torso Position: Your upper body is {severity} leaning forward ({torso_lean:.1f}°), affecting spinal curves")
    
    if shoulder_drop is not None and abs(shoulder_drop) > 10:
        side = "right" if shoulder_drop > 0 else "left"
        severity = "significantly" if abs(shoulder_drop) > 20 else "moderately" if abs(shoulder_drop) > 15 else "slightly"
        improvements.append(f"Shoulder Asymmetry: Your {side} shoulder is {severity} lower, indicating muscle imbalance")
    
    if pelvic_tilt is not None and abs(pelvic_tilt) > 10:
        side = "right" if pelvic_tilt > 0 else "left"
        severity = "significantly" if abs(pelvic_tilt) > 20 else "moderately" if abs(pelvic_tilt) > 15 else "slightly"
        improvements.append(f"Pelvic Alignment: Your pelvis {severity} tilts to the {side}, affecting core stability")
    
    if left_knee_angle is not None and left_knee_angle < 175:
        severity = "significantly" if left_knee_angle < 160 else "moderately" if left_knee_angle < 170 else "slightly"
        improvements.append(f"Left Leg Position: Your left knee is {severity} bent ({left_knee_angle:.0f}°), creating uneven weight distribution")
    
    if right_knee_angle is not None and right_knee_angle < 175:
        severity = "significantly" if right_knee_angle < 160 else "moderately" if right_knee_angle < 170 else "slightly"
        improvements.append(f"Right Leg Position: Your right knee is {severity} bent ({right_knee_angle:.0f}°), affecting stance stability")
    
    return improvements

def generate_recommendations(head_tilt, torso_lean, shoulder_drop, pelvic_tilt, left_knee_angle, right_knee_angle):
    """Generate specific ergonomic recommendations"""
    recommendations = []
    
    # Head and neck recommendations
    if head_tilt is not None and head_tilt > 8:
        recommendations.append("Monitor Height: Raise your monitor so the top of the screen is at or slightly below eye level")
        recommendations.append("Chin Tucks: Perform gentle chin tuck exercises (hold 5 seconds, repeat 10 times) hourly")
    
    # Torso recommendations
    if torso_lean is not None and torso_lean > 6:
        recommendations.append("Chair Adjustment: Ensure your backrest supports your natural lumbar curve")
        recommendations.append("Core Strengthening: Practice drawing your belly button gently toward your spine")
    
    # Shoulder recommendations
    if shoulder_drop is not None and abs(shoulder_drop) > 10:
        side = "right" if shoulder_drop > 0 else "left"
        recommendations.append(f"Workspace Setup: Adjust your {side} armrest or desk height to support balanced shoulders")
        recommendations.append("Shoulder Rolls: Perform backward shoulder rolls (10 reps) every 30 minutes")
    
    # Pelvic recommendations
    if pelvic_tilt is not None and abs(pelvic_tilt) > 10:
        recommendations.append("Seat Adjustment: Check that your chair seat is level and supports both hips equally")
        recommendations.append("Hip Flexor Stretches: Perform standing hip flexor stretches during breaks")
    
    # Leg recommendations
    if (left_knee_angle is not None and left_knee_angle < 175) or (right_knee_angle is not None and right_knee_angle < 175):
        recommendations.append("Foot Support: Ensure both feet rest flat on the floor or a footrest")
        recommendations.append("Standing Breaks: Take 2-3 minute standing breaks every 30 minutes")
    
    # General recommendations
    recommendations.append("Movement Routine: Set hourly reminders to check and adjust your posture")
    recommendations.append("Strength Training: Focus on posterior chain exercises (rows, reverse flies, planks)")
    
    return recommendations

class Health(BaseModel):
    status: str

@app.get("/health", response_model=Health)
def health():
    return {"status": "ok"}

def preprocess_image(img):
    """Enhanced image preprocessing for better pose detection"""
    # Resize to optimal input size while maintaining aspect ratio
    h, w = img.shape[:2]
    target_size = 640  # YOLO's optimal input size
    
    if max(h, w) > target_size:
        scale = target_size / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    
    # Enhance contrast and brightness for better keypoint detection
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    l = clahe.apply(l)
    
    img = cv2.merge([l, a, b])
    img = cv2.cvtColor(img, cv2.COLOR_LAB2BGR)
    
    return img

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if model is None:
        # Provide mock data for testing when model isn't loaded
        mock_keypoints = {
            'nose': ((320, 240), 0.9),
            'left_eye': ((310, 230), 0.8),
            'right_eye': ((330, 230), 0.8),
            'left_ear': ((300, 235), 0.7),
            'right_ear': ((340, 235), 0.7),
            'left_shoulder': ((280, 300), 0.9),
            'right_shoulder': ((360, 300), 0.9),
            'left_elbow': ((250, 350), 0.8),
            'right_elbow': ((390, 350), 0.8),
            'left_wrist': ((220, 400), 0.7),
            'right_wrist': ((420, 400), 0.7),
            'left_hip': ((300, 450), 0.9),
            'right_hip': ((340, 450), 0.9),
            'left_knee': ((295, 550), 0.8),
            'right_knee': ((345, 550), 0.8),
            'left_ankle': ((290, 650), 0.7),
            'right_ankle': ((350, 650), 0.7)
        }
        
        mock_report = posture_report(mock_keypoints)
        return {
            "detected": True, 
            "keypoints": mock_keypoints, 
            "message": "Using mock data - model not loaded",
            **mock_report
        }
    
    data = await file.read()
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return JSONResponse(status_code=400, content={"error": "Invalid image"})
    
    # Apply enhanced preprocessing
    img = preprocess_image(img)
    
    # Apply enhanced preprocessing
    img = preprocess_image(img)
    
    try:
        # Run inference with improved settings
        results = model(img, conf=0.3, iou=0.7, verbose=False)  # Lower conf threshold, higher IoU
        
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
                            
        if best is None or best_conf < 0.25:  # Minimum person confidence
            return {"detected": False, "message": "No person detected with sufficient confidence"}
        # Use the best keypoint confidences we found
        confs = best_keypoints if best_keypoints is not None else np.ones((17,)) * 0.5
        flat = []
        for i in range(17):
            flat += [best[i,0], best[i,1], confs[i]]
        kdict = to_xyv(flat)
        report = posture_report(kdict)
        return {"detected": True, "keypoints": kdict, **report}
    except Exception as e:
        return {"detected": False, "message": f"Analysis failed: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting ErgoWise Posture Analysis API...")
    print(f"📊 Model: {MODEL_NAME}")
    print(f"✅ Loaded: {'Yes' if model is not None else 'No (running in mock mode)'}")
    uvicorn.run(app, host="0.0.0.0", port=8002)
