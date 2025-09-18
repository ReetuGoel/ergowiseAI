import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Eye, 
  TrendingUp,
  Target,
  Calendar
} from 'lucide-react'

interface DashboardProps {
  hasAssessment: boolean
  assessmentScore?: number
  onStartAssessment: () => void
  onViewRecommendations: () => void
  onOpenBreakTimer: () => void
}

// Mock data for demonstration
const mockStats = {
  weeklyBreaks: 23,
  targetBreaks: 35,
  averageBreakLength: 3.2,
  ergonomicStreak: 7,
  lastAssessment: '3 days ago',
  improvementTrend: 15
}

const quickTips = [
  {
    icon: <Eye className="h-4 w-4 text-[oklch(0.74_0.17_70)]" />,
    title: '20-20-20 Rule',
    description: 'Every 20 minutes, look at something 20 feet away for 20 seconds'
  },
  {
    icon: <Activity className="h-4 w-4 text-[oklch(0.66_0.18_70)]" />,
    title: 'Posture Check',
    description: 'Keep your feet flat, back straight, and shoulders relaxed'
  },
  {
    icon: <Clock className="h-4 w-4 text-[oklch(0.80_0.15_70)]" />,
    title: 'Stand & Stretch',
    description: 'Stand up and stretch for 2 minutes every 30 minutes'
  }
]

const recentActivities = [
  { action: 'Completed stretch break', time: '2 hours ago', type: 'break' },
  { action: 'Took assessment', time: '3 days ago', type: 'assessment' },
  { action: 'Applied monitor adjustment', time: '1 week ago', type: 'improvement' },
  { action: 'Started using break timer', time: '1 week ago', type: 'timer' }
]

export function Dashboard({ hasAssessment, assessmentScore, onStartAssessment, onViewRecommendations, onOpenBreakTimer }: DashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { text: 'Excellent', variant: 'default' as const }
    if (score >= 60) return { text: 'Good', variant: 'secondary' as const }
    return { text: 'Needs Work', variant: 'destructive' as const }
  }

  const breakProgress = (mockStats.weeklyBreaks / mockStats.targetBreaks) * 100

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1>Ergonomic Wellness Dashboard</h1>
        <p className="text-muted-foreground">
          Track your workspace health and productivity habits
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Assessment Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current Score</CardTitle>
          </CardHeader>
          <CardContent>
            {hasAssessment && assessmentScore !== undefined ? (
              <div className="flex items-center gap-2">
                {getScoreIcon(assessmentScore)}
                <div>
                  <div className={`text-2xl ${getScoreColor(assessmentScore)}`}>
                    {assessmentScore}%
                  </div>
                  <Badge variant={getScoreBadge(assessmentScore).variant} className="text-xs">
                    {getScoreBadge(assessmentScore).text}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <div className="text-2xl text-muted-foreground">--</div>
                <p className="text-xs text-muted-foreground">No assessment yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Breaks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Weekly Breaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{mockStats.weeklyBreaks}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              Target: {mockStats.targetBreaks}
            </div>
            <Progress value={breakProgress} className="h-1 mt-2" />
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-[oklch(0.66_0.18_70)]">{mockStats.ergonomicStreak}</div>
            <p className="text-xs text-muted-foreground">Days of good habits</p>
          </CardContent>
        </Card>

        {/* Improvement */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monthly Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-[oklch(0.74_0.17_70)]" />
              <span className="text-2xl text-[oklch(0.66_0.18_70)]">+{mockStats.improvementTrend}%</span>
            </div>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Ergonomic Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasAssessment ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span>Last assessment:</span>
                  <span className="text-sm text-muted-foreground">{mockStats.lastAssessment}</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  {assessmentScore && getScoreIcon(assessmentScore)}
                  <span className={assessmentScore ? getScoreColor(assessmentScore) : ''}>
                    {assessmentScore ? `${assessmentScore}% score` : 'Score unavailable'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={onViewRecommendations} className="flex-1 bg-[oklch(0.74_0.17_70)] hover:bg-[oklch(0.66_0.18_70)] text-white">
                    View Recommendations
                  </Button>
                  <Button onClick={onStartAssessment} variant="outline" className="border-[oklch(0.80_0.15_70)] text-[oklch(0.66_0.18_70)] hover:bg-[oklch(0.97_0.02_70)]">
                    Retake
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-4">
                  Take a comprehensive assessment to get personalized recommendations for your workspace setup.
                </p>
                <Button onClick={onStartAssessment} className="w-full bg-[oklch(0.74_0.17_70)] hover:bg-[oklch(0.66_0.18_70)] text-white">
                  Start Assessment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Break Timer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Break Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>This week's breaks:</span>
                <span>{mockStats.weeklyBreaks}/{mockStats.targetBreaks}</span>
              </div>
              <Progress value={breakProgress} />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Average break length:</span>
                <span>{mockStats.averageBreakLength} min</span>
              </div>
              <div className="flex justify-between">
                <span>Breaks today:</span>
                <span>5</span>
              </div>
            </div>
            
            <Button onClick={onOpenBreakTimer} className="w-full bg-[oklch(0.74_0.17_70)] hover:bg-[oklch(0.66_0.18_70)] text-white">
              Manage Break Timers
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                  {tip.icon}
                  <div>
                    <p className="text-sm">{tip.title}</p>
                    <p className="text-xs text-muted-foreground">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'break' ? 'bg-[oklch(0.80_0.15_70)]' :
                    activity.type === 'assessment' ? 'bg-[oklch(0.66_0.18_70)]' :
                    activity.type === 'improvement' ? 'bg-[oklch(0.74_0.17_70)]' :
                    'bg-[oklch(0.58_0.18_70)]'
                  }`} />
                  <div className="flex-1">
                    <p>{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}