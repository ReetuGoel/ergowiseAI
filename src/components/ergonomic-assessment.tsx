import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { Slider } from './ui/slider'
import { Progress } from './ui/progress'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface AssessmentData {
  deskHeight: number
  monitorDistance: number
  monitorHeight: string
  chairSupport: string
  feetPosition: string
  keyboardPosition: string
  mousePosition: string
  lighting: string
  breakFrequency: string
  workHours: number
}

interface AssessmentProps {
  onComplete: (data: AssessmentData, score: number) => void
}

const assessmentQuestions = [
  {
    category: 'Desk Setup',
    questions: [
      {
        key: 'deskHeight' as keyof AssessmentData,
        question: 'How would you rate your desk height?',
        type: 'slider',
        label: 'Desk height comfort (1-10)',
        min: 1,
        max: 10,
        step: 1
      }
    ]
  },
  {
    category: 'Monitor Position',
    questions: [
      {
        key: 'monitorDistance' as keyof AssessmentData,
        question: 'How far is your monitor from your eyes?',
        type: 'slider',
        label: 'Distance in inches',
        min: 12,
        max: 36,
        step: 1
      },
      {
        key: 'monitorHeight' as keyof AssessmentData,
        question: 'Where is the top of your monitor relative to your eye level?',
        type: 'radio',
        options: [
          { value: 'above', label: 'Significantly above my eye level' },
          { value: 'slightly-above', label: 'Slightly above my eye level' },
          { value: 'eye-level', label: 'At my eye level' },
          { value: 'below', label: 'Below my eye level' }
        ]
      }
    ]
  },
  {
    category: 'Chair & Posture',
    questions: [
      {
        key: 'chairSupport' as keyof AssessmentData,
        question: 'How well does your chair support your lower back?',
        type: 'radio',
        options: [
          { value: 'excellent', label: 'Excellent - perfect lumbar support' },
          { value: 'good', label: 'Good - adequate support' },
          { value: 'fair', label: 'Fair - some support' },
          { value: 'poor', label: 'Poor - no support' }
        ]
      },
      {
        key: 'feetPosition' as keyof AssessmentData,
        question: 'How are your feet positioned while working?',
        type: 'radio',
        options: [
          { value: 'flat-floor', label: 'Flat on the floor' },
          { value: 'footrest', label: 'On a footrest' },
          { value: 'dangling', label: 'Dangling/not supported' },
          { value: 'crossed', label: 'Often crossed or tucked under' }
        ]
      }
    ]
  },
  {
    category: 'Keyboard & Mouse',
    questions: [
      {
        key: 'keyboardPosition' as keyof AssessmentData,
        question: 'How are your wrists positioned while typing?',
        type: 'radio',
        options: [
          { value: 'neutral', label: 'Neutral/straight' },
          { value: 'slightly-bent', label: 'Slightly bent up or down' },
          { value: 'very-bent', label: 'Very bent or twisted' },
          { value: 'resting', label: 'Resting on desk edge' }
        ]
      },
      {
        key: 'mousePosition' as keyof AssessmentData,
        question: 'How is your mouse positioned?',
        type: 'radio',
        options: [
          { value: 'same-level', label: 'Same level as keyboard' },
          { value: 'higher', label: 'Higher than keyboard' },
          { value: 'far', label: 'Far from keyboard' },
          { value: 'awkward', label: 'Requires awkward reaching' }
        ]
      }
    ]
  },
  {
    category: 'Environment & Breaks',
    questions: [
      {
        key: 'lighting' as keyof AssessmentData,
        question: 'How is the lighting in your workspace?',
        type: 'radio',
        options: [
          { value: 'optimal', label: 'Optimal - no glare or shadows' },
          { value: 'good', label: 'Good - minor issues' },
          { value: 'poor', label: 'Poor - glare or too dim' },
          { value: 'very-poor', label: 'Very poor - eye strain' }
        ]
      },
      {
        key: 'breakFrequency' as keyof AssessmentData,
        question: 'How often do you take breaks from your desk?',
        type: 'radio',
        options: [
          { value: 'every-30min', label: 'Every 30 minutes' },
          { value: 'every-hour', label: 'Every hour' },
          { value: 'every-2hours', label: 'Every 2-3 hours' },
          { value: 'rarely', label: 'Rarely or never' }
        ]
      },
      {
        key: 'workHours' as keyof AssessmentData,
        question: 'How many hours do you typically work at your desk per day?',
        type: 'slider',
        label: 'Hours per day',
        min: 1,
        max: 12,
        step: 0.5
      }
    ]
  }
]

