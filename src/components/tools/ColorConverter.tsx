'use client'

import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/input'
import Header from '@/components/ui/header'

const ColorConverter: React.FC = () => {
  const [hex, setHex] = useState('#FF0099')
  const [rgb, setRgb] = useState({ r: 255, g: 0, b: 153 })
  const [hsl, setHsl] = useState({ h: 324, s: 100, l: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingSlider, setIsDraggingSlider] = useState<string | null>(null)
  const [colorHistory, setColorHistory] = useState<string[]>(['#FF0099'])
  const [copied, setCopied] = useState<string | null>(null)

  // Color conversion functions
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  }

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360
    s /= 100
    l /= 100

    let r, g, b

    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
  }

  const handleHexChange = (value: string) => {
    setHex(value)
    const rgbValue = hexToRgb(value)
    if (rgbValue) {
      setRgb(rgbValue)
      setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b))
      addToHistory(value)
    }
  }

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const numValue = Math.max(0, Math.min(255, parseInt(value) || 0))
    const newRgb = { ...rgb, [channel]: numValue }
    setRgb(newRgb)
    const hexValue = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    setHex(hexValue.toUpperCase())
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b))
    addToHistory(hexValue.toUpperCase())
  }

  const handleHslChange = (channel: 'h' | 's' | 'l', value: string) => {
    let numValue = parseInt(value) || 0
    if (channel === 'h') {
      numValue = ((numValue % 360) + 360) % 360
    } else {
      numValue = Math.max(0, Math.min(100, numValue))
    }
    
    const newHsl = { ...hsl, [channel]: numValue }
    setHsl(newHsl)
    const rgbValue = hslToRgb(newHsl.h, newHsl.s, newHsl.l)
    setRgb(rgbValue)
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b).toUpperCase())
    addToHistory(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b).toUpperCase())
  }

  const generateShades = () => {
    return Array.from({ length: 8 }, (_, i) => {
      const factor = 1 - (i * 0.125)
      const r = Math.round(rgb.r * factor)
      const g = Math.round(rgb.g * factor)
      const b = Math.round(rgb.b * factor)
      return rgbToHex(r, g, b)
    })
  }

  const generateTints = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const factor = 0.2 + (i * 0.12)
      const r = Math.round(rgb.r + (255 - rgb.r) * factor)
      const g = Math.round(rgb.g + (255 - rgb.g) * factor)
      const b = Math.round(rgb.b + (255 - rgb.b) * factor)
      return rgbToHex(r, g, b)
    })
  }

  const generateComplementary = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const factor = i * 0.15
      const r = Math.round(rgb.r + (255 - rgb.r) * factor)
      const g = Math.round(rgb.g + (255 - rgb.g) * factor)
      const b = Math.round(rgb.b + (255 - rgb.b) * factor)
      return rgbToHex(r, g, b)
    })
  }

  const calculateContrastRatio = (color1: [number, number, number], color2: [number, number, number]) => {
    const luminance = (color: [number, number, number]) => {
      const [r, g, b] = color.map(val => {
        const normalized = val / 255
        return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    const l1 = luminance(color1)
    const l2 = luminance(color2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }

  // Color picker functions
  const getColorFromPosition = (x: number, y: number, width: number, height: number) => {
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 8 // Account for padding
    
    const dx = x - centerX
    const dy = y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > radius) {
      return null // Outside the circle
    }
    
    // Calculate angle (hue)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90
    if (angle < 0) angle += 360
    
    // Calculate saturation based on distance from center
    const saturation = Math.min(100, (distance / radius) * 100)
    
    // Calculate lightness based on y position (simplified - using current lightness)
    const lightness = hsl.l
    
    return { h: Math.round(angle), s: Math.round(saturation), l: lightness }
  }

  const handleColorWheelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const color = getColorFromPosition(x, y, rect.width, rect.height)
    if (color) {
      const newRgb = hslToRgb(color.h, color.s, color.l)
      setRgb(newRgb)
      setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b).toUpperCase())
      setHsl({ h: color.h, s: color.s, l: color.l })
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    handleColorWheelClick(e)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleColorWheelClick(e)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Calculate cursor position based on current HSL values
  const getCursorPosition = () => {
    const wheelSize = 320 // w-80 h-80 = 320px
    const centerX = wheelSize / 2
    const centerY = wheelSize / 2
    const radius = wheelSize / 2 - 8
    
    const angle = (hsl.h - 90) * (Math.PI / 180)
    const distance = (hsl.s / 100) * radius
    
    const x = centerX + distance * Math.cos(angle)
    const y = centerY + distance * Math.sin(angle)
    
    return {
      left: `${x - 8}px`, // Center the 16px cursor
      top: `${y - 8}px`
    }
  }

  // Slider handlers
  const handleSliderChange = (type: 'hue' | 'saturation' | 'lightness', value: number) => {
    let newHsl = { ...hsl }
    
    switch (type) {
      case 'hue':
        newHsl.h = Math.max(0, Math.min(360, value))
        break
      case 'saturation':
        newHsl.s = Math.max(0, Math.min(100, value))
        break
      case 'lightness':
        newHsl.l = Math.max(0, Math.min(100, value))
        break
    }
    
    setHsl(newHsl)
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l)
    setRgb(newRgb)
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b).toUpperCase())
  }

  const handleSliderMouseDown = (type: 'hue' | 'saturation' | 'lightness') => {
    setIsDraggingSlider(type)
  }

  const handleSliderMouseMove = (e: React.MouseEvent<HTMLDivElement>, type: 'hue' | 'saturation' | 'lightness') => {
    if (isDraggingSlider === type) {
      const rect = e.currentTarget.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(100, ((rect.bottom - e.clientY) / rect.height) * 100))
      
      if (type === 'hue') {
        handleSliderChange('hue', (percentage / 100) * 360)
      } else {
        handleSliderChange(type as 'saturation' | 'lightness', percentage)
      }
    }
  }

  const handleSliderMouseUp = () => {
    setIsDraggingSlider(null)
  }

  // Copy and history functions
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const addToHistory = (color: string) => {
    setColorHistory(prev => {
      const newHistory = [color, ...prev.filter(c => c !== color)].slice(0, 10)
      return newHistory
    })
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0f141a]">
      <Header title="Color Converter" />
      
      <div className="px-8 pb-8 space-y-8">
        {/* Converter Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Color Wheel Section */}
          <div className="space-y-6">
            {/* Color Wheel */}
            <div className="flex items-center justify-center">
              <div 
                className="w-80 h-80 relative cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 via-purple-500 to-red-500"></div>
                <div className="absolute inset-4 rounded-full bg-gradient-to-t from-black via-transparent to-white"></div>
                <div 
                  className={`absolute w-4 h-4 bg-white border-2 border-white rounded-full shadow-lg transition-all duration-75 ${isDragging ? 'scale-125' : 'scale-100'}`}
                  style={getCursorPosition()}
                ></div>
              </div>
            </div>

            {/* HSL Sliders */}
            <div className="space-y-4">
              {/* Hue Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-400">Hue</label>
                  <span className="text-sm text-slate-300 font-mono">{hsl.h}°</span>
                </div>
                <div 
                  className="relative h-8 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      hsl(0, 100%, 50%), 
                      hsl(60, 100%, 50%), 
                      hsl(120, 100%, 50%), 
                      hsl(180, 100%, 50%), 
                      hsl(240, 100%, 50%), 
                      hsl(300, 100%, 50%), 
                      hsl(360, 100%, 50%))`
                  }}
                  onMouseDown={() => handleSliderMouseDown('hue')}
                  onMouseMove={(e) => handleSliderMouseMove(e, 'hue')}
                  onMouseUp={handleSliderMouseUp}
                  onMouseLeave={handleSliderMouseUp}
                >
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-800 rounded-full shadow-md"
                    style={{ left: `${(hsl.h / 360) * 100}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                  ></div>
                </div>
              </div>

              {/* Saturation Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-400">Saturation</label>
                  <span className="text-sm text-slate-300 font-mono">{hsl.s}%</span>
                </div>
                <div 
                  className="relative h-8 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      hsl(${hsl.h}, 0%, ${hsl.l}%), 
                      hsl(${hsl.h}, 100%, ${hsl.l}%))`
                  }}
                  onMouseDown={() => handleSliderMouseDown('saturation')}
                  onMouseMove={(e) => handleSliderMouseMove(e, 'saturation')}
                  onMouseUp={handleSliderMouseUp}
                  onMouseLeave={handleSliderMouseUp}
                >
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-800 rounded-full shadow-md"
                    style={{ left: `${hsl.s}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                  ></div>
                </div>
              </div>

              {/* Lightness Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-400">Lightness</label>
                  <span className="text-sm text-slate-300 font-mono">{hsl.l}%</span>
                </div>
                <div 
                  className="relative h-8 rounded-lg cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      hsl(${hsl.h}, ${hsl.s}%, 0%), 
                      hsl(${hsl.h}, ${hsl.s}%, 50%), 
                      hsl(${hsl.h}, ${hsl.s}%, 100%))`
                  }}
                  onMouseDown={() => handleSliderMouseDown('lightness')}
                  onMouseMove={(e) => handleSliderMouseMove(e, 'lightness')}
                  onMouseUp={handleSliderMouseUp}
                  onMouseLeave={handleSliderMouseUp}
                >
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-800 rounded-full shadow-md"
                    style={{ left: `${hsl.l}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Input Fields */}
          <div className="space-y-6">
            {/* Hex Input with Copy */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-400">Hex</label>
                <button
                  onClick={() => copyToClipboard(hex, 'hex')}
                  className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                >
                  {copied === 'hex' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <Input
                value={hex}
                onChange={(e) => handleHexChange(e.target.value)}
                className="bg-[#1e2631] border-slate-700"
              />
            </div>

            {/* RGB Inputs with Copy */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-400">RGB</label>
                <button
                  onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb')}
                  className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                >
                  {copied === 'rgb' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  value={rgb.r}
                  onChange={(e) => handleRgbChange('r', e.target.value)}
                  className="bg-[#1e2631] border-slate-700 text-center"
                  placeholder="R"
                />
                <Input
                  value={rgb.g}
                  onChange={(e) => handleRgbChange('g', e.target.value)}
                  className="bg-[#1e2631] border-slate-700 text-center"
                  placeholder="G"
                />
                <Input
                  value={rgb.b}
                  onChange={(e) => handleRgbChange('b', e.target.value)}
                  className="bg-[#1e2631] border-slate-700 text-center"
                  placeholder="B"
                />
              </div>
            </div>

            {/* HSL Inputs with Copy */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-400">HSL</label>
                <button
                  onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'hsl')}
                  className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                >
                  {copied === 'hsl' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  value={hsl.h}
                  onChange={(e) => handleHslChange('h', e.target.value)}
                  className="bg-[#1e2631] border-slate-700 text-center"
                  placeholder="H"
                />
                <Input
                  value={hsl.s}
                  onChange={(e) => handleHslChange('s', e.target.value)}
                  className="bg-[#1e2631] border-slate-700 text-center"
                  placeholder="S"
                />
                <Input
                  value={hsl.l}
                  onChange={(e) => handleHslChange('l', e.target.value)}
                  className="bg-[#1e2631] border-slate-700 text-center"
                  placeholder="L"
                />
              </div>
            </div>

            {/* Color Preview */}
            <div>
              <label className="text-sm font-medium text-slate-400 mb-2">Preview</label>
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-lg border-2 border-slate-600 shadow-inner"
                  style={{ backgroundColor: hex }}
                ></div>
                <div className="flex-1 space-y-2">
                  <div className="text-sm text-slate-400">
                    <span className="font-mono">{hex}</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    <span className="font-mono">rgb({rgb.r}, {rgb.g}, {rgb.b})</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    <span className="font-mono">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color History */}
        <Card>
          <h3 className="text-white font-semibold mb-4 text-xl">Color History</h3>
          <div className="flex flex-wrap gap-2">
            {colorHistory.map((color, index) => (
              <button
                key={index}
                onClick={() => handleHexChange(color)}
                className="w-12 h-12 rounded-lg border-2 border-slate-600 hover:border-slate-500 transition-colors shadow-inner"
                style={{ backgroundColor: color }}
                title={color}
              >
                <span className="sr-only">{color}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Accessibility Check */}
        <Card>
          <h3 className="text-white font-semibold mb-4 text-xl">Accessibility (WCAG)</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] bg-black border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold" style={{ color: hex }}>
                  {calculateContrastRatio([rgb.r, rgb.g, rgb.b], [0, 0, 0]).toFixed(1)}:1
                </span>
                <div className="flex items-center space-x-1 font-bold">
                  {calculateContrastRatio([rgb.r, rgb.g, rgb.b], [0, 0, 0]) >= 7 ? (
                    <>
                      <span className="text-green-500">AAA</span>
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </>
                  ) : calculateContrastRatio([rgb.r, rgb.g, rgb.b], [0, 0, 0]) >= 4.5 ? (
                    <>
                      <span className="text-yellow-500">AA</span>
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span className="text-red-500">FAIL</span>
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </div>
              </div>
              <p className="text-slate-500 text-sm mt-4">Against black background</p>
            </div>
            <div className="flex-1 min-w-[200px] bg-white rounded-xl p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold" style={{ color: hex }}>
                  {calculateContrastRatio([rgb.r, rgb.g, rgb.b], [255, 255, 255]).toFixed(1)}:1
                </span>
                <div className="flex items-center space-x-1 font-bold">
                  {calculateContrastRatio([rgb.r, rgb.g, rgb.b], [255, 255, 255]) >= 7 ? (
                    <>
                      <span className="text-green-500">AAA</span>
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </>
                  ) : calculateContrastRatio([rgb.r, rgb.g, rgb.b], [255, 255, 255]) >= 4.5 ? (
                    <>
                      <span className="text-yellow-500">AA</span>
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span className="text-red-500">FAIL</span>
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-4">Against white background</p>
            </div>
          </div>
        </Card>

        {/* Related Colors */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-8">Related Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Shades */}
            <div>
              <h4 className="text-slate-400 mb-4 text-sm font-medium uppercase">Shades</h4>
              <div className="flex rounded-lg overflow-hidden h-12">
                {generateShades().map((shade, index) => (
                  <div key={index} className="flex-1" style={{ backgroundColor: shade }}></div>
                ))}
              </div>
            </div>

            {/* Tints */}
            <div>
              <h4 className="text-slate-400 mb-4 text-sm font-medium uppercase">Tints</h4>
              <div className="flex rounded-lg overflow-hidden h-12">
                {generateTints().map((tint, index) => (
                  <div key={index} className="flex-1" style={{ backgroundColor: tint }}></div>
                ))}
              </div>
            </div>

            {/* Complementary */}
            <div>
              <h4 className="text-slate-400 mb-4 text-sm font-medium uppercase">Complementary</h4>
              <div className="flex rounded-lg overflow-hidden h-12">
                {generateComplementary().map((comp, index) => (
                  <div key={index} className="flex-1" style={{ backgroundColor: comp }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ColorConverter
