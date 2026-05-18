import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import useAuthStore from '../store/useAuthStore';

export default function AiAgentChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Merhaba! Ben Kariyer Asistanın. Sana nasıl yardımcı olabilirim? Örneğin *"İstanbul\'da uzaktan çalışabileceğim yazılım ilanlarını bul"* diyebilirsin.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const payload = { message: userMessage };
      if (user) {
        payload.userId = user.id; // Eğer giriş yapmışsa backend'e ID'sini gönderiyoruz
      }
      
      // Ocelot üzerinden Chat endpointine istek atılıyor
      const { data } = await axiosClient.post('/api/v1/chat', payload);
      
      // Backend'den dönen response değerini ekle
      setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (error) {
      console.error("Chat API Hatası:", error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Üzgünüm, şu an bağlantı kuramıyorum. Lütfen biraz sonra tekrar deneyin.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { role: 'ai', content: 'Sohbet temizlendi. Yeni bir arama yapmak için yazabilirsin.' }
    ]);
  };

  return (
    <>
      {/* 1. Floating Action Button (FAB) */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-blue-700 hover:scale-110 transition-transform duration-300 z-50 animate-bounce"
        >
          {/* Robot / AI Icon */}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        </button>
      )}

      {/* 2. Chat Window */}
      <div className={`fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex justify-between items-center text-white shadow-md z-10">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Kariyer Asistanı</h3>
              <p className="text-xs text-blue-100 font-medium">Yapay Zeka Destekli</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={clearChat} title="Sohbeti Temizle" className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
            <button onClick={() => setIsOpen(false)} title="Kapat" className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        {/* 3. Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                {msg.role === 'user' ? (
                  <p className="text-[15px]">{msg.content}</p>
                ) : (
                  <div className="text-[15px] prose prose-sm prose-blue max-w-none">
                    {/* ReactMarkdown ile AI'nin ürettiği Markdown formatlı metinleri ve linkleri işliyoruz */}
                    <ReactMarkdown
                      components={{
                        a: ({node, ...props}) => {
                          // Eğer link /job ile başlıyorsa Router Link'ine çevir, pencereyi kapatıp sayfaya git
                          if (props.href && props.href.startsWith('/job')) {
                            return <Link to={props.href} className="text-blue-600 font-bold underline hover:text-blue-800" onClick={() => setIsOpen(false)}>{props.children}</Link>;
                          }
                          return <a {...props} className="text-blue-600 font-bold underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">{props.children}</a>;
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Düşünüyor Efekti */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-2 text-gray-500 text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="font-medium ml-1">Asistan düşünüyor...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-200">
          <form onSubmit={handleSend} className="flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hayalinizdeki işi asistanla arayın..."
              className="flex-1 bg-gray-100 text-gray-800 rounded-full px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border-none placeholder-gray-400"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="ml-2 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-md"
            >
              <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </form>
        </div>

      </div>
    </>
  );
}
