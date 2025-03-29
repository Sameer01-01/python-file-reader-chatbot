import { useState } from 'react'
import axios from 'axios'

export default function ChatInterface() {
  const [file, setFile] = useState(null)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = (e) => {
    setFile(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !question) return

    setIsLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('question', question)

    try {
      const response = await axios.post('http://localhost:5000/ask', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      })
      
      setMessages(prev => [
        ...prev,
        { type: 'question', content: question },
        { type: 'answer', content: response.data.answer }
      ])
      setQuestion('')
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { 
        type: 'error', 
        content: error.response?.data?.error || 'Error getting response' 
      }])
    }
    setIsLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <input 
          type="file" 
          accept=".pdf,.txt,.xls,.xlsx,.png,.jpg,.jpeg"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <p className="mt-2 text-sm text-gray-500">
          Supported formats: PDF, TXT, Excel (XLS/XLSX), Images (PNG/JPG)
        </p>
      </div>

      <div className="mb-6 h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-4 ${msg.type === 'question' ? 'text-right' : ''}`}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.type === 'question' 
                ? 'bg-blue-600 text-white' 
                : msg.type === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-200 text-gray-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-center text-gray-500">Processing...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the document..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          Ask
        </button>
      </form>
    </div>
  )
}