'use client'

import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Header from '@/components/ui/header'

interface UserData {
  id: number
  username: string
  email: string
  roles: string[]
}

interface APIResponse {
  status: number
  statusText: string
  time: number
  size: string
  data: UserData | { error?: string }
}

const APITester: React.FC = () => {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1')
  const [response, setResponse] = useState<APIResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [headers, setHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }])
  const [body, setBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}')
  const [activeTab, setActiveTab] = useState('params')
  const [params, setParams] = useState([{ key: 'userId', value: '1' }])

  const methods = [
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'PATCH', label: 'PATCH' }
  ]

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSendRequest = async () => {
    setLoading(true)
    setResponse(null)
    
    const startTime = Date.now()
    
    try {
      // Build query parameters for GET requests
      let finalUrl = url
      if (method === 'GET' && params.length > 0) {
        const queryString = params
          .filter(p => p.key && p.value)
          .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
          .join('&')
        finalUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`
      }

      // Build headers
      const headersObj: Record<string, string> = {}
      headers.forEach(h => {
        if (h.key && h.value) {
          headersObj[h.key] = h.value
        }
      })

      const fetchOptions: RequestInit = {
        method,
        headers: headersObj
      }

      // Add body for POST, PUT, PATCH
      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        fetchOptions.body = body
      }

      const res = await fetch(finalUrl, fetchOptions)
      const endTime = Date.now()
      
      let responseData: any
      const contentType = res.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        responseData = await res.json()
      } else {
        responseData = await res.text()
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        time: endTime - startTime,
        size: formatSize(parseInt(res.headers.get('content-length') || '0')),
        data: responseData
      })
    } catch (error) {
      setResponse({
        status: 0,
        statusText: error instanceof Error ? error.message : 'Network Error',
        time: Date.now() - startTime,
        size: '0 Bytes',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setLoading(false)
    }
  }

  const addParam = () => {
    setParams([...params, { key: '', value: '' }])
  }

  const updateParam = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...params]
    newParams[index] = { ...newParams[index], [field]: value }
    setParams(newParams)
  }

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index))
  }

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }])
  }

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers]
    newHeaders[index] = { ...newHeaders[index], [field]: value }
    setHeaders(newHeaders)
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0f172a]">
      <Header title="API Tester Tool" />
      
      <div className="px-8 pb-8 space-y-6">
        {/* Request Section */}
        <Card>
          <div className="flex gap-4 mb-8 min-w-[20] justify-stretch">
            <div className="relative min-w-[120px]">
              <Select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                options={methods}
                className="bg-gray-800"
              />
            </div>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter API URL"
              className="flex-1"
            />
            <Button 
              onClick={handleSendRequest}
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? 'Sending...' : 'Send'}
            </Button>
          </div>

          {/* Request Tabs */}
          <div className="mb-4">
            <div className="flex space-x-2">
              <button 
                onClick={() => setActiveTab('params')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  activeTab === 'params' 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Params
              </button>
              <button 
                onClick={() => setActiveTab('headers')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  activeTab === 'headers' 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Headers
              </button>
              <button 
                onClick={() => setActiveTab('body')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  activeTab === 'body' 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Body
              </button>
              <button 
                onClick={() => setActiveTab('auth')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  activeTab === 'auth' 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Auth
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'params' && (
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-gray-900/50">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-800/80 text-slate-400 font-medium border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 w-1/3">Key</th>
                    <th className="px-4 py-3 w-1/3">Value</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {params.map((param, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={param.key}
                          onChange={(e) => updateParam(index, 'key', e.target.value)}
                          className="bg-transparent border-none text-white w-full focus:outline-none"
                          placeholder="Key"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) => updateParam(index, 'value', e.target.value)}
                          className="bg-transparent border-none text-white w-full focus:outline-none"
                          placeholder="Value"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeParam(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={addParam}
                className="m-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm"
              >
                Add Param
              </button>
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-gray-900/50">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-800/80 text-slate-400 font-medium border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 w-1/3">Key</th>
                    <th className="px-4 py-3 w-1/3">Value</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {headers.map((header, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={header.key}
                          onChange={(e) => updateHeader(index, 'key', e.target.value)}
                          className="bg-transparent border-none text-white w-full focus:outline-none"
                          placeholder="Header name"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={header.value}
                          onChange={(e) => updateHeader(index, 'value', e.target.value)}
                          className="bg-transparent border-none text-white w-full focus:outline-none"
                          placeholder="Header value"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeHeader(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={addHeader}
                className="m-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm"
              >
                Add Header
              </button>
            </div>
          )}

          {activeTab === 'body' && (
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-gray-900/50 p-4">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full h-32 bg-transparent border-none text-white focus:outline-none resize-none font-mono text-sm"
                placeholder="Request body (JSON, XML, etc.)"
              />
            </div>
          )}

          {activeTab === 'auth' && (
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-gray-900/50 p-4">
              <div className="text-slate-400 text-sm">
                Authentication options coming soon...
              </div>
            </div>
          )}
        </Card>

        {/* Response Section */}
        {response && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Response</h3>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <span className="text-slate-400 mr-2">Status:</span>
                  <span className="text-green-500 font-bold">{response.status} {response.statusText}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-slate-400 mr-2">Time:</span>
                  <span className="text-white">{response.time}ms</span>
                </div>
                <div className="flex items-center">
                  <span className="text-slate-400 mr-2">Size:</span>
                  <span className="text-white">{response.size}</span>
                </div>
              </div>
            </div>

            {/* Code Viewer */}
            <div className="bg-[#0f172a] rounded-lg p-6 border border-slate-700 font-mono text-sm leading-relaxed overflow-x-auto">
              {typeof response.data === 'object' && 'error' in response.data ? (
                <div className="text-red-400">
                  <div className="flex">
                    <div className="line-number text-slate-600 text-right pr-4 select-none">1</div>
                    <div className="text-white">{`{`}</div>
                  </div>
                  <div className="flex">
                    <div className="line-number text-slate-600 text-right pr-4 select-none">2</div>
                    <div className="pl-4">
                      <span className="text-blue-400">&#34;error&#34;</span>: <span className="text-orange-300">&#34;{response.data.error}&#34;</span>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="line-number text-slate-600 text-right pr-4 select-none">3</div>
                    <div className="text-white">{`}`}</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex">
                    <div className="line-number text-slate-600 text-right pr-4 select-none">1</div>
                    <div className="text-white">{`{`}</div>
                  </div>
                  <div className="flex">
                    <div className="line-number text-slate-600 text-right pr-4 select-none">2</div>
                    <div className="pl-4">
                      <span className="text-blue-400">&#34;id&#34;</span>: <span className="text-green-400">{(response.data as UserData)?.id}</span>,
                    </div>
                  </div>
                  <div className="flex">
                    <div className="line-number text-slate-600 text-right pr-4 select-none">3</div>
                    <div className="pl-4">
                      <span className="text-blue-400">&#34;username&#34;</span>: <span className="text-orange-300">&#34;{(response.data as UserData)?.username}&#34;</span>,
                    </div>
                  </div>
                  <div className="flex">
                    <div className="line-number text-slate-600 text-right pr-4 select-none">4</div>
                    <div className="pl-4">
                      <span className="text-blue-400">&#34;email&#34;</span>: <span className="text-orange-300">&#34;{(response.data as UserData)?.email}&#34;</span>,
                    </div>
                  </div>
                  <div className="flex">
                    <div className="line-number text-slate-600 text-right pr-4 select-none">5</div>
                    <div className="pl-4">
                      <span className="text-blue-400">&#34;roles&#34;</span>: [{(response.data as UserData)?.roles?.map((role: string) => `<span class="text-orange-300">"${role}"</span>`).join(', ')}]
                    </div>
                  </div>
                  <div className="flex">
                    <div className="line-number text-slate-600 text-right pr-4 select-none">6</div>
                    <div className="text-white">{`}`}</div>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default APITester
