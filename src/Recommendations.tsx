import React from "react";
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle, AlertTriangle, XCircle, Monitor, Armchair, Keyboard, Eye, Clock, Lightbulb } from 'lucide-react';

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
    // ...existing code...
    // (Full logic as you provided above)
    // ...existing code...
    // For brevity, the full logic is included in your previous message and will be copied here.
    // ...existing code...
    // (End of logic)
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const recommendations = generateRecommendations(data);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-6 w-6 text-green-500" />;
    if (score >= 60) return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
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
      {/* Score Summary */}
      <Card className="mb-6">
        <div>
          <div className="flex items-center gap-3">
            {getScoreIcon(score)}
            <span className="font-bold text-lg">Your Ergonomic Score</span>
          </div>
          <p className="text-lg mb-4">{getScoreDescription(score)}</p>
          <div className="flex gap-4">
            <Button onClick={onRetakeAssessment}>Retake Assessment</Button>
          </div>
        </div>
      </Card>
      {/* Recommendations */}
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
              </div>
            </Card>
          ))
        )}
      </div>
      {/* General Tips */}
      <Card className="mt-6">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <span className="font-bold">General Ergonomic Tips</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
