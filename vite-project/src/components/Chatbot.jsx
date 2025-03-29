import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FileIcon, SendIcon, Loader2Icon, FileTextIcon, ImageIcon, XIcon } from 'lucide-react';

export default function ChatInterface() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !question.trim()) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('question', question);

    try {
      const response = await axios.post('http://localhost:5000/ask', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      });
      
      setMessages(prev => [
        ...prev,
        { type: 'question', content: question, timestamp: new Date() },
        { type: 'answer', content: response.data.answer, timestamp: new Date() }
      ]);
      setQuestion('');
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        type: 'error', 
        content: error.response?.data?.error || 'Error getting response',
        timestamp: new Date()
      }]);
    }
    setIsLoading(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    
    const fileType = file.type;
    if (fileType.includes('image')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    } else if (fileType.includes('pdf') || fileType.includes('text') || fileType.includes('excel')) {
      return <FileTextIcon className="w-5 h-5 text-blue-500" />;
    } else {
      return <FileIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTimestamp = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Document Chat Assistant</h1>
        
        <div 
          className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            isDragging ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300'
          } ${file ? 'bg-blue-50 border-blue-400' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!file ? (
            <div className="space-y-4">
              <FileIcon className="w-12 h-12 mx-auto text-blue-500 opacity-75" />
              <div>
                <p className="text-lg font-medium text-gray-700">Drag & drop a file or</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors duration-200"
                >
                  Browse files
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Supported formats: PDF, TXT, Excel (XLS/XLSX), Images (PNG/JPG)
              </p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf,.txt,.xls,.xlsx,.png,.jpg,.jpeg,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                {getFileIcon()}
                <div className="text-left">
                  <p className="font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button 
                onClick={removeFile} 
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          )}
        </div>
        
        <div 
          ref={chatContainerRef}
          className="mb-6 h-96 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <MessageIcon className="w-12 h-12 mb-3 opacity-50" />
              <p>Upload a document and ask questions to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.type === 'question' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div 
                    className={`max-w-3/4 p-3 rounded-2xl ${
                      msg.type === 'question' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : msg.type === 'error'
                        ? 'bg-red-100 text-red-800 rounded-tl-none'
                        : 'bg-white text-gray-800 shadow-sm rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className={`text-xs mt-1 ${
                      msg.type === 'question' ? 'text-blue-200' : 'text-gray-400'
                    }`}>
                      {formatTimestamp(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                    <Loader2Icon className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="text-gray-600">Processing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        <form 
          onSubmit={handleSubmit} 
          className="flex gap-3 items-center bg-gray-50 p-3 rounded-xl border border-gray-200"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the document..."
            className="flex-1 p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!file || isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !file || !question.trim()}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2Icon className="w-5 h-5 animate-spin" />
            ) : (
              <SendIcon className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const MessageIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);