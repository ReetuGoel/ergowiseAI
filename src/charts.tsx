import React from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { useTheme } from './theme-context';

// Helper to read CSS variable with fallback
const cssVar = (name: string, fallback: string) => `var(${name}, ${fallback})`;

// Sample data for different charts (use token references where colors were embedded)
const weeklyBreaksData = [
  { day: 'Mon', breaks: 5, target: 5 },
  { day: 'Tue', breaks: 3, target: 5 },
  { day: 'Wed', breaks: 7, target: 5 },
  { day: 'Thu', breaks: 4, target: 5 },
  { day: 'Fri', breaks: 6, target: 5 },
  { day: 'Sat', breaks: 2, target: 5 },
  { day: 'Sun', breaks: 1, target: 5 }
];

const monthlyProgressData = [
  { month: 'Jan', score: 65 },
  { month: 'Feb', score: 71 },
  { month: 'Mar', score: 68 },
  { month: 'Apr', score: 78 },
  { month: 'May', score: 82 },
  { month: 'Jun', score: 85 }
];

const ergonomicCategoriesData = [
  { name: 'Posture', value: 85, color: cssVar('--chart-1', '#115ea3') },
  { name: 'Monitor', value: 92, color: cssVar('--chart-2', '#0f6cbd') },
  { name: 'Lighting', value: 78, color: cssVar('--chart-3', '#3b88d4') },
  { name: 'Breaks', value: 66, color: cssVar('--chart-4', '#6cb8f6') }
];

const dailyActivityData = [
  { time: '9AM', activity: 90 },
  { time: '10AM', activity: 85 },
  { time: '11AM', activity: 75 },
  { time: '12PM', activity: 20 }, // lunch break
  { time: '1PM', activity: 95 },
  { time: '2PM', activity: 88 },
  { time: '3PM', activity: 70 },
  { time: '4PM', activity: 82 },
  { time: '5PM', activity: 60 }
];

export function WeeklyBreaksChart() {
  const { isDark } = useTheme();
  const textColor = isDark ? cssVar('--neutral-text', '#ffffff') : cssVar('--neutral-text', '#201f1e');
  const gridColor = isDark ? cssVar('--neutral-border', '#3b3a39') : cssVar('--neutral-border', '#d1d1d1');
  const breaksColor = cssVar('--chart-2', '#0f6cbd');
  const targetColor = cssVar('--chart-5', '#9fd5fa');
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-md)' }}>
      <h3 style={{ color: 'var(--color-primary)', marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Weekly Break Pattern</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={weeklyBreaksData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="day" stroke={textColor} fontSize={12} />
          <YAxis stroke={textColor} fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              background: 'var(--color-surface-alt)', 
              border: '1px solid var(--color-primary)', 
              borderRadius: 8,
              color: textColor
            }} 
          />
          <Bar dataKey="breaks" fill={breaksColor} radius={4} />
          <Bar dataKey="target" fill={targetColor} radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProgressTrendChart() {
  const { isDark } = useTheme();
  const textColor = isDark ? cssVar('--neutral-text', '#ffffff') : cssVar('--neutral-text', '#201f1e');
  const gridColor = isDark ? cssVar('--neutral-border', '#3b3a39') : cssVar('--neutral-border', '#d1d1d1');
  const strokeColor = cssVar('--chart-1', '#115ea3');
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-md)' }}>
      <h3 style={{ color: 'var(--color-primary)', marginBottom: 16, fontSize: 18, fontWeight: 600 }}>6-Month Progress Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={monthlyProgressData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="month" stroke={textColor} fontSize={12} />
          <YAxis stroke={textColor} fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              background: 'var(--color-surface-alt)', 
              border: '1px solid var(--color-primary)', 
              borderRadius: 8,
              color: textColor
            }} 
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke={strokeColor} 
            fill="url(#colorGradient)" 
            strokeWidth={3}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ErgonomicCategoriesChart() {
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-md)' }}>
      <h3 style={{ color: 'var(--color-primary)', marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Ergonomic Categories</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={ergonomicCategoriesData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {ergonomicCategoriesData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              background: 'var(--color-surface-alt)', 
              border: '1px solid var(--color-primary)', 
              borderRadius: 8,
              color: 'var(--color-text)'
            }} 
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
        {ergonomicCategoriesData.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-soft)' }}>{item.name}: {item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DailyActivityChart() {
  const { isDark } = useTheme();
  const textColor = isDark ? cssVar('--neutral-text', '#ffffff') : cssVar('--neutral-text', '#201f1e');
  const gridColor = isDark ? cssVar('--neutral-border', '#3b3a39') : cssVar('--neutral-border', '#d1d1d1');
  const strokeColor = cssVar('--chart-2', '#0f6cbd');
  const activeDot = cssVar('--chart-3', '#3b88d4');
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-md)' }}>
      <h3 style={{ color: 'var(--color-primary)', marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Today's Activity Level</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={dailyActivityData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="time" stroke={textColor} fontSize={12} />
            <YAxis stroke={textColor} fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                background: 'var(--color-surface-alt)', 
                border: '1px solid var(--color-primary)', 
                borderRadius: 8,
                color: textColor
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="activity" 
              stroke={strokeColor} 
              strokeWidth={3}
              dot={{ fill: strokeColor, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: activeDot }}
            />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WellnessScoreRadial({ score = 82 }: { score?: number }) {
  const fillColor = cssVar('--chart-1', '#115ea3');
  const data = [{ name: 'Wellness Score', value: score, fill: fillColor }];
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
      <h3 style={{ color: 'var(--color-primary)', marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Overall Wellness Score</h3>
      <div style={{ position: 'relative', height: 200 }}>
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={data}>
            <RadialBar dataKey="value" cornerRadius={10} fill={fillColor} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>{score}%</div>
          <div style={{ fontSize: 14, color: 'var(--color-text-soft)', marginTop: 4, lineHeight: 1 }}>Excellent</div>
        </div>
      </div>
    </div>
  );
}