'use client'

import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Header from '@/components/ui/header'

const JWTDebugger: React.FC = () => {
  const [encodedToken, setEncodedToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjIsInJvbGUiOiJhZG1pbiJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
  const [secretKey, setSecretKey] = useState('')
  const [signatureVerified, setSignatureVerified] = useState<boolean | null>(null)
  const [decodedHeader, setDecodedHeader] = useState<any>(null)
  const [decodedPayload, setDecodedPayload] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const decodeJWT = (token: string) => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format')
      }

      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      
      return { header, payload, signature: parts[2] }
    } catch (err) {
      throw new Error('Failed to decode JWT: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleDecode = () => {
    try {
      setError(null)
      const { header, payload } = decodeJWT(encodedToken)
      setDecodedHeader(header)
      setDecodedPayload(payload)
      setSignatureVerified(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decode token')
      setDecodedHeader(null)
      setDecodedPayload(null)
    }
  }

  const verifySignature = async () => {
    if (!secretKey) {
      setError('Secret key is required for verification')
      return
    }

    try {
      setError(null)
      const parts = encodedToken.split('.')
      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      
      // Create the signature base
      const signatureBase = `${parts[0]}.${parts[1]}`
      
      // Import the secret key
      const encoder = new TextEncoder()
      const keyData = encoder.encode(secretKey)
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
      )
      
      // Verify the signature
      const signature = atob(parts[2])
      const signatureBuffer = new Uint8Array(Array.from(signature).map(c => c.charCodeAt(0)))
      
      const isValid = await crypto.subtle.verify(
        'HMAC',
        cryptoKey,
        signatureBuffer,
        encoder.encode(signatureBase)
      )
      
      setSignatureVerified(isValid)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify signature')
      setSignatureVerified(false)
    }
  }

  const handleVerify = () => {
    verifySignature()
  }

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toISOString()
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0f172a]">
      <Header title="JWT Debugger" />
      
      <div className="p-8 space-y-8">
        {/* Three-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
          {/* Encoded Column */}
          <Card className="flex flex-col bg-[#1e293b] border-slate-700">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3">
              <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
              <h3 className="font-medium text-white">Encoded</h3>
            </div>
            <div className="flex-1 flex flex-col p-4 space-y-4">
              <textarea
                value={encodedToken}
                onChange={(e) => setEncodedToken(e.target.value)}
                className="flex-1 bg-[#0f172a] rounded border border-teal-500 p-3 font-mono text-sm break-all overflow-y-auto custom-scrollbar resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="Enter JWT token..."
                rows={6}
              />
              <Button 
                onClick={handleDecode}
                className="w-full bg-[#1e293b] border border-slate-600 hover:bg-slate-700"
              >
                Decode
              </Button>
            </div>
          </Card>

          {/* Decoded Header Column */}
          <Card className="flex flex-col bg-[#1e293b] border-slate-700">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3">
              <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
              <h3 className="font-medium text-white">Decoded Header</h3>
            </div>
            <div className="flex-1 bg-[#0f172a] p-4 font-mono text-sm overflow-y-auto custom-scrollbar relative">
              {decodedHeader ? (
                <pre className="text-slate-300">
                  {formatJSON(decodedHeader)}
                </pre>
              ) : (
                <div className="text-slate-500 text-center py-8">
                  Click "Decode" to view header
                </div>
              )}
            </div>
          </Card>

          {/* Decoded Payload Column */}
          <Card className="flex flex-col bg-[#1e293b] border-slate-700">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3">
              <div className="w-1 h-5 bg-green-500 rounded-full"></div>
              <h3 className="font-medium text-white">Decoded Payload</h3>
            </div>
            <div className="flex-1 bg-[#0f172a] p-4 font-mono text-sm overflow-y-auto custom-scrollbar relative">
              {decodedPayload ? (
                <div>
                  <pre className="text-slate-300">
                    {formatJSON(decodedPayload)}
                  </pre>
                  {decodedPayload.exp && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="text-xs text-slate-400">
                        <div>Expires: {formatTimestamp(decodedPayload.exp)}</div>
                        <div>Issued At: {formatTimestamp(decodedPayload.iat)}</div>
                        {decodedPayload.exp < Date.now() / 1000 && (
                          <div className="text-red-400 mt-2">⚠️ Token has expired</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 text-center py-8">
                  Click "Decode" to view payload
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Signature Verification Section */}
        <Card className="bg-[#1e293b] border-slate-700">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3">
            <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
            <h3 className="font-medium text-white">Verify Signature</h3>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Your-256-bit-secret
                  </label>
                  <Input
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Enter secret key..."
                    className="bg-[#0f172a] border-slate-700"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="base64-secret" className="w-4 h-4 bg-[#0f172a] border-slate-700 rounded text-teal-500" />
                  <label className="text-sm text-slate-400" htmlFor="base64-secret">
                    Secret base64 encoded
                  </label>
                </div>
                {signatureVerified !== null && (
                  <div className="pt-2">
                    <p className={`text-sm flex items-center gap-2 ${signatureVerified ? 'text-green-500' : 'text-red-500'}`}>
                      {signatureVerified ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      Signature {signatureVerified ? 'Verified' : 'Invalid'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleVerify} className="flex-1 bg-[#334155] hover:bg-[#475569]" disabled={!secretKey}>
                  Verify
                </Button>
                <Button variant="outline" className="flex-1 border-slate-600 hover:bg-slate-700">
                  Share Token
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default JWTDebugger
