import { useState } from 'react'
import { useAuth } from './components/auth-context'
import { AuthGateway } from './components/auth-gateway'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { ErgonomicAssessment } from './components/ergonomic-assessment'
import { Recommendations } from './components/recommendations'
import { BreakTimer } from './components/break-timer'
import { Dashboard } from './components/dashboard'
import { Toaster } from './components/ui/sonner'
import { Monitor, Activity, Clock, LayoutDashboard } from 'lucide-react'
import { Logo } from './components/logo'

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

export default function App() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null)
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null)

  const handleAssessmentComplete = (data: AssessmentData, score: number) => {
    setAssessmentData(data)
    setAssessmentScore(score)
    setActiveTab('recommendations')
  }

  const handleStartAssessment = () => {
    setActiveTab('assessment')
  }

  const handleViewRecommendations = () => {
    setActiveTab('recommendations')
  }

  const handleRetakeAssessment = () => {
    setActiveTab('assessment')
  }

  const handleOpenBreakTimer = () => {
    setActiveTab('breaks')
  }

  if (!user) return <AuthGateway />

  return (
    <div className="min-h-screen bg-background">
  <div className="border-b bg-[linear-gradient(90deg,var(--brand-orange-50),var(--brand-orange-100))]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-md bg-accent/60 text-accent-foreground">Posture</span>
            <span className="px-2 py-1 rounded-md bg-accent/60 text-accent-foreground">Breaks</span>
            <span className="px-2 py-1 rounded-md bg-accent/60 text-accent-foreground">Focus</span>
          </div>
          <button onClick={logout} className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Sign out</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="assessment" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Assessment
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="breaks" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Break Timer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <Dashboard
              hasAssessment={!!assessmentData}
              assessmentScore={assessmentScore || undefined}
              onStartAssessment={handleStartAssessment}
              onViewRecommendations={handleViewRecommendations}
              onOpenBreakTimer={handleOpenBreakTimer}
            />
          </TabsContent>

          <TabsContent value="assessment" className="mt-0">
            <ErgonomicAssessment onComplete={handleAssessmentComplete} />
          </TabsContent>

          <TabsContent value="recommendations" className="mt-0">
            {assessmentData && assessmentScore !== null ? (
              <Recommendations
                data={assessmentData}
                score={assessmentScore}
                onRetakeAssessment={handleRetakeAssessment}
              />
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3>No Assessment Data</h3>
                <p className="text-muted-foreground mb-4">
                  Complete an assessment first to see personalized recommendations.
                </p>
                <button
                  onClick={handleStartAssessment}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                >
                  Take Assessment
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="breaks" className="mt-0">
            <BreakTimer />
          </TabsContent>
        </Tabs>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}