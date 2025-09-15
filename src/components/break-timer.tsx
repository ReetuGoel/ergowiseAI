import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Play, Pause, RotateCcw, Clock, Eye, Coffee, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface BreakType {
  id: string
  name: string
  duration: number // in seconds
  interval: number // in seconds
  description: string
  icon: React.ReactNode
  tips: string[]
}

const breakTypes: BreakType[] = [
  {
    id: 'micro',
    name: '20-20-20 Rule',
    duration: 20,
    interval: 20 * 60, // 20 minutes
    description: 'Look at something 20 feet away for 20 seconds',
    icon: <Eye className="h-4 w-4" />,
    tips: [
      'Look out a window if possible',
      'Focus on a distant object',
      'Blink several times slowly',
      'Do eye circles - look up, down, left, right'
    ]
  },
  {
    id: 'stretch',
    name: 'Stretch Break',
    duration: 2 * 60, // 2 minutes
    interval: 30 * 60, // 30 minutes
    description: 'Stand up and do quick stretches',
    icon: <Zap className="h-4 w-4" />,
    tips: [
      'Neck rolls and shoulder shrugs',
      'Reach arms above head',
      'Gentle spinal twist while seated',
      'Ankle rolls and calf raises'
    ]
  },
  {
    id: 'walk',
    name: 'Movement Break',
    duration: 5 * 60, // 5 minutes  
    interval: 60 * 60, // 60 minutes
    description: 'Take a short walk or do light movement',
    icon: <Coffee className="h-4 w-4" />,
    tips: [
      'Walk around the office or home',
      'Do some light exercises',
      'Get some water or fresh air',
      'Practice deep breathing'
    ]
  }
]

export function BreakTimer() {
  const [activeTimers, setActiveTimers] = useState<{[key: string]: { nextBreak: number, isActive: boolean }}>({})
  const [currentBreak, setCurrentBreak] = useState<{type: BreakType, timeLeft: number} | null>(null)
  const [settings, setSettings] = useState({
    soundEnabled: true,
    autoStart: false
  })
  
  const intervalRef = useRef<NodeJS.Timeout>()
  const breakIntervalRef = useRef<NodeJS.Timeout>()

  // Initialize timers
  useEffect(() => {
    const initialTimers = breakTypes.reduce((acc, breakType) => {
      acc[breakType.id] = {
        nextBreak: Date.now() + breakType.interval * 1000,
        isActive: false
      }
      return acc
    }, {} as {[key: string]: { nextBreak: number, isActive: boolean }})
    
    setActiveTimers(initialTimers)
  }, [])

  // Main timer loop
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      
      setActiveTimers(prev => {
        const updated = { ...prev }
        
        Object.keys(updated).forEach(timerKey => {
          const timer = updated[timerKey]
          const breakType = breakTypes.find(bt => bt.id === timerKey)
          
          if (timer.isActive && breakType && now >= timer.nextBreak) {
            // Time for a break!
            if (settings.soundEnabled) {
              // You could add sound notification here
              toast.success(`Time for a ${breakType.name}!`, {
                description: breakType.description,
                duration: 5000
              })
            }
            
            if (settings.autoStart) {
              setCurrentBreak({
                type: breakType,
                timeLeft: breakType.duration
              })
            }
            
            // Reset timer for next break
            updated[timerKey] = {
              ...timer,
              nextBreak: now + breakType.interval * 1000
            }
          }
        })
        
        return updated
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [settings])

  // Break countdown timer
  useEffect(() => {
    if (currentBreak) {
      breakIntervalRef.current = setInterval(() => {
        setCurrentBreak(prev => {
          if (!prev) return null
          
          const newTimeLeft = prev.timeLeft - 1
          if (newTimeLeft <= 0) {
            toast.success('Break completed! Great job!', {
              description: 'Get back to work feeling refreshed',
            })
            return null
          }
          
          return { ...prev, timeLeft: newTimeLeft }
        })
      }, 1000)
    } else {
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current)
      }
    }

    return () => {
      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current)
    }
  }, [currentBreak])

  const toggleTimer = (breakId: string) => {
    setActiveTimers(prev => ({
      ...prev,
      [breakId]: {
        ...prev[breakId],
        isActive: !prev[breakId]?.isActive
      }
    }))
  }

  const resetTimer = (breakId: string) => {
    const breakType = breakTypes.find(bt => bt.id === breakId)
    if (breakType) {
      setActiveTimers(prev => ({
        ...prev,
        [breakId]: {
          ...prev[breakId],
          nextBreak: Date.now() + breakType.interval * 1000
        }
      }))
    }
  }

  const startBreakNow = (breakType: BreakType) => {
    setCurrentBreak({
      type: breakType,
      timeLeft: breakType.duration
    })
  }

  const skipBreak = () => {
    setCurrentBreak(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimeUntil = (timestamp: number) => {
    const now = Date.now()
    const diff = Math.max(0, Math.floor((timestamp - now) / 1000))
    
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
  }

  // Active break overlay
  if (currentBreak) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {currentBreak.type.icon}
              {currentBreak.type.name}
            </CardTitle>
            <p className="text-muted-foreground">{currentBreak.type.description}</p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl text-primary">
              {formatTime(currentBreak.timeLeft)}
            </div>
            
            <Progress 
              value={((currentBreak.type.duration - currentBreak.timeLeft) / currentBreak.type.duration) * 100} 
              className="w-full"
            />
            
            <div className="space-y-2">
              <p>Try these activities:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {currentBreak.type.tips.map((tip, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-primary rounded-full" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            
            <Button onClick={skipBreak} variant="outline" className="w-full">
              Skip Break
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2>Break Timer</h2>
        <p className="text-muted-foreground">
          Manage your break schedule to maintain health and productivity
        </p>
      </div>

      {/* Timer Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {breakTypes.map((breakType) => {
          const timer = activeTimers[breakType.id]
          const isActive = timer?.isActive || false
          const timeUntilNext = timer ? formatTimeUntil(timer.nextBreak) : '0s'
          
          return (
            <Card key={breakType.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {breakType.icon}
                    {breakType.name}
                  </div>
                  <Badge variant={isActive ? 'default' : 'secondary'}>
                    {isActive ? 'Active' : 'Paused'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {breakType.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl">
                    {isActive ? timeUntilNext : '--:--'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isActive ? 'until next break' : 'timer paused'}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    onClick={() => toggleTimer(breakType.id)}
                    className="flex-1"
                  >
                    {isActive ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                    {isActive ? 'Pause' : 'Start'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resetTimer(breakType.id)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => startBreakNow(breakType)}
                  className="w-full"
                >
                  Take Break Now
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Break Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p>Sound Notifications</p>
              <p className="text-sm text-muted-foreground">
                Play sound when break time arrives
              </p>
            </div>
            <Button
              variant={settings.soundEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            >
              {settings.soundEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p>Auto-start Breaks</p>
              <p className="text-sm text-muted-foreground">
                Automatically start break timer when time arrives
              </p>
            </div>
            <Button
              variant={settings.autoStart ? "default" : "outline"}
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, autoStart: !prev.autoStart }))}
            >
              {settings.autoStart ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}