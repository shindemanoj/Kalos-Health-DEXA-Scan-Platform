import { useState, useRef, useEffect } from 'react';
import api from './lib/api';

const SUGGESTED_QUESTIONS = [
  "How has Marcus's body fat trended over the last year?",
  "Which members have lost lean mass between their last two scans?",
  "Who has the highest visceral fat score right now?",
  "How many members have had 3+ scans?",
  "What should I focus on in my next session with Priya?",
  "Compare Jordan's progress over their last 3 scans.",
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5
        ${isUser ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {isUser ? 'C' : 'AI'}
        </div>
        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
        ${isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'}`}>
          {msg.content}
        </div>
      </div>
  );
}

function TypingIndicator() {
  return (
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
          AI
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="flex gap-1 items-center h-4">
            {[0, 1, 2].map(i => (
                <div
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                />
            ))}
          </div>
        </div>
      </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm MemberGPT — I have access to all member DEXA scan data. Ask me anything about a member's progress, trends, or what to focus on in your next coaching session.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    // Fetch member list for the filter dropdown (no auth needed per spec)
    api.get('/members').then(({ data }) => setMembers(data.members)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text) {
    const content = text || input.trim();
    if (!content || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const { data } = await api.post('/scans/chat', {
        message: content,
        member_id: selectedMember || undefined,
        history: history.slice(0, -1), // exclude the message we just added
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
      <div className="h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Kalos</h1>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">MemberGPT</span>
          </div>
          {/* Member filter */}
          <select
              value={selectedMember}
              onChange={e => setSelectedMember(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All members</option>
            {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.scan_count} scan{m.scan_count !== 1 ? 's' : ''})
                </option>
            ))}
          </select>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 max-w-3xl w-full mx-auto">
          {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions — shown when only welcome message */}
        {messages.length === 1 && !loading && (
            <div className="px-4 sm:px-6 pb-3 max-w-3xl w-full mx-auto">
              <p className="text-xs text-gray-400 mb-2 font-medium">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map(q => (
                    <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                      {q}
                    </button>
                ))}
              </div>
            </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-gray-100 px-4 sm:px-6 py-4 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any member's scan data…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 leading-relaxed"
              style={{ maxHeight: 120, overflowY: 'auto' }}
          />
            <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="bg-indigo-600 text-white rounded-xl px-4 py-2.5 hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-gray-300 mt-2">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
  );
}
