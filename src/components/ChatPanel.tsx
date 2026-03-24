import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../hooks/useSocket';
import { Socket } from 'socket.io-client';

interface Props {
    socket: Socket | null;
    myId: string;
    messages: ChatMessage[];
}

export const ChatPanel: React.FC<Props> = ({ socket, myId, messages }) => {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [unread, setUnread] = useState(0);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const prevLenRef = useRef(messages.length);

    // Yeni mesaj gelince unread say (panel kapalıysa)
    useEffect(() => {
        if (messages.length > prevLenRef.current) {
            if (!open) setUnread(u => u + (messages.length - prevLenRef.current));
        }
        prevLenRef.current = messages.length;
    }, [messages.length, open]);

    // Panel açılınca unread sıfırla + scroll
    useEffect(() => {
        if (open) {
            setUnread(0);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            inputRef.current?.focus();
        }
    }, [open]);

    // Yeni mesaj gelince scroll
    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const send = () => {
        const t = text.trim();
        if (!t || !socket) return;
        socket.emit('chatMessage', t);
        setText('');
    };

    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); send(); }
        if (e.key === 'Escape') setOpen(false);
    };

    return (
        <div className="absolute bottom-2 right-2 z-30 flex flex-col items-end gap-1">
            {/* Panel */}
            {open && (
                <div className="w-64 sm:w-72 bg-stone-900/95 border border-stone-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-sm">
                    {/* Başlık */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-stone-700">
                        <span className="text-xs font-black uppercase tracking-widest text-stone-400">💬 Sohbet</span>
                        <button onClick={() => setOpen(false)} className="text-stone-500 hover:text-stone-300 text-sm">✕</button>
                    </div>

                    {/* Mesajlar */}
                    <div className="flex-1 overflow-y-auto max-h-48 px-3 py-2 space-y-1.5 no-scrollbar">
                        {messages.length === 0 && (
                            <p className="text-[11px] text-stone-600 text-center py-4">Henüz mesaj yok</p>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.id === myId ? 'items-end' : 'items-start'}`}>
                                <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">
                                    {msg.id === myId ? 'Sen' : msg.name}
                                </span>
                                <div className={`px-2.5 py-1.5 rounded-xl text-xs max-w-[90%] break-words ${
                                    msg.id === myId
                                        ? 'bg-amber-500 text-stone-950 font-semibold'
                                        : 'bg-stone-700 text-stone-100'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="flex gap-1.5 px-2 py-2 border-t border-stone-700">
                        <input
                            ref={inputRef}
                            type="text"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={onKey}
                            maxLength={120}
                            placeholder="Mesaj yaz..."
                            className="flex-1 bg-stone-800 border border-stone-600 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-500"
                        />
                        <button
                            onClick={send}
                            disabled={!text.trim()}
                            className="bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-black text-xs px-2.5 rounded-lg transition-colors"
                        >
                            ↑
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle butonu */}
            <button
                onClick={() => setOpen(o => !o)}
                className={`relative w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-lg transition-all active:scale-90 ${
                    open ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 border border-stone-600 text-stone-300 hover:bg-stone-700'
                }`}
            >
                💬
                {unread > 0 && !open && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>
        </div>
    );
};
