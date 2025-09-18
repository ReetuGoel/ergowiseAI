import React from "react";
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Monitor, Armchair, Keyboard, Eye, Clock, Lightbulb } from 'lucide-react';

interface AssessmentData {
  deskHeight: number;
  monitorDistance: number;
  monitorHeight: string;
  chairSupport: string;
  feetPosition: string;
  keyboardPosition: string;
  mousePosition: string;
  lighting: string;
  breakFrequency: string;
  workHours: number;
}

interface RecommendationsProps {
  data: AssessmentData;
  score: number;
  onRetakeAssessment: () => void;
}

interface Recommendation {
  category: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
}

export function Recommendations({ data, score, onRetakeAssessment }: RecommendationsProps) {
  const generateRecommendations = (data: AssessmentData): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // Monitor recommendations
    if (data.monitorDistance < 20 || data.monitorDistance > 26) {
      recommendations.push({
        category: 'Monitor Setup',
        icon: <Monitor className="h-5 w-5" />,
        priority: 'high',
        title: 'Adjust Monitor Distance',
        description: `Your monitor is ${data.monitorDistance < 20 ? 'too close' : 'too far'}. Optimal distance is 20-26 inches.`,
        actionItems: [
          'Position monitor 20-26 inches from your eyes (arm\'s length)',
          'Use a measuring tape to verify the distance',
          'Consider a monitor arm for easy adjustment'
        ]
      });
    }

    if (data.monitorHeight !== 'eye-level' && data.monitorHeight !== 'slightly-above') {
      recommendations.push({
        category: 'Monitor Setup',
        icon: <Monitor className="h-5 w-5" />,
        priority: 'high',
        title: 'Adjust Monitor Height',
        description: 'Your monitor should be at or slightly above eye level to prevent neck strain.',
        actionItems: [
          'Raise your monitor so the top is at or slightly above eye level',
          'Use books, monitor stand, or adjustable arm',
          'Ensure you look slightly down at the screen'
        ]
      });
    }

    // Chair recommendations
    if (data.chairSupport === 'poor' || data.chairSupport === 'fair') {
      recommendations.push({
        category: 'Chair & Posture',
        icon: <Armchair className="h-5 w-5" />,
        priority: 'high',
        title: 'Improve Back Support',
        description: 'Poor back support can lead to chronic pain and posture problems.',
        actionItems: [
          'Use a lumbar support cushion',
          'Adjust chair height so thighs are parallel to floor',
          'Consider investing in an ergonomic chair',
          'Sit back fully in the chair'
        ]
      });
    }

    if (data.feetPosition === 'dangling' || data.feetPosition === 'crossed') {
      recommendations.push({
        category: 'Chair & Posture',
        icon: <Armchair className="h-5 w-5" />,
        priority: 'medium',
        title: 'Fix Foot Position',
        description: 'Proper foot support improves circulation and reduces leg strain.',
        actionItems: [
          'Keep feet flat on floor or footrest',
          'Adjust chair height if needed',
          'Use a footrest if feet don\'t reach floor',
          'Avoid crossing legs for long periods'
        ]
      });
    }

    // Keyboard and mouse recommendations
    if (data.keyboardPosition !== 'neutral') {
      recommendations.push({
        category: 'Keyboard & Mouse',
        icon: <Keyboard className="h-5 w-5" />,
        priority: 'high',
        title: 'Improve Wrist Position',
        description: 'Bent wrists can lead to carpal tunnel syndrome and other repetitive strain injuries.',
        actionItems: [
          'Keep wrists straight and neutral while typing',
          'Use a keyboard tray if desk is too high',
          'Consider an ergonomic keyboard',
          'Take frequent micro-breaks to stretch'
        ]
      });
    }

    if (data.mousePosition !== 'same-level') {
      recommendations.push({
        category: 'Keyboard & Mouse',
        icon: <Keyboard className="h-5 w-5" />,
        priority: 'medium',
        title: 'Reposition Mouse',
        description: 'Mouse should be at the same level as keyboard to prevent shoulder strain.',
        actionItems: [
          'Place mouse at same level as keyboard',
          'Keep mouse close to keyboard',
          'Use whole arm to move mouse, not just wrist',
          'Consider an ergonomic mouse'
        ]
      });
    }

    // Lighting recommendations
    if (data.lighting === 'poor' || data.lighting === 'very-poor') {
      recommendations.push({
        category: 'Environment',
        icon: <Lightbulb className="h-5 w-5" />,
        priority: 'medium',
        title: 'Improve Lighting',
        description: 'Poor lighting causes eye strain and can lead to headaches.',
        actionItems: [
          'Add task lighting to reduce screen glare',
          'Position screen perpendicular to windows',
          'Use adjustable blinds to control natural light',
          'Consider blue light filtering glasses'
        ]
      });
    }

    // Break recommendations
    if (data.breakFrequency === 'rarely' || data.breakFrequency === 'every-2hours') {
      recommendations.push({
        category: 'Break Schedule',
        icon: <Clock className="h-5 w-5" />,
        priority: 'high',
        title: 'Take More Frequent Breaks',
        description: 'Regular breaks prevent fatigue and reduce risk of repetitive strain injuries.',
        actionItems: [
          'Follow the 20-20-20 rule: every 20 min, look at something 20 feet away for 20 seconds',
          'Take a 5-minute break every hour',
          'Stand and stretch every 30 minutes',
          'Set reminders to enforce break schedule'
        ]
      });
    }

    // Work hours recommendations
    if (data.workHours > 8) {
      recommendations.push({
        category: 'Work Schedule',
        icon: <Clock className="h-5 w-5" />,
        priority: 'medium',
        title: 'Reduce Desk Time',
        description: 'Extended periods at desk increase health risks significantly.',
        actionItems: [
          'Consider standing desk or desk converter',
          'Schedule walking meetings when possible',
          'Take lunch away from your desk',
          'Use phone calls as opportunities to stand and walk'
        ]
      });
    }

    // Desk height recommendations
    if (data.deskHeight < 7) {
      recommendations.push({
        category: 'Desk Setup',
        icon: <Monitor className="h-5 w-5" />,
        priority: 'medium',
        title: 'Adjust Desk Height',
        description: 'Proper desk height reduces strain on arms, shoulders, and wrists.',
        actionItems: [
          'Elbows should be at 90-degree angle when typing',
          'Use keyboard tray if desk is too high',
          'Consider adjustable desk legs',
          'Raise chair and use footrest if needed'
        ]
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const recommendations = generateRecommendations(data);

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-6 w-6 text-green-500" />;
    return <XCircle className="h-6 w-6 text-red-500" />;
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return 'Excellent! Your workspace setup is very ergonomic.';
    if (score >= 60) return 'Good setup with room for improvement.';
    return 'Your setup needs significant improvements to prevent health issues.';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="mb-6">
        <div>
          <div className="flex items-center gap-3">
            {getScoreIcon(score)}
            <span className="font-bold text-lg">Your Ergonomic Score: {score}%</span>
          </div>
          <p className="text-lg mb-4">{getScoreDescription(score)}</p>
          <div className="flex gap-4">
            <Button onClick={onRetakeAssessment}>Retake Assessment</Button>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h2>Personalized Recommendations</h2>
        {recommendations.length === 0 ? (
          <Card>
            <div className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3>Perfect Setup!</h3>
              <p className="text-muted-foreground">
                Your workspace setup is excellent. Keep up the good habits!
              </p>
            </div>
          </Card>
        ) : (
          recommendations.map((rec, index) => (
            <Card key={index} className="overflow-hidden">
              <div>
                <div className="flex items-start justify-between">
                  <span className="flex items-center gap-2">{rec.icon}{rec.title}</span>
                  <Badge className={getPriorityColor(rec.priority)}>{rec.priority} priority</Badge>
                </div>
                <p className="text-muted-foreground">{rec.description}</p>
                <div className="mt-2">
                  <p className="text-sm font-medium">Action steps:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {rec.actionItems.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="mt-6">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <span className="font-bold">General Ergonomic Tips</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
            <div>
              <h4>Daily Habits</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Do neck and shoulder stretches</li>
                <li>Blink frequently to keep eyes moist</li>
                <li>Stay hydrated throughout the day</li>
                <li>Maintain good posture awareness</li>
              </ul>
            </div>
            <div>
              <h4>Equipment Considerations</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Invest in quality ergonomic equipment</li>
                <li>Regular equipment maintenance</li>
                <li>Proper cable management</li>
                <li>Consider ergonomic accessories</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
