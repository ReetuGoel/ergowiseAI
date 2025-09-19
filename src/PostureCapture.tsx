'use client';
import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-converter';
import * as posedetection from '@tensorflow-models/pose-detection';
import { movenet } from '@tensorflow-models/pose-detection';

/** Optional: set via environment variables, falls back to original backend */
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  'http://127.0.0.1:8002';  // Backend server

// Utility types
type KP = {x: number; y: number; score?: number};
type PoseKP = Record<string, KP | undefined>;

function v(a: KP, b: KP) {
  return {x: a.x - b.x, y: a.y - b.y};
}
function dot(a: {x:number;y:number}, b:{x:number;y:number}) { return a.x*b.x + a.y*b.y; }
function norm(a:{x:number;y:number}) { return Math.hypot(a.x, a.y); }
function angleAt(a: KP, b: KP, c: KP) { // angle ABC in degrees
  const ba = v(a,b), bc = v(c,b);
  const cos = dot(ba, bc) / (norm(ba)*norm(bc) || 1);
  return Math.acos(Math.min(1, Math.max(-1, cos))) * 180/Math.PI;
}
function degFromVertical(a: KP, b: KP) { // segment a->b vs vertical axis
  const seg = v(b,a); // vector pointing up from a to b
  const cos = (seg.y*-1) / (norm(seg) || 1);
  return Math.acos(Math.min(1, Math.max(-1, cos))) * 180/Math.PI;
}

function get(pose: posedetection.Pose): PoseKP {
  const m: PoseKP = {};
  const NAMES = ['nose','left_eye','right_eye','left_ear','right_ear','left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'];
  pose.keypoints.forEach((k: any, i: number) => {
    const name = k?.name || NAMES[i] || String(i);
    m[name] = { x: k.x, y: k.y, score: k.score ?? k.confidence ?? 1 };
  });
  return m;
}

function conf(k?: KP, th=0.5){ return !!k && (k.score ?? 1) >= th; }

function dist(a: KP, b: KP){ return Math.hypot(a.x-b.x, a.y-b.y); }

function bestSide(kp: PoseKP){
  const scoreSide = (side: 'left'|'right') => {
    const keys = [`${side}_ear`,`${side}_eye`,`${side}_shoulder`,`${side}_elbow`,`${side}_wrist`,`${side}_hip`];
    return keys.reduce((s,k)=> s + ((kp[k]?.score ?? 0)), 0);
  };
  const leftScore = scoreSide('left');
  const rightScore = scoreSide('right');
  return leftScore > rightScore ? 'left' : 'right';
}

function computeMetrics(kp: PoseKP){
  const side = bestSide(kp) as 'left' | 'right';
  const S = `${side}_shoulder`, H = `${side}_hip`, E = `${side}_elbow`, W = `${side}_wrist`;
  const EAR = `${side}_ear`, EYE = `${side}_eye`;

  const rs = kp[S], rh = kp[H], re = kp[E], rw = kp[W];
  const eye = kp[EYE], ear = kp[EAR];
  const scale = (conf(rs) && conf(rh)) ? dist(rs!, rh!) : 1; // shoulder-hip distance as scale

  const metrics: Record<string, number|null> = {
    neck_flexion_deg: null,
    torso_upright_deg: null,
    elbow_angle_deg: null,
    wrist_extension_deg: null,
  };

  if (conf(ear) && conf(rs)) {
    metrics.neck_flexion_deg = degFromVertical(ear!, rs!);
  } else if (conf(eye) && conf(rs)) {
    metrics.neck_flexion_deg = degFromVertical(eye!, rs!);
  }
  if (conf(rh) && conf(rs)) {
    const dev = degFromVertical(rh!, rs!); // 0 = vertical
    metrics.torso_upright_deg = 90 - Math.abs(dev); // 90 = perfect
  }
  if (conf(rs) && conf(re) && conf(rw)) {
    metrics.elbow_angle_deg = angleAt(rs!, re!, rw!);
    // forearm vs horizontal proxy at the elbow
    const forearm = v(rw!, re!);
    const horiz = {x:1,y:0};
    const cos = (forearm.x*horiz.x + forearm.y*horiz.y) / (norm(forearm) || 1);
    const forearm_to_horiz = Math.acos(Math.min(1, Math.max(-1, cos))) * 180/Math.PI;
    metrics.wrist_extension_deg = Math.max(0, forearm_to_horiz - 0); // lower is better
  }

  const visibility = [ear, eye, rs, rh, re, rw].filter(p=>conf(p)).length;
  const totalNeeded = 6;
  return {metrics, scale, side, visibility, totalNeeded};
}