export function ErgonomicAssessment({ onComplete }: AssessmentProps) {
  const [currentCategory, setCurrentCategory] = useState(0)
  const [formData, setFormData] = useState<Partial<AssessmentData>>({})
  
  const totalQuestions = assessmentQuestions.reduce((acc, cat) => acc + cat.questions.length, 0)
  const answeredQuestions = Object.keys(formData).length
  const progress = (answeredQuestions / totalQuestions) * 100

  const handleInputChange = (key: keyof AssessmentData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const calculateScore = (data: AssessmentData): number => {
    let score = 0
    let maxScore = 0

    // Desk height (higher is better)
    score += (data.deskHeight / 10) * 10
    maxScore += 10

    // Monitor distance (20-26 inches is optimal)
    const distanceScore = data.monitorDistance >= 20 && data.monitorDistance <= 26 ? 10 : 
                         data.monitorDistance >= 18 && data.monitorDistance <= 30 ? 7 : 5
    score += distanceScore
    maxScore += 10

    // Monitor height
    const heightScores = { 'eye-level': 10, 'slightly-above': 8, 'above': 5, 'below': 6 }
    score += heightScores[data.monitorHeight as keyof typeof heightScores] || 0
    maxScore += 10

    // Chair support
    const chairScores = { 'excellent': 10, 'good': 8, 'fair': 5, 'poor': 2 }
    score += chairScores[data.chairSupport as keyof typeof chairScores] || 0
    maxScore += 10

    // Feet position
    const feetScores = { 'flat-floor': 10, 'footrest': 9, 'dangling': 4, 'crossed': 3 }
    score += feetScores[data.feetPosition as keyof typeof feetScores] || 0
    maxScore += 10

    // Keyboard position
    const keyboardScores = { 'neutral': 10, 'slightly-bent': 7, 'very-bent': 3, 'resting': 2 }
    score += keyboardScores[data.keyboardPosition as keyof typeof keyboardScores] || 0
    maxScore += 10

    // Mouse position
    const mouseScores = { 'same-level': 10, 'higher': 7, 'far': 5, 'awkward': 2 }
    score += mouseScores[data.mousePosition as keyof typeof mouseScores] || 0
    maxScore += 10

    // Lighting
    const lightingScores = { 'optimal': 10, 'good': 8, 'poor': 4, 'very-poor': 2 }
    score += lightingScores[data.lighting as keyof typeof lightingScores] || 0
    maxScore += 10

    // Break frequency
    const breakScores = { 'every-30min': 10, 'every-hour': 8, 'every-2hours': 5, 'rarely': 2 }
    score += breakScores[data.breakFrequency as keyof typeof breakScores] || 0
    maxScore += 10

    // Work hours (fewer hours = better score)
    const hoursScore = data.workHours <= 6 ? 10 : data.workHours <= 8 ? 8 : data.workHours <= 10 ? 5 : 2
    score += hoursScore
    maxScore += 10

    return Math.round((score / maxScore) * 100)
  }

  const handleSubmit = () => {
    if (Object.keys(formData).length === totalQuestions) {
      const score = calculateScore(formData as AssessmentData)
      onComplete(formData as AssessmentData, score)
    }
  }

  const currentCategoryData = assessmentQuestions[currentCategory]
  const isLastCategory = currentCategory === assessmentQuestions.length - 1
  const canProceed = currentCategoryData.questions.every(q => formData[q.key] !== undefined)

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2>Ergonomic Assessment</h2>
          <span className="text-sm text-muted-foreground">
            {answeredQuestions}/{totalQuestions} completed
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentCategoryData.category}
            <span className="text-sm bg-muted px-2 py-1 rounded">
              {currentCategory + 1}/{assessmentQuestions.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentCategoryData.questions.map((question) => (
            <div key={question.key} className="space-y-3">
              <Label>{question.question}</Label>
              
              {question.type === 'radio' && question.options && (
                <RadioGroup
                  value={formData[question.key] as string || ''}
                  onValueChange={(value) => handleInputChange(question.key, value)}
                >
                  {question.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === 'slider' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{question.min}</span>
                    <span>{question.label}</span>
                    <span>{question.max}</span>
                  </div>
                  <Slider
                    value={[formData[question.key] as number || question.min]}
                    onValueChange={(value) => handleInputChange(question.key, value[0])}
                    max={question.max}
                    min={question.min}
                    step={question.step}
                    className="w-full"
                  />
                  <div className="text-center">
                    <span className="text-lg">
                      {formData[question.key] || question.min}
                      {question.key === 'monitorDistance' ? ' inches' : 
                       question.key === 'workHours' ? ' hours' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentCategory(prev => Math.max(0, prev - 1))}
              disabled={currentCategory === 0}
            >
              Previous
            </Button>
            
            {isLastCategory ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed}
                className="bg-primary hover:bg-primary/90"
              >
                Complete Assessment
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentCategory(prev => prev + 1)}
                disabled={!canProceed}
              >
                Next Category
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}