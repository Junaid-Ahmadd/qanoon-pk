'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  UploadCloud, 
  Send, 
  Lock, 
  Unlock, 
  FileUp, 
  Sparkles, 
  Plus, 
  Search, 
  Scale, 
  MessageSquare,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ConsoleClient() {
  const [session, setSession] = useState('');
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [activeScope, setActiveScope] = useState(null); // { subcategory, category }
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  
  // Upload modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(''); // 'idle', 'uploading', 'analyzing', 'success', 'error'
  const [uploadError, setUploadError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const messagesEndRef = useRef(null);

  // Initialize session and fetch documents
  useEffect(() => {
    // Generate unique session id
    let sess = localStorage.getItem('qanoon_session_id');
    if (!sess) {
      sess = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('qanoon_session_id', sess);
    }
    setSession(sess);
    fetchDocuments(sess);
  }, []);

  const fetchDocuments = async (sessId) => {
    try {
      // Get all approved documents
      const { data, error } = await supabase
        .from('community_documents')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
      groupCategories(data || []);

      // If session exists, load messages
      if (sessId) {
        const { data: msgs, error: msgError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessId)
          .order('created_at', { ascending: true });
        
        if (!msgError && msgs) {
          setMessages(msgs);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const groupCategories = (docs) => {
    const groups = {};
    docs.forEach(doc => {
      const cat = doc.category || 'Uncategorized';
      const subcat = doc.subcategory || 'General';
      if (!groups[cat]) groups[cat] = {};
      if (!groups[cat][subcat]) groups[cat][subcat] = [];
      groups[cat][subcat].push(doc);
    });
    setCategories(groups);
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  // Handle File Upload & Gemini Moderation
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadStatus('uploading');
    setUploadError('');
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      setUploadStatus('analyzing');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Server error uploading file');
      }

      if (data.status === 'approved') {
        setUploadStatus('success');
        setAnalysisResult(data.analysis);
        // Refresh directory
        fetchDocuments(session);
      } else {
        setUploadStatus('error');
        setUploadError(data.message || 'File rejected by legal gatekeeper.');
      }
    } catch (err) {
      setUploadStatus('error');
      setUploadError(err.message || 'Connection error.');
    }
  };

  // Handle Send Message & Streaming Response
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatLoading(true);
    setStreamingText('');

    // Append user message locally immediately
    const tempUserMsg = { id: Date.now().toString(), role: 'user', content: userMessage };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: session,
          subcategory_scope: activeScope ? activeScope.subcategory : null
        })
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        setStreamingText(fullText);
      }

      // Add model message to history state
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: fullText }]);
      setStreamingText('');
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: 'Advocate connection error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const clearChatHistory = async () => {
    if (!confirm('Clear all conversation history?')) return;
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', session);
      if (!error) setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      
      {/* 1. Left Panel: Accoridon Directory */}
      <aside className="w-full md:w-80 border-r border-gray-200 bg-white flex flex-col justify-between flex-shrink-0 h-1/2 md:h-full">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3 text-[#1a5c38]">
            <Scale className="w-5 h-5" />
            <h2 className="font-bold text-sm uppercase tracking-wider">Document Directory</h2>
          </div>
          <p className="text-xs text-gray-500">Punjab Legal Act Repository. Browse files and lock context.</p>
        </div>

        {/* Categories list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {Object.keys(categories).length > 0 ? (
            Object.keys(categories).map((cat) => {
              const isExpanded = !!expandedCategories[cat];
              return (
                <div key={cat} className="space-y-1.5">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <Folder className="w-4 h-4 text-amber-500" />}
                      <span>{cat}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      ({Object.keys(categories[cat]).length} subs)
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="pl-4 border-l border-gray-100 ml-4 space-y-2">
                      {Object.keys(categories[cat]).map((subcat) => {
                        const isLocked = activeScope?.subcategory === subcat;
                        return (
                          <div key={subcat} className="space-y-1">
                            <button
                              onClick={() => setActiveScope(isLocked ? null : { subcategory: subcat, category: cat })}
                              className={`w-full flex items-center justify-between text-xs p-1.5 rounded transition-all ${
                                isLocked 
                                  ? 'bg-green-50 text-[#1a5c38] font-bold border-l-2 border-[#1a5c38] pl-2' 
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Plus className={`w-3 h-3 transition-transform ${isLocked ? 'rotate-45' : ''}`} />
                                <span>{subcat}</span>
                              </div>
                              <span className="text-[10px] text-gray-400">({categories[cat][subcat].length} docs)</span>
                            </button>

                            {/* Render matching approved PDF documents */}
                            <div className="pl-4 space-y-1 pt-1">
                              {categories[cat][subcat].map(doc => (
                                <a
                                  key={doc.id}
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-[#1a5c38] p-1 rounded hover:bg-green-50/50 transition-all truncate"
                                  title={doc.summary}
                                >
                                  <FileText className="w-3 h-3 text-red-400 flex-shrink-0" />
                                  <span className="truncate">{doc.title || 'Untitled file'}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs">
              No approved documents yet. Upload a Bare Act below to seed!
            </div>
          )}
        </div>

        {/* Directory bottom actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
          <button
            onClick={() => setUploadOpen(true)}
            className="w-full bg-[#1a5c38] hover:bg-[#145030] text-white text-xs py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Bare Act / Law PDF</span>
          </button>
        </div>
      </aside>

      {/* 2. Right Panel: Dynamic grounded Chat Workspace */}
      <section className="flex-1 flex flex-col h-1/2 md:h-full bg-white relative">
        {/* Workspace Active Scope Header */}
        <header className="border-b border-gray-200 py-3 px-4 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${activeScope ? 'bg-green-50 text-[#1a5c38]' : 'bg-gray-100 text-gray-600'}`}>
              {activeScope ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800">Context Lock</h3>
              <p className="text-xs text-gray-500">
                {activeScope 
                  ? `Locked Context: ${activeScope.category} ➔ ${activeScope.subcategory}`
                  : 'Chatting across all legal databases (Punjab High Court Advocate AI)'
                }
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {activeScope && (
              <button 
                onClick={() => setActiveScope(null)}
                className="text-[10px] text-red-600 hover:text-red-800 font-semibold uppercase tracking-wider border border-red-200 bg-red-50/50 px-2 py-1 rounded"
              >
                Clear Scope
              </button>
            )}
            <button
              onClick={clearChatHistory}
              className="text-[10px] text-gray-400 hover:text-gray-600 font-semibold uppercase tracking-wider px-2 py-1"
            >
              Clear Chat
            </button>
          </div>
        </header>

        {/* Chat History Panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.length === 0 && !chatLoading && (
            <div className="max-w-md mx-auto text-center py-16 space-y-4">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-[#1a5c38] mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-800 text-sm">Ask a question regarding Punjab Laws</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Provide a session query or lock context to a subcategory. The advocate AI will answer grounded strictly on the approved repository files.
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                msg.role === 'user' ? 'bg-[#1a5c38] text-white' : 'bg-white border border-gray-200 text-gray-700'
              }`}>
                {msg.role === 'user' ? 'U' : 'AI'}
              </div>
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-[#1a5c38] text-white rounded-tr-none' 
                  : 'bg-white border border-gray-100 text-gray-700 shadow-sm rounded-tl-none whitespace-pre-wrap'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Streaming Assistant Response */}
          {streamingText && (
            <div className="flex gap-3 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center text-xs flex-shrink-0">
                AI
              </div>
              <div className="p-3.5 rounded-2xl text-xs leading-relaxed bg-white border border-gray-100 text-gray-700 shadow-sm rounded-tl-none whitespace-pre-wrap">
                {streamingText}
              </div>
            </div>
          )}

          {/* Chat Loader */}
          {chatLoading && !streamingText && (
            <div className="flex gap-3 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center text-xs flex-shrink-0">
                AI
              </div>
              <div className="p-3 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-[#1a5c38] animate-spin" />
                <span className="text-xs text-gray-400">Consulting documents...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Form */}
        <div className="p-3 border-t border-gray-200 bg-white z-10">
          <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={activeScope 
                ? `Ask a question grounded inside "${activeScope.subcategory}"...`
                : "Ask a question (e.g. Served notice period in Punjab)..."
              }
              className="flex-grow border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-gray-900"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="bg-[#1a5c38] hover:bg-[#145030] disabled:bg-gray-400 text-white rounded-xl px-4 py-2 flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* 3. Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
                <FileUp className="w-4 h-4 text-[#1a5c38]" />
                <span>Upload Punjab Legal Document</span>
              </div>
              <button 
                onClick={() => {
                  setUploadOpen(false);
                  setUploadStatus('idle');
                  setUploadFile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              {uploadStatus === 'idle' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2 hover:border-[#1a5c38]/40 transition-colors">
                    <UploadCloud className="w-10 h-10 text-gray-300" />
                    <label className="cursor-pointer block">
                      <span className="bg-green-50 text-[#1a5c38] font-bold text-xs px-3 py-1.5 rounded-lg border border-green-100 hover:bg-green-100/50 transition-all">
                        Browse Files
                      </span>
                      <input 
                        type="file" 
                        accept="application/pdf,image/*" 
                        className="hidden" 
                        onChange={(e) => setUploadFile(e.target.files[0])} 
                      />
                    </label>
                    <span className="text-[10px] text-gray-400">PDF or Image up to 10MB</span>
                  </div>

                  {uploadFile && (
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex items-center gap-3">
                      <FileText className="w-6 h-6 text-red-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 truncate">{uploadFile.name}</p>
                        <p className="text-[10px] text-gray-400">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setUploadFile(null)}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!uploadFile}
                    className="w-full bg-[#1a5c38] hover:bg-[#145030] disabled:bg-gray-300 text-white text-xs py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Analyze & Add to Directory</span>
                  </button>
                </div>
              )}

              {/* Progress states */}
              {(uploadStatus === 'uploading' || uploadStatus === 'analyzing') && (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-[#1a5c38] animate-spin" />
                  <p className="text-xs font-bold text-gray-700">
                    {uploadStatus === 'uploading' ? 'Uploading file to Supabase...' : 'AI Moderator checking legal contents...'}
                  </p>
                  <p className="text-[10px] text-gray-400 max-w-[250px] leading-relaxed">
                    Agent 1 (The Gatekeeper) is extracting subcategories, validating jurisdiction (Punjab), and writing index.
                  </p>
                </div>
              )}

              {/* Success state */}
              {uploadStatus === 'success' && analysisResult && (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-2 text-green-700 font-bold text-xs bg-green-50 border border-green-100 p-2.5 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Document Approved & Indexed Successfully!</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">Extracted Title</span>
                      <p className="text-gray-800 font-medium">{analysisResult.title}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Category</span>
                        <p className="text-gray-800 font-medium">{analysisResult.category}</p>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Subcategory</span>
                        <p className="text-gray-800 font-medium">{analysisResult.subcategory}</p>
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">Summary</span>
                      <p className="text-gray-600 leading-relaxed">{analysisResult.summary}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadOpen(false);
                      setUploadFile(null);
                      setUploadStatus('idle');
                    }}
                    className="w-full bg-[#1a5c38] hover:bg-[#145030] text-white text-xs py-2 px-4 rounded-xl font-bold"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Error state */}
              {uploadStatus === 'error' && (
                <div className="space-y-4 py-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-xs">Validation Failed</h4>
                  <p className="text-xs text-gray-500 px-4 leading-relaxed">{uploadError}</p>

                  <button
                    type="button"
                    onClick={() => setUploadStatus('idle')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 px-4 rounded-xl font-bold"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
