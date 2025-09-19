import React, { useEffect, useMemo, useState } from 'react';

/** Optional: set via environment variables, falls back to local FastAPI */
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  'http://127.0.0.1:8000';

/** Pretty formatter for backend tip strings -> JSX */
const TipItem: React.FC<{ tip: string }> = ({ tip }) => {
  const patterns: Array<{
    test: RegExp;
    title: (m: RegExpMatchArray) => string;
    highlight?: (m: RegExpMatchArray) => string | null;
  }> = [
    {
      test: /forward head tilt\s*~?([\d.]+)°/i,
      title: () => `Forward head tilt`,
      highlight: (m) => `${m[1]}°`,
    },
    {
      test: /torso (?:leaning|lean)\s*~?([\d.]+)°/i,
      title: () => `Torso lean`,
      highlight: (m) => `${m[1]}°`,
    },
    {
      test: /(left|right)\s+shoulder\s+lower/i,
      title: () => `Shoulder asymmetry`,
    },
    {
      test: /pelvis\s+dips\s+on\s+the\s+(left|right)/i,
      title: () => `Pelvic tilt`,
    },
    {
      test: /(left|right)\s+knee\s+bent\s*\(~?([\d.]+)°\)/i,
      title: (m) => `${m[1][0].toUpperCase()}${m[1].slice(1)} knee flexion`,
      highlight: (m) => `${m[2]}°`,
    },
  ];

  const rule = patterns.find((p) => tip.match(p.test));
  if (!rule) {
    return <li style={{ marginBottom: 8, lineHeight: 1.5 }}>{tip}</li>;
  }
  const m = tip.match(rule.test)!;
  const headline = rule.title(m);
  const badge = rule.highlight ? rule.highlight(m) : null;

  return (
    <li style={{ marginBottom: 10, lineHeight: 1.6, listStyle: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span
          style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: 9999,
            background: 'var(--color-primary)',
          }}
        />
        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{headline}</span>
        {badge && (
          <span
            style={{
              marginLeft: 8,
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: 9999,
              background: 'var(--color-surface-alt2)',
              color: 'var(--color-text-soft)',
              border: '1px solid var(--color-surface-alt2)',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div style={{ color: 'var(--color-text-soft)', marginLeft: 18 }}>{tip}</div>
    </li>
  );
};

const PostureCapture: React.FC = () => {
  // Handle file upload
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const firstFilePreview = useMemo(() => {
    if (selectedFiles.length === 0) return null;
    return URL.createObjectURL(selectedFiles[0]);
  }, [selectedFiles]);

  useEffect(() => {
    if (firstFilePreview) setPreview(firstFilePreview);
    return () => {
      if (firstFilePreview) URL.revokeObjectURL(firstFilePreview);
    };
  }, [firstFilePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let files = Array.from(e.target.files || []);
    if (files.length > 5) {
      files = files.slice(0, 5);
      setUploadMessage('You can upload a maximum of 5 photos at once.');
    } else {
      setUploadMessage(`${files.length} photo${files.length > 1 ? 's' : ''} selected successfully!`);
    }
    setSelectedFiles(files);
    setPreview(null);
    setAnalysisResult(null);
    setError(null);
    setTimeout(() => setUploadMessage(null), 3000);
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFiles[0]); // Analyze first file

      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setAnalysisResult(result);
      
      if (response.ok && result.detected) {
        setUploadMessage('Analysis complete! Check results below.');
      } else if (response.ok && !result.detected) {
        setUploadMessage('No person detected in the image. Please try another photo.');
      } else {
        setError(result?.message || 'Analysis failed. Make sure the backend server is running.');
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Analysis failed. Make sure the backend server is running and CORS is enabled.');
    }

    setIsAnalyzing(false);
    setTimeout(() => setUploadMessage(null), 5000);
  };

  // Return the redesigned vertical layout
  return (
    <div
      style={{
        padding: 32,
        borderRadius: 28,
        background: 'var(--color-surface)',
        boxShadow: '0 8px 32px rgba(33,150,243,0.10)',
        maxWidth: 520,
        margin: '40px auto',
        border: '1px solid var(--color-surface-alt2)',
      }}
    >
      {/* Upload Section */}
      <div
        style={{
          background: 'var(--color-surface-alt)',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 2px 8px rgba(33,150,243,0.08)',
          border: '1px solid var(--color-primary)',
          marginBottom: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          id="file-upload"
          onChange={handleFileChange}
        />
        <button
          type="button"
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            padding: '14px 36px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 18,
            boxShadow: '0 2px 8px rgba(33,150,243,0.08)',
          }}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          Upload Photo(s)
        </button>

        {selectedFiles.length > 0 && (
          <button
            type="button"
            style={{
              background: isAnalyzing ? 'var(--color-surface-alt2)' : 'var(--color-secondary)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '14px 36px',
              fontWeight: 600,
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              fontSize: 18,
              boxShadow: '0 2px 8px rgba(33,150,243,0.08)',
              opacity: isAnalyzing ? 0.6 : 1,
            }}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Posture'}
          </button>
        )}

        {/* Preview of first file */}
        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{
              width: '100%',
              maxWidth: 420,
              borderRadius: 12,
              marginTop: 8,
              border: '1px solid var(--color-surface-alt2)',
            }}
          />
        )}
      </div>

      {uploadMessage && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: 'var(--color-info-bg)',
            color: 'var(--color-info)',
            border: '1px solid var(--color-info)',
            marginBottom: 24,
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          {uploadMessage}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: 'var(--color-danger-bg)',
            color: 'var(--color-danger)',
            border: '1px solid var(--color-danger)',
            marginBottom: 24,
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      {analysisResult && analysisResult.detected && (
        <div
          style={{
            background: 'var(--color-surface-alt)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid var(--color-primary)',
            marginTop: 24,
          }}
        >
          <h3 style={{ color: 'var(--color-primary)', marginBottom: 16, fontSize: 20, fontWeight: 600 }}>
            Posture Analysis Results
          </h3>

          <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
            {selectedFiles[0]?.name}
          </div>

          {analysisResult.tips && analysisResult.tips.length > 0 ? (
            <div>
              <h4 style={{ color: 'var(--color-text)', marginBottom: 12, fontSize: 16 }}>Recommendations:</h4>
              <ul style={{ paddingLeft: 0, margin: 0 }}>
                {analysisResult.tips.map((tip: string, index: number) => (
                  <TipItem key={index} tip={tip} />
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ color: 'var(--color-success)', fontSize: 16, fontWeight: 500 }}>
              Great posture! No major issues detected.
            </p>
          )}

          {analysisResult.metrics && (
            <div style={{ marginTop: 16, padding: 16, background: 'var(--color-surface)', borderRadius: 8 }}>
              <h4 style={{ color: 'var(--color-text)', marginBottom: 8, fontSize: 14 }}>Metrics:</h4>
              <div style={{ fontSize: 12, color: 'var(--color-text-soft)' }}>
                {analysisResult.metrics.head_tilt_deg != null && (
                  <div>Head Tilt: {Number(analysisResult.metrics.head_tilt_deg).toFixed(1)}°</div>
                )}
                {analysisResult.metrics.torso_lean_deg != null && (
                  <div>Torso Lean: {Number(analysisResult.metrics.torso_lean_deg).toFixed(1)}°</div>
                )}
                {analysisResult.metrics.shoulder_drop_px != null && (
                  <div>Shoulder Drop: {Number(analysisResult.metrics.shoulder_drop_px).toFixed(1)} px</div>
                )}
                {analysisResult.metrics.pelvic_drop_px != null && (
                  <div>Pelvic Drop: {Number(analysisResult.metrics.pelvic_drop_px).toFixed(1)} px</div>
                )}
                {analysisResult.metrics.left_knee_angle_deg != null && (
                  <div>Left Knee Angle: {Number(analysisResult.metrics.left_knee_angle_deg).toFixed(0)}°</div>
                )}
                {analysisResult.metrics.right_knee_angle_deg != null && (
                  <div>Right Knee Angle: {Number(analysisResult.metrics.right_knee_angle_deg).toFixed(0)}°</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostureCapture;
