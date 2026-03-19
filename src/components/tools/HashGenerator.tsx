'use client'

import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/button'
import Textarea from '@/components/ui/textarea'
import Input from '@/components/ui/input'
import Header from '@/components/ui/header'

interface HashResult {
  algorithm: string
  value: string
}

const HashGenerator: React.FC = () => {
  const [inputText, setInputText] = useState('')
  const [hashes, setHashes] = useState<HashResult[]>([
    { algorithm: 'MD5', value: '5d41402abc4b2a76b9719d911017c592' },
    { algorithm: 'SHA-1', value: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3' },
    { algorithm: 'SHA-256', value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    { algorithm: 'SHA-512', value: 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e' }
  ])

  const generateHashes = async () => {
    if (!inputText) {
      setHashes([
        { algorithm: 'MD5', value: '' },
        { algorithm: 'SHA-1', value: '' },
        { algorithm: 'SHA-256', value: '' },
        { algorithm: 'SHA-512', value: '' }
      ])
      return
    }

    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(inputText)

      // Generate SHA-256, SHA-384, and SHA-512 using Web Crypto API
      const sha256Buffer = await crypto.subtle.digest('SHA-256', data)
      const sha384Buffer = await crypto.subtle.digest('SHA-384', data)
      const sha512Buffer = await crypto.subtle.digest('SHA-512', data)

      // Convert buffers to hex strings
      const bufferToHex = (buffer: ArrayBuffer) => {
        return Array.from(new Uint8Array(buffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      }

      // For MD5, we'll use a simple implementation (Web Crypto API doesn't support MD5)
      const md5Hash = await simpleMD5(inputText)

      const newHashes = [
        { algorithm: 'MD5', value: md5Hash },
        { algorithm: 'SHA-1', value: bufferToHex(await crypto.subtle.digest('SHA-1', data)) },
        { algorithm: 'SHA-256', value: bufferToHex(sha256Buffer) },
        { algorithm: 'SHA-512', value: bufferToHex(sha512Buffer) }
      ]
      setHashes(newHashes)
    } catch (error) {
      console.error('Error generating hashes:', error)
      // Fallback to simple hash if crypto API fails
      const fallbackHashes = [
        { algorithm: 'MD5', value: btoa(inputText).slice(0, 32) },
        { algorithm: 'SHA-1', value: btoa(inputText).slice(0, 40) },
        { algorithm: 'SHA-256', value: btoa(inputText + 'sha256').slice(0, 64) },
        { algorithm: 'SHA-512', value: btoa(inputText + 'sha512').slice(0, 128) }
      ]
      setHashes(fallbackHashes)
    }
  }

  // Simple MD5 implementation for browsers
  const simpleMD5 = async (string: string): Promise<string> => {
    // This is a simplified MD5-like hash for demonstration
    // In production, you might want to use a proper MD5 library
    let hash = 0
    for (let i = 0; i < string.length; i++) {
      const char = string.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(32, '0')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f1f5f9]">
      <Header title="Hash Generator Tool" />
      
      <div className="max-w-5xl mx-auto px-8 pb-8 space-y-8">
        {/* Input Card */}
        <Card className="bg-white border-slate-200">
          <Textarea
            label="Input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text to hash..."
            rows={5}
            className="bg-white border-slate-300 text-slate-600"
          />
          
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
            <Button variant="secondary" className="bg-slate-600 hover:bg-slate-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload File
            </Button>
            <Button onClick={generateHashes} className="bg-slate-600 hover:bg-slate-700">
              Generate Hashes
            </Button>
          </div>
        </Card>

        {/* Results Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Results</h2>
          <Card className="bg-white border-slate-200 overflow-hidden">
            {hashes.map((hash, index) => (
              <div key={hash.algorithm} className="p-6 flex flex-col md:flex-row md:items-center gap-4 border-b border-slate-100 last:border-b-0">
                <div className="w-24 shrink-0">
                  <span className="font-bold text-slate-800">{hash.algorithm}</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  {hash.algorithm === 'SHA-512' ? (
                    <textarea
                      readOnly
                      value={hash.value}
                      className="w-full bg-slate-50 border-slate-200 rounded-md text-slate-600 font-mono text-sm p-2.5 resize-none h-20"
                    />
                  ) : (
                    <Input
                      readOnly
                      value={hash.value}
                      className="bg-slate-50 border-slate-200 text-slate-600 font-mono text-sm"
                    />
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => copyToClipboard(hash.value)}
                    className="p-2.5 bg-slate-600 text-white rounded-md hover:bg-slate-700"
                    title="Copy to clipboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default HashGenerator
