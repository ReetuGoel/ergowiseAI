import './index.css';
import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, Monitor, Armchair, Keyboard, Lightbulb, ChevronRight, ChevronLeft } from 'lucide-react';

const BREAK_DURATION = 5 * 60;

export function BreakTimer({ startTrigger }: { startTrigger?: number }) {
  const [secondsLeft, setSecondsLeft] = useState(BREAK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const startBreak = () => {
    setIsRunning(true);
    timerRef.current = window.setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          setIsRunning(false);
          return BREAK_DURATION;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start break when parent signals via startTrigger (incrementing number)
  // Only start when startTrigger actually changes after mount.
  // We skip the first render to avoid auto-starting when the Break Timer tab is selected
  const startTriggerMounted = useRef(false);
  useEffect(() => {
    if (!startTriggerMounted.current) {
      startTriggerMounted.current = true;
      return;
    }
    if (startTrigger !== undefined) {
      if (!isRunning) startBreak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTrigger]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const stopBreak = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setIsRunning(false);
    setSecondsLeft(BREAK_DURATION);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '2px solid var(--color-surface-alt2)',
      borderRadius: 16,
      padding: '2rem',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(234,88,12,0.12)',
      maxWidth: 320,
      margin: '2rem auto'
    }}>
      <h2 style={{ color: 'var(--color-primary)', marginBottom: '1rem', fontWeight: 700 }}>Take a Break!</h2>
      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-accent)', marginBottom: '1.5rem' }}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
      {!isRunning ? (
        <button style={{
          background: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '0.7rem 2rem',
          fontSize: '1rem',
          cursor: 'pointer',
          fontWeight: 600,
          boxShadow: '0 1px 4px rgba(234,88,12,0.3)'
        }} onClick={startBreak}>Start Break</button>
      ) : (
        <button style={{
          background: 'var(--color-secondary)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '0.7rem 2rem',
          fontSize: '1rem',
          cursor: 'pointer',
          fontWeight: 600,
          boxShadow: '0 1px 4px rgba(194,65,12,0.3)'
        }} onClick={stopBreak}>Stop Break</button>
      )}
      <p style={{ marginTop: '1.5rem', color: 'var(--color-text)' }}>Regular breaks help you stay healthy and focused!</p>
    </div>
  );
}

const assessmentQuestions = [
  { category: 'Desk Setup', icon: <Monitor size={32} color="var(--color-primary)" />, description: "Let's start with your desk and workspace positioning.", questions: [{ key: 'deskHeight', question: 'Is your desk height comfortable?', options: ['Yes', 'No'] }] },
  { category: 'Chair & Posture', icon: <Armchair size={32} color="var(--color-primary)" />, description: "Let's check your chair and posture.", questions: [{ key: 'chairSupport', question: 'Does your chair provide good back support?', options: ['Yes', 'No'] }] },
  { category: 'Keyboard & Mouse', icon: <Keyboard size={32} color="var(--color-primary)" />, description: "Let's review your keyboard and mouse setup.", questions: [{ key: 'keyboardPosition', question: 'Is your keyboard at a comfortable position?', options: ['Yes', 'No'] }] },
  { category: 'Lighting', icon: <Lightbulb size={32} color="var(--color-primary)" />, description: "Let's check your workspace lighting.", questions: [{ key: 'lighting', question: 'Is your workspace lighting adequate?', options: ['Yes', 'No'] }] }
];

function GrowingTree({ progress }: { progress: number }) {
  const treeHeight = 60 + progress * 1.2;
  const leafCount = Math.floor(progress / 20) + 1;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <ellipse cx="60" cy="110" rx="40" ry="10" fill="#fed7aa" />
      <rect x="55" y={110 - treeHeight} width="10" height={treeHeight} rx="5" fill="#9a3412" />
      {[...Array(leafCount)].map((_, i) => (
        <circle key={i} cx={60 + Math.sin((i / leafCount) * Math.PI * 2) * 20} cy={110 - treeHeight - 20 + Math.cos((i / leafCount) * Math.PI * 2) * 10} r={12} fill="var(--color-primary)" opacity={0.8} />
      ))}
      <circle cx="100" cy="20" r="12" fill="#fb923c" opacity={0.7} />
    </svg>
  );
}

