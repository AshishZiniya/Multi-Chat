'use client'

import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Header from '@/components/ui/header'

const CronParser: React.FC = () => {
  const [cronExpression, setCronExpression] = useState('0 0 * * 1')
  const [parsedDescription, setParsedDescription] = useState('At 00:00 on Monday.')
  const [nextExecutions, setNextExecutions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Cron parsing functions
  const parseCronField = (field: string, min: number, max: number): number[] => {
    const values: number[] = []
    
    if (field === '*') {
      for (let i = min; i <= max; i++) {
        values.push(i)
      }
      return values
    }

    if (field.includes('/')) {
      const [range, step] = field.split('/')
      const stepNum = parseInt(step)
      const rangeValues = range === '*' ? 
        Array.from({ length: max - min + 1 }, (_, i) => i + min) :
        parseCronField(range, min, max)
      
      for (let i = 0; i < rangeValues.length; i += stepNum) {
        values.push(rangeValues[i])
      }
      return values
    }

    if (field.includes('-')) {
      const [start, end] = field.split('-').map(n => parseInt(n))
      for (let i = start; i <= end; i++) {
        values.push(i)
      }
      return values
    }

    if (field.includes(',')) {
      return field.split(',').map(n => parseInt(n))
    }

    const num = parseInt(field)
    if (!isNaN(num) && num >= min && num <= max) {
      values.push(num)
    }
    
    return values
  }

  const getNextExecutions = (minute: number[], hour: number[], day: number[], month: number[], dayOfWeek: number[], count: number = 5): Date[] => {
    const executions: Date[] = []
    const now = new Date()
    let current = new Date(now.getTime())
    
    // Set to next minute
    current.setSeconds(0)
    current.setMilliseconds(0)
    current.setMinutes(current.getMinutes() + 1)

    while (executions.length < count && current.getTime() < now.getTime() + 365 * 24 * 60 * 60 * 1000) {
      const currentMin = current.getMinutes()
      const currentHour = current.getHours()
      const currentDay = current.getDate()
      const currentMonth = current.getMonth() + 1
      const currentDayOfWeek = current.getDay() === 0 ? 7 : current.getDay() // Sunday = 7 in cron

      if (minute.includes(currentMin) && 
          hour.includes(currentHour) && 
          day.includes(currentDay) && 
          month.includes(currentMonth) && 
          dayOfWeek.includes(currentDayOfWeek)) {
        executions.push(new Date(current.getTime()))
      }

      current.setMinutes(current.getMinutes() + 1)
    }

    return executions
  }

  const describeCron = (minute: number[], hour: number[], day: number[], month: number[], dayOfWeek: number[]): string => {
    const describeField = (values: number[], type: string, names?: string[]) => {
      if (values.length === 0) return 'invalid'
      if (values.length === 1) {
        const value = values[0]
        return names ? names[value] || value.toString() : value.toString()
      }
      if (type === 'dayOfWeek') {
        const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return values.map(v => dayNames[v] || v.toString()).join(', ')
      }
      if (values.length > 20) return 'every ' + type
      return values.join(', ')
    }

    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December']
    const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    let description = 'At '

    if (hour.length === 1 && minute.length === 1) {
      description += `${hour[0].toString().padStart(2, '0')}:${minute[0].toString().padStart(2, '0')}`
    } else if (hour.length === 1) {
      description += `${hour[0].toString().padStart(2, '0')}:XX`
    } else {
      description += 'XX:XX'
    }

    if (dayOfWeek.length > 0 && dayOfWeek.length < 7) {
      description += ' on ' + describeField(dayOfWeek, 'day of week', dayNames)
    } else if (day.length > 0 && day.length < 31) {
      description += ' on day ' + describeField(day, 'day')
    } else if (dayOfWeek.length === 7 && day.length === 31) {
      description += ' every day'
    }

    if (month.length > 0 && month.length < 12) {
      description += ' in ' + describeField(month, 'month', monthNames)
    }

    return description
  }

  const handleParse = () => {
    try {
      setError(null)
      const parts = cronExpression.trim().split(/\s+/)
      
      if (parts.length !== 5) {
        throw new Error('Invalid cron expression. Must have 5 parts: minute hour day month day-of-week')
      }

      const [minutePart, hourPart, dayPart, monthPart, dayOfWeekPart] = parts
      
      const minutes = parseCronField(minutePart, 0, 59)
      const hours = parseCronField(hourPart, 0, 23)
      const days = parseCronField(dayPart, 1, 31)
      const months = parseCronField(monthPart, 1, 12)
      const dayOfWeeks = parseCronField(dayOfWeekPart, 1, 7)

      if (minutes.length === 0 || hours.length === 0 || days.length === 0 || months.length === 0 || dayOfWeeks.length === 0) {
        throw new Error('Invalid cron expression')
      }

      const description = describeCron(minutes, hours, days, months, dayOfWeeks)
      const executions = getNextExecutions(minutes, hours, days, months, dayOfWeeks)

      setParsedDescription(description)
      setNextExecutions(executions.map(date => 
        date.toLocaleString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse cron expression')
      setParsedDescription('Invalid expression')
      setNextExecutions([])
    }
  }

  const timelineDays = Array.from({ length: 31 }, (_, i) => i + 1)
  const executionDays = nextExecutions.map(date => new Date(date).getDate())

  return (
    <div className="flex-1 overflow-y-auto bg-[#1f2937]">
      <Header title="Cron Expression Parser" />
      
      <div className="p-12 space-y-8">
        {/* Input Section */}
        <Card className="bg-[#151c27] border-slate-800">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Cron Expression
              </label>
              <span className="bg-slate-700 text-[10px] px-1.5 py-0.5 rounded text-slate-400">
                * * * * *
              </span>
            </div>
            <div className="flex gap-4">
              <Input
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="e.g. 0 0 * * 1"
                className="flex-1 bg-slate-800/50 border-slate-600 font-mono text-lg"
              />
              <Button onClick={handleParse} className="bg-blue-600 hover:bg-blue-500">
                Parse
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Human Readable Translation */}
          <div className="pt-6">
            <h3 className="text-4xl font-bold mb-2 text-white">{parsedDescription}</h3>
            <p className="text-slate-400">
              {nextExecutions.length > 0 ? 'Next execution times:' : 'No valid execution times found.'}
            </p>
          </div>
        </Card>

        {/* Execution List */}
        {nextExecutions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Next Executions
              </h4>
              <ul className="space-y-3 font-mono text-sm text-slate-300">
                {nextExecutions.map((execution, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {execution}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Visual Timeline */}
        <Card className="bg-[#151c27] border-slate-800 relative pt-6">
          <div className="relative flex items-center h-24 border border-slate-800 rounded-lg bg-slate-800/20 px-4">
            {/* Timeline Grid lines */}
            <div className="absolute inset-0 flex justify-between pointer-events-none opacity-10">
              {timelineDays.map((_, i) => (
                <div key={i} className="w-px h-24 bg-slate-400"></div>
              ))}
            </div>

            {/* Timeline Axis */}
            <div className="absolute bottom-6 left-4 right-8 h-px bg-slate-700 flex items-center">
              <div className="absolute -right-1 w-2 h-2 border-t border-r border-slate-700 rotate-45"></div>
            </div>

            {/* Execution Points */}
            <div className="w-full flex justify-between items-end pb-8 relative z-10">
              {timelineDays.map((day) => (
                <div key={day} className="flex flex-col items-center gap-6">
                  <div className={`w-2 h-2 rounded-full ${executionDays.includes(day) ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-slate-600 invisible'}`}></div>
                  <span className="text-[10px] text-slate-500 font-mono">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default CronParser