function computeScore(m: Record<string, number|null>, visibility: number, totalNeeded: number){
  // gate: if not enough landmarks, don't claim a confident score
  if (visibility < Math.ceil(totalNeeded*0.6)) return {score: null, quality: 'insufficient_view'} as const;

  let score = 100;
  const clamp = (x:number,min:number,max:number)=> Math.max(min, Math.min(max, x));

  // Neck flexion (target <=10°)
  if (m.neck_flexion_deg != null){
    const a = m.neck_flexion_deg;
    const pen = a <= 10 ? 0 : a <= 20 ? (a-10)*1.0 : 10 + (a-20)*0.75; // max ~25
    score -= clamp(pen, 0, 25);
  }
  // Torso upright: our metric is closeness to vertical (90 best). Deviation = 90 - value
  if (m.torso_upright_deg != null){
    const dev = 90 - m.torso_upright_deg; // ~0 best
    const pen = dev <= 10 ? 0 : (dev-10)*1.2; // max ~25
    score -= clamp(pen, 0, 25);
  }
  // Elbow angle target 90–110
  if (m.elbow_angle_deg != null){
    const e = m.elbow_angle_deg;
    const dev = e < 90 ? 90 - e : e > 110 ? e - 110 : 0;
    const pen = dev * 0.8; // max ~20
    score -= clamp(pen, 0, 20);
  }
  // Wrist extension target <=15° (small weight)
  if (m.wrist_extension_deg != null){
    const w = m.wrist_extension_deg;
    const pen = w <= 15 ? 0 : (w-15)*0.5; // max ~10
    score -= clamp(pen, 0, 10);
  }

  return {score: Math.round(clamp(score, 0, 100)), quality: 'ok'} as const;
}

function generateProfessionalAnalysis(m: Record<string, number|null>) {
  const goodObservations: string[] = [];
  const areasToImprove: string[] = [];
  const recommendations: string[] = [];
  
  const { neck_flexion_deg, torso_upright_deg, elbow_angle_deg, wrist_extension_deg, shoulder_asymmetry, head_tilt_deg } = m;

  // Good observations
  if (head_tilt_deg != null && head_tilt_deg <= 8) {
    goodObservations.push("Head Position: Excellent cervical alignment with minimal forward head posture");
  }
  if (torso_upright_deg != null && torso_upright_deg >= 80) {
    goodObservations.push("Spinal Alignment: Good torso positioning with proper vertical alignment");
  }
  if (shoulder_asymmetry != null && shoulder_asymmetry <= 10) {
    goodObservations.push("Shoulder Balance: Well-balanced shoulder height indicating good upper body symmetry");
  }
  if (elbow_angle_deg != null && elbow_angle_deg >= 85 && elbow_angle_deg <= 105) {
    goodObservations.push("Arm Position: Optimal elbow angle for ergonomic workspace setup");
  }

  // Areas to improve
  if (head_tilt_deg != null && head_tilt_deg > 8) {
    const severity = head_tilt_deg > 15 ? "significantly" : head_tilt_deg > 12 ? "moderately" : "slightly";
    areasToImprove.push(`Head & Neck: Your head is ${severity} tilted forward (${head_tilt_deg.toFixed(1)}°), which can strain cervical vertebrae`);
  }
  if (neck_flexion_deg != null && neck_flexion_deg > 15) {
    const severity = neck_flexion_deg > 25 ? "significantly" : neck_flexion_deg > 20 ? "moderately" : "slightly";
    areasToImprove.push(`Neck Flexion: ${severity} forward neck positioning (${neck_flexion_deg.toFixed(1)}°) indicating tech neck syndrome`);
  }
  if (torso_upright_deg != null && torso_upright_deg < 75) {
    areasToImprove.push(`Torso Position: Your upper body is leaning forward, affecting spinal curves (${(90-torso_upright_deg).toFixed(1)}° deviation)`);
  }
  if (shoulder_asymmetry != null && shoulder_asymmetry > 15) {
    areasToImprove.push(`Shoulder Asymmetry: Uneven shoulder height detected, indicating muscle imbalance`);
  }
  if (elbow_angle_deg != null && (elbow_angle_deg < 80 || elbow_angle_deg > 120)) {
    areasToImprove.push(`Arm Position: Elbow angle (${elbow_angle_deg.toFixed(1)}°) outside optimal ergonomic range`);
  }

  // Recommendations
  if (head_tilt_deg != null && head_tilt_deg > 8) {
    recommendations.push("Monitor Height: Raise your monitor so the top of the screen is at or slightly below eye level");
    recommendations.push("Chin Tucks: Perform gentle chin tuck exercises (hold 5 seconds, repeat 10 times) hourly");
  }
  if (neck_flexion_deg != null && neck_flexion_deg > 15) {
    recommendations.push("Neck Support: Use a document holder to avoid looking down at papers");
    recommendations.push("Stretching: Perform upper trap stretches and neck rotations every 30 minutes");
  }
  if (torso_upright_deg != null && torso_upright_deg < 75) {
    recommendations.push("Chair Adjustment: Ensure your backrest supports your natural lumbar curve");
    recommendations.push("Core Strengthening: Practice drawing your belly button gently toward your spine");
  }
  if (shoulder_asymmetry != null && shoulder_asymmetry > 15) {
    recommendations.push("Workspace Setup: Adjust your desk height and armrests to support balanced shoulders");
    recommendations.push("Shoulder Exercises: Perform backward shoulder rolls (10 reps) every 30 minutes");
  }
  if (elbow_angle_deg != null && (elbow_angle_deg < 80 || elbow_angle_deg > 120)) {
    recommendations.push("Keyboard Position: Adjust chair and desk height for 90° elbow angle");
    recommendations.push("Arm Support: Use adjustable armrests to maintain relaxed shoulder position");
  }

  // Ensure at least one item in each category
  if (goodObservations.length === 0) {
    goodObservations.push("Posture Awareness: You're taking proactive steps to monitor and improve your ergonomic health");
  }
  if (areasToImprove.length === 0) {
    areasToImprove.push("Minor Adjustments: Small refinements to your setup could optimize comfort and prevent fatigue");
  }
  if (recommendations.length === 0) {
    recommendations.push("Maintenance: Continue regular posture checks and take movement breaks every 30-45 minutes");
  }

  // Calculate posture score
  let score = 100;
  if (head_tilt_deg != null && head_tilt_deg > 8) score -= Math.min(20, head_tilt_deg * 1.2);
  if (neck_flexion_deg != null && neck_flexion_deg > 15) score -= Math.min(15, (neck_flexion_deg - 15) * 0.8);
  if (torso_upright_deg != null && torso_upright_deg < 80) score -= Math.min(20, (80 - torso_upright_deg) * 1.5);
  if (shoulder_asymmetry != null && shoulder_asymmetry > 15) score -= Math.min(15, (shoulder_asymmetry - 15) * 0.5);
  if (elbow_angle_deg != null && (elbow_angle_deg < 80 || elbow_angle_deg > 120)) {
    const deviation = elbow_angle_deg < 80 ? (80 - elbow_angle_deg) : (elbow_angle_deg - 120);
    score -= Math.min(10, deviation * 0.3);
  }

  score = Math.max(0, Math.round(score));

  const grade = score >= 90 ? "Excellent" : score >= 75 ? "Good" : score >= 60 ? "Fair" : "Needs Improvement";
  const gradeColor = score >= 90 ? "#10b981" : score >= 75 ? "#3b82f6" : score >= 60 ? "#f59e0b" : "#ef4444";

  return {
    professional_analysis: {
      good_observations: goodObservations,
      areas_to_improve: areasToImprove,
      recommendations: recommendations
    },
    posture_score: score,
    grade,
    grade_color: gradeColor
  };
}

function recommend(m: Record<string, number|null>){
  const recs: string[] = [];
  const { neck_flexion_deg:nf, torso_upright_deg:tu, elbow_angle_deg:ea, wrist_extension_deg:we } = m;
  if (nf != null) {
    if (nf > 20) recs.push('Raise monitor 5–8 cm and do chin-tuck stretches. Keep ears stacked above shoulders.');
    else if (nf > 10) recs.push('Lift monitor slightly and sit tall with neutral neck.');
  }
  if (tu != null && tu < 80) recs.push('Increase lumbar support and sit back fully against the backrest.');
  if (ea != null && (ea < 90 || ea > 110)) recs.push('Adjust chair/desk so elbows stay ~90–100°. Bring keyboard closer.');
  if (we != null && we > 15) recs.push('Lower keyboard or add wrist rest to keep wrists neutral.');
  if (!recs.length) recs.push('Nice posture! Keep taking micro‑breaks every 30–45 minutes.');
  return recs.slice(0,3);
}

const PostureCapture: React.FC = () => {
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, number|null> | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [recs, setRecs] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0];
    if (!file) return;
    setImageURL(URL.createObjectURL(file));
    await analyzeLocally(file);
  }

  async function analyzeLocally(file: File){
    setLoading(true);
    try {
      await tf.setBackend('webgl');
      await tf.ready();

      const detector = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet,
        {modelType: movenet.modelType.SINGLEPOSE_LIGHTNING}
      );

      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      await new Promise<void>((res) => { img.onload = () => res(); });

      const poses = await detector.estimatePoses(img);
      if (!poses.length){ 
        setLoading(false); 
        setAnalysis({ detected: false, message: "No person detected in image" });
        return; 
      }

      const kp = get(poses[0]);
      drawPose(img, kp);

      const {metrics: m, visibility, totalNeeded} = computeMetrics(kp);
      const scoreResult = computeScore(m, visibility, totalNeeded);
      const professionalAnalysis = generateProfessionalAnalysis(m);
      
      // Use the better scoring system if available, otherwise fall back to professional analysis scoring
      const finalScore = scoreResult.score !== null ? scoreResult.score : professionalAnalysis.posture_score;
      const finalGrade = scoreResult.score !== null ? 
        (scoreResult.score >= 85 ? 'Excellent' :
         scoreResult.score >= 75 ? 'Good' :
         scoreResult.score >= 65 ? 'Fair' : 'Needs Improvement') :
        professionalAnalysis.grade;
      const finalGradeColor = scoreResult.score !== null ?
        (scoreResult.score >= 85 ? '#059669' :
         scoreResult.score >= 75 ? '#3b82f6' :
         scoreResult.score >= 65 ? '#f59e0b' : '#dc2626') :
        professionalAnalysis.grade_color;
      
      setMetrics(m);
      setRecs(recommend(m));
      setAnalysis({
        detected: true,
        message: scoreResult.quality === 'insufficient_view' ? 
          "Analysis completed - Limited visibility detected. For best results, ensure full side profile is visible." :
          "Analysis completed using advanced AI pose detection with comprehensive ergonomic assessment",
        metrics: m,
        posture_score: finalScore,
        grade: finalGrade,
        grade_color: finalGradeColor,
        quality: scoreResult.quality,
        visibility_info: `${visibility}/${totalNeeded} key points detected`,
        professional_analysis: professionalAnalysis.professional_analysis
      });
    } catch (error) {
      console.error('Local analysis failed:', error);
      setAnalysis({ detected: false, message: `Local analysis failed: ${error}` });
    }
    setLoading(false);
  }

  function drawPose(img: HTMLImageElement, kp: PoseKP){
    const cvs = canvasRef.current;
    if (!cvs) return;
    cvs.width = img.width; 
    cvs.height = img.height;
    const ctx = cvs.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    ctx.lineWidth = 3; 
    ctx.strokeStyle = '#00bcd4'; 
    ctx.fillStyle = '#00bcd4';
    
    const pairs: Array<[string,string]> = [
      ['right_shoulder','right_elbow'], ['right_elbow','right_wrist'],
      ['left_shoulder','left_elbow'], ['left_elbow','left_wrist'],
      ['right_shoulder','right_hip'], ['left_shoulder','left_hip'],
      ['right_hip','right_knee'], ['right_knee','right_ankle'],
      ['left_hip','left_knee'], ['left_knee','left_ankle'],
      ['right_shoulder','left_shoulder'], ['right_hip','left_hip'],
      ['nose','right_eye'], ['nose','left_eye'],
      ['right_eye','right_ear'], ['left_eye','left_ear']
    ];
    
    pairs.forEach(([a,b])=>{
      const A = kp[a], B = kp[b];
      if (conf(A) && conf(B)){
        ctx.beginPath(); 
        ctx.moveTo(A!.x, A!.y); 
        ctx.lineTo(B!.x, B!.y); 
        ctx.stroke();
      }
    });
    
    Object.values(kp).forEach(p=>{
      if (conf(p)) { 
        ctx.beginPath(); 
        ctx.arc(p!.x, p!.y, 4, 0, 2*Math.PI); 
        ctx.fill(); 
      }
    });
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          marginBottom: '8px',
          color: '#1f2937'
        }}>
          ErgoWise Posture Analysis
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          Upload a photo to get professional ergonomic assessment and recommendations
        </p>

        <input 
          type="file" 
          accept="image/*" 
          onChange={onFile}
          style={{
            padding: '12px',
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            width: '100%',
            cursor: 'pointer'
          }}
        />
      </div>

      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#6b7280'
        }}>
          <p>Analyzing posture...</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', alignItems: 'start' }}>
        {imageURL && (
          <div style={{ 
            position: 'sticky',
            top: '20px',
            maxWidth: '350px' 
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <canvas 
                ref={canvasRef} 
                style={{ 
                  width: '100%', 
                  maxWidth: '318px',
                  height: 'auto',
                  borderRadius: '12px',
                  display: 'block'
                }} 
              />
              
              {/* Image info overlay */}
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                color: '#64748b',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                  📸 AI Analysis
                </div>
                <div>
                  🔄 Real-time Processing
                </div>
              </div>
            </div>
          </div>
        )}

        {analysis && (
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '16px', 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            {analysis.detected ? (
              <>
                {/* Header Section with Score */}
                {analysis.posture_score !== undefined && (
                  <div style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '24px',
                    textAlign: 'center',
                    color: 'white'
                  }}>
                    <div style={{ 
                      fontSize: '48px', 
                      fontWeight: '700', 
                      marginBottom: '8px',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      {analysis.posture_score}/100
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '600',
                      opacity: 0.9
                    }}>
                      {analysis.grade || 'Assessment Complete'}
                    </div>
                  </div>
                )}

                {/* Main Content Area */}
                <div style={{ padding: '24px' }}>
                  {analysis.professional_analysis && (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          marginBottom: '12px',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          ✅ Good Observations
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {analysis.professional_analysis.good_observations.map((obs: string, i: number) => (
                            <li key={i} style={{ 
                              padding: '12px 16px', 
                              marginBottom: '8px',
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '8px',
                              lineHeight: '1.6',
                              fontSize: '14px'
                            }}>
                              {obs}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          marginBottom: '12px',
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          ⚠️ Areas to Improve
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {analysis.professional_analysis.areas_to_improve.map((area: string, i: number) => (
                            <li key={i} style={{ 
                              padding: '12px 16px', 
                              marginBottom: '8px',
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              lineHeight: '1.6',
                              fontSize: '14px'
                            }}>
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          marginBottom: '12px',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          💡 Recommendations
                        </h3>
                        <div style={{ 
                          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                          border: '1px solid #93c5fd',
                          borderRadius: '12px',
                          padding: '20px'
                        }}>
                          {analysis.professional_analysis.recommendations.map((rec: string, i: number) => (
                            <div key={i} style={{ 
                              padding: '16px 20px', 
                              marginBottom: i === analysis.professional_analysis.recommendations.length - 1 ? '0' : '12px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e0e7ff',
                              borderRadius: '8px',
                              lineHeight: '1.7',
                              fontSize: '15px',
                              fontWeight: '500',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                            }}>
                              <span style={{ color: '#1e40af', fontWeight: '600', marginRight: '8px' }}>
                                {i + 1}.
                              </span>
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer Section with Metrics and Tips */}
                  <div style={{
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '20px',
                    backgroundColor: '#f8fafc',
                    margin: '0 -24px -24px -24px',
                    padding: '20px 24px'
                  }}>
                    {metrics && (
                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                          📊 Technical Metrics
                        </h3>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                          gap: '8px'
                        }}>
                          {Object.entries(metrics).map(([k,v]) => (
                            <div key={k} style={{ 
                              padding: '8px 12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
                                {k.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                                {v == null ? 'N/A' : v.toFixed(1) + '°'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {recs.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                          ⚡ Quick Tips
                        </h3>
                        <div style={{ 
                          backgroundColor: '#ffffff',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#6b7280', margin: 0 }}>
                            {recs.map((r, i) => (
                              <li key={i} style={{ marginBottom: '6px', lineHeight: '1.5', fontSize: '13px' }}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <p style={{ 
                      fontSize: '12px', 
                      color: '#9ca3af', 
                      marginTop: '16px',
                      fontStyle: 'italic',
                      textAlign: 'center',
                      margin: '16px 0 0 0'
                    }}>
                      {analysis.message}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 40px',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
                <p style={{ color: '#dc2626', fontSize: '16px', fontWeight: '500' }}>
                  {analysis.message || 'Analysis failed'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostureCapture;