export default function Assessment() {
  const [currentCategory, setCurrentCategory] = useState(0);
  const [formData, setFormData] = useState<{ [key: string]: string }>({});

  const currentCategoryData = assessmentQuestions[currentCategory];
  const totalQuestions = assessmentQuestions.reduce((sum, cat) => sum + cat.questions.length, 0);
  const answeredQuestions = Object.keys(formData).length;
  const progress = Math.round((answeredQuestions / totalQuestions) * 100);

  const handleInputChange = (key: string, value: string) => setFormData({ ...formData, [key]: value });

  const canProceed = currentCategoryData.questions.every(q => formData[q.key]);
  const isLastCategory = currentCategory === assessmentQuestions.length - 1;

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', background: 'var(--color-surface-alt)', borderRadius: 24, boxShadow: '0 8px 32px rgba(234,88,12,0.12)', padding: '32px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>Ergonomic Assessment</h2>
        <p style={{ color: 'var(--color-text-soft)', marginBottom: 16 }}>Grow your wellness tree by building good habits!</p>
        <GrowingTree progress={progress} />
        <div style={{ marginBottom: 8, marginTop: 8 }}>
          <span style={{ fontSize: 14, color: 'var(--color-text-soft)' }}>Step {currentCategory + 1} of {assessmentQuestions.length}</span>
        </div>
        <div style={{ width: '100%', background: 'var(--color-surface-alt2)', borderRadius: 8, height: 10, margin: '0 auto', marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ background: 'var(--color-primary)', height: 10, borderRadius: 8, width: `${progress}%`, transition: 'width 0.3s' }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, justifyContent: 'center' }}>
        <div style={{ background: 'var(--color-surface-alt2)', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center' }}>
          {currentCategoryData.icon}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 20, color: 'var(--color-primary)' }}>{currentCategoryData.category}</div>
          <div style={{ fontSize: 15, color: 'var(--color-text-soft)', marginTop: 4 }}>{currentCategoryData.description}</div>
        </div>
      </div>
      {currentCategoryData.questions.map((question, questionIndex) => (
        <div key={question.key} style={{ marginBottom: 24, padding: 20, background: 'var(--color-surface)', borderRadius: 16, boxShadow: '0 2px 8px rgba(234,88,12,0.18)' }}>
          <div style={{ fontWeight: 500, fontSize: 17, marginBottom: 12, color: '#111' }}>{questionIndex + 1}. {question.question}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {question.options.map(option => (
              <label key={option} style={{ display: 'flex', alignItems: 'center', gap: 8, background: formData[question.key] === option ? 'var(--color-surface-alt2)' : '#fff', border: '2px solid var(--color-primary)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, color: 'var(--color-primary)', fontSize: 16, boxShadow: formData[question.key] === option ? '0 2px 8px rgba(234,88,12,0.18)' : undefined, transition: 'all 0.2s' }}>
                <input type="radio" name={question.key} value={option} checked={formData[question.key] === option} onChange={() => handleInputChange(question.key, option)} style={{ accentColor: 'var(--color-primary)' }} />
                {option}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
        <button onClick={() => setCurrentCategory(prev => Math.max(0, prev - 1))} disabled={currentCategory === 0} style={{ padding: '12px 28px', background: '#fff', color: 'var(--color-primary)', border: '2px solid var(--color-surface-alt2)', borderRadius: 8, fontWeight: 600, fontSize: 17, cursor: currentCategory === 0 ? 'not-allowed' : 'pointer', opacity: currentCategory === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChevronLeft size={20} /> Previous
        </button>
        {isLastCategory ? (
          <button onClick={() => alert('Assessment Complete! Your tree is thriving!')} disabled={!canProceed} style={{ padding: '12px 28px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 17, cursor: !canProceed ? 'not-allowed' : 'pointer', opacity: !canProceed ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            Complete Assessment <CheckCircle size={20} />
          </button>
        ) : (
          <button onClick={() => setCurrentCategory(prev => prev + 1)} disabled={!canProceed} style={{ padding: '12px 28px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 17, cursor: !canProceed ? 'not-allowed' : 'pointer', opacity: !canProceed ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            Next Category <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

