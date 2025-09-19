import React, { useState } from 'react';

const PostureCapture: React.FC = () => {
  // Handle file upload
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let files = Array.from(e.target.files || []);
    if (files.length > 5) {
      files = files.slice(0, 5);
      setUploadMessage('You can upload a maximum of 5 photos at once.');
    } else if (files.length > 0) {
      setUploadMessage(`${files.length} photo${files.length > 1 ? 's' : ''} selected successfully!`);
    }
    setSelectedFiles(files);
    setAnalysisResult(null);
    if (files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setPreview(null);
    }
    setTimeout(() => setUploadMessage(null), 3000);
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFiles[0]); // Analyze first file
      
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      setAnalysisResult(result);
      
      if (result.detected) {
        setUploadMessage('Analysis complete! Check results below.');
      } else {
        setUploadMessage('No person detected in the image. Please try another photo.');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setUploadMessage('Analysis failed. Make sure the backend server is running.');
    }
    
    setIsAnalyzing(false);
    setTimeout(() => setUploadMessage(null), 5000);
  };

  // Return the redesigned vertical layout
  return (
    <div style={{
      padding: 32,
      borderRadius: 28,
      background: 'var(--color-surface)',
      boxShadow: '0 8px 32px rgba(33,150,243,0.10)',
      maxWidth: 520,
      margin: '40px auto',
      border: '1px solid var(--color-surface-alt2)'
    }}>

      {/* Upload Section */}
      <div style={{
        background: 'var(--color-surface-alt)',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 2px 8px rgba(33,150,243,0.08)',
        border: '1px solid var(--color-primary)',
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16
      }}>
        <input type="file" accept="image/*" multiple style={{ display: 'none' }} id="file-upload" onChange={handleFileChange} />
        <button
          type="button"
          style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 16, padding: '14px 36px', fontWeight: 600, cursor: 'pointer', fontSize: 18, boxShadow: '0 2px 8px rgba(33,150,243,0.08)' }}
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
              opacity: isAnalyzing ? 0.6 : 1
            }}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Posture'}
          </button>
        )}
      </div>

      {uploadMessage && (
        <div style={{
          padding: 16,
          borderRadius: 12,
          background: analysisResult?.detected ? 'var(--color-success-bg)' : 'var(--color-info-bg)',
          color: analysisResult?.detected ? 'var(--color-success)' : 'var(--color-info)',
          border: `1px solid ${analysisResult?.detected ? 'var(--color-success)' : 'var(--color-info)'}`,
          marginBottom: 24,
          textAlign: 'center',
          fontWeight: 500
        }}>
          {uploadMessage}
        </div>
      )}

      {preview && (
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-soft)', marginBottom: 8 }}>Preview of first image:</p>
          <img 
            src={preview} 
            alt="preview" 
            style={{
              maxWidth: '100%',
              borderRadius: 12,
              border: '1px solid var(--color-surface-alt2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          />
        </div>
      )}

      {analysisResult && analysisResult.detected && (
        <div style={{
          background: 'var(--color-surface-alt)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid var(--color-primary)',
          marginTop: 24
        }}>
          <h3 style={{ color: 'var(--color-primary)', marginBottom: 16, fontSize: 20, fontWeight: 600 }}>
            Posture Analysis Results
          </h3>
          
          {analysisResult.tips && analysisResult.tips.length > 0 ? (
            <div>
              <h4 style={{ color: 'var(--color-text)', marginBottom: 12, fontSize: 16 }}>
                Recommendations:
              </h4>
              <ul style={{ color: 'var(--color-text-soft)', paddingLeft: 20 }}>
                {analysisResult.tips.map((tip: string, index: number) => (
                  <li key={index} style={{ marginBottom: 8, lineHeight: 1.5 }}>
                    {tip}
                  </li>
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
              <h4 style={{ color: 'var(--color-text)', marginBottom: 8, fontSize: 14 }}>
                Metrics:
              </h4>
              <div style={{ fontSize: 12, color: 'var(--color-text-soft)' }}>
                {analysisResult.metrics.head_tilt_deg && (
                  <div>Head Tilt: {analysisResult.metrics.head_tilt_deg.toFixed(1)}°</div>
                )}
                {analysisResult.metrics.torso_lean_deg && (
                  <div>Torso Lean: {analysisResult.metrics.torso_lean_deg.toFixed(1)}°</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PostureCapture;
