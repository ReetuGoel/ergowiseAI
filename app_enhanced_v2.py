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

app = FastAPI(title="Enhanced Posture API v2")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://10.24.2.152:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use nano model (works reliably) with enhanced processing
MODEL_NAME = "yolov8n-pose.pt"

# Load model with enhanced preprocessing
try:
    model = YOLO(MODEL_NAME)
    print(f"✅ Successfully loaded {MODEL_NAME} model")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

COCO_KPTS = [
    "nose","left_eye","right_eye","left_ear","right_ear",
    "left_shoulder","right_shoulder","left_elbow","right_elbow",
    "left_wrist","right_wrist","left_hip","right_hip",
    "left_knee","right_knee","left_ankle","right_ankle"
]

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

# Add a new endpoint for model information
@app.get("/model-info")
def model_info():
    return {
        "model_name": MODEL_NAME,
        "model_loaded": model is not None,
        "features": [
            "Enhanced image preprocessing with CLAHE",
            "Adaptive thresholds based on body proportions", 
            "Posture scoring (0-100)",
            "Severity classification (mild/moderate/severe)",
            "Confidence-based keypoint filtering",
            "Improved detection parameters"
        ],
        "improvements": {
            "accuracy": "Enhanced preprocessing for better detection",
            "preprocessing": "CLAHE enhancement for better contrast",
            "scoring": "Comprehensive 0-100 posture score",
            "thresholds": "Adaptive based on individual body size",
            "confidence": "Higher minimum confidence requirements"
        }
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Enhanced ErgoWise Posture Analysis API v2...")
    print(f"📊 Model: {MODEL_NAME}")
    print(f"✅ Loaded: {'Yes' if model else 'No'}")
    uvicorn.run(app, host="0.0.0.0", port=8001)