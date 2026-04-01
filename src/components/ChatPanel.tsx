import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../hooks/useSocket';
import { Socket } from 'socket.io-client';

interface ToastMessage extends ChatMessage {
    toastId: number;
}

interface Props {
    socket: Socket | null;
    myId: string;
    messages: ChatMessage[];
}

export const ChatPanel: React.FC<Props> = ({ socket, myId, messages }) => {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [unread, setUnread] = useState(0);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [keyboardOffset, setKeyboardOffset] = useState(0);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const prevLenRef = useRef(messages.length);
    const toastIdRef = useRef(0);

    // Android/iOS klavye açılınca viewport küçülür — panel yukarı kayar
    useEffect(() => {
        const vv = (window as any).visualViewport;
        if (!vv) return;
        const onResize = () => {
            const offset = window.innerHeight - vv.height - vv.offsetTop;
            setKeyboardOffset(Math.max(0, offset));
        };
        vv.addEventListener('resize', onResize);
        vv.addEventListener('scroll', onResize);
        return () => {
            vv.removeEventListener('resize', onResize);
            vv.removeEventListener('scroll', onResize);
        };
    }, []);

    // Yeni mesaj gelince unread say + toast göster (panel kapalıysa)
    useEffect(() => {
        if (messages.length > prevLenRef.current) {
            const newMsgs = messages.slice(prevLenRef.current);
            if (!open) {
                setUnread(u => u + newMsgs.length);
                // Toast ekle
                const newToasts: ToastMessage[] = newMsgs.map(m => ({
                    ...m,
                    toastId: ++toastIdRef.current,
                }));
                setToasts(prev => [...prev, ...newToasts].slice(-4)); // max 4 toast
                // 3.5 saniye sonra kaldır
                newToasts.forEach(t => {
                    setTimeout(() => {
                        setToasts(prev => prev.filter(x => x.toastId !== t.toastId));
                    }, 3500);
                });
            }
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
        <div
            className="absolute bottom-2 right-2 z-30 flex flex-col items-end gap-1"
            style={{ bottom: `${8 + keyboardOffset}px` }}
        >

            {/* Toast Mesajlar — panel kapalıyken gösterilir */}
            {!open && toasts.length > 0 && (
                <div className="flex flex-col gap-1 mb-1 items-end">
                    {toasts.map(t => (
                        <div
                            key={t.toastId}
                            className="flex items-start gap-2 bg-stone-900/90 border border-stone-700 rounded-xl px-3 py-2 shadow-lg backdrop-blur-sm max-w-[220px] animate-fade-in-up"
                            style={{ animation: 'fadeInUp 0.2s ease-out' }}
                        >
                            <span className="text-[10px] font-black text-amber-400 whitespace-nowrap mt-0.5">
                                {t.id === myId ? 'Sen' : t.name}
                            </span>
                            <span className="text-[11px] text-stone-100 break-words leading-tight">
                                {t.text}
                            </span>
                        </div>
                    ))}
                </div>
            )}
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
