import { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";
import Peer, { MediaConnection } from "peerjs";

interface UseVoiceChatProps {
    isJoined: boolean;
    myId: string;
    socket: Socket | null;
}

export function useVoiceChat({ isJoined, myId, socket }: UseVoiceChatProps) {
    const [peer, setPeer] = useState<Peer | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [audioStreams, setAudioStreams] = useState<Record<string, MediaStream>>({});

    // Aktif çağrıları izle
    const callsRef = useRef<Record<string, MediaConnection>>({});
    // socket ID -> peer ID eşleşmesi
    const peerMapRef = useRef<Record<string, string>>({});

    useEffect(() => {
        if (!isJoined || !myId || !socket) return;

        let localStream: MediaStream | null = null;
        let localPeer: Peer | null = null;

        // 1. Mikrofon izni al
        navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: false
        }).then(stream => {
            localStream = stream;
            setMyStream(stream);

            // 2. PeerJS e bağlan (Ücretsiz server)
            localPeer = new Peer();

            localPeer.on("open", (id) => {
                console.log("[Voice] My Peer ID is: " + id);
                setPeer(localPeer);
                socket.emit("updatePeerId", id);
            });

            // Gelen aramaları karşıla
            localPeer.on("call", (call) => {
                console.log("[Voice] Incoming call from: ", call.peer);
                call.answer(stream); // Kendi streamimiz ile cevap ver

                call.on("stream", (remoteStream) => {
                    console.log("[Voice] Received remote stream from: ", call.peer);

                    // Arayanın socketID sini bul
                    const callerSocketId = Object.keys(peerMapRef.current).find(key => peerMapRef.current[key] === call.peer);

                    if (callerSocketId) {
                        setAudioStreams(prev => ({ ...prev, [callerSocketId]: remoteStream }));
                    } else {
                        // Eğer henüz mapte yoksa, map geldiğinde streamı eşleştirmek üzere peerId üzerinden sakla
                        setAudioStreams(prev => ({ ...prev, [call.peer]: remoteStream }));
                    }
                });

                callsRef.current[call.peer] = call;
            });
        }).catch(err => {
            console.error("[Voice] Mikrofon izni alınamadı (iOS'ta butona basılması gerekebilir):", err);
        });

        const handlePeerMap = (peerMap: Record<string, string>) => {
            peerMapRef.current = peerMap;

            if (!localPeer || !localStream) return;

            // Yeni gelen kullanıcılara call at (bizde zaten açık stream var)
            Object.entries(peerMap).forEach(([socketId, remotePeerId]) => {
                if (socketId === myId) return; // Kendimizi aramayalım

                if (!callsRef.current[remotePeerId]) {
                    console.log("[Voice] Calling peer: ", remotePeerId);
                    const call = localPeer!.call(remotePeerId, localStream!);

                    if (call) {
                        call.on("stream", (remoteStream) => {
                            console.log("[Voice] stream obtained from outgoing call: ", socketId);
                            setAudioStreams(prev => {
                                // Eğer peer map gelmeden önce streams içine peerId ile düştüyse temizle
                                const newStreams = { ...prev };
                                delete newStreams[remotePeerId];
                                newStreams[socketId] = remoteStream;
                                return newStreams;
                            });
                        });
                        callsRef.current[remotePeerId] = call;
                    }
                } else {
                    // Zaten call var ama belki map gelmeden önce stream alınmıştı ve peerId üzerinden streamste kalmıştı.
                    setAudioStreams(prev => {
                        if (prev[remotePeerId]) {
                            const stream = prev[remotePeerId];
                            const newStreams = { ...prev };
                            delete newStreams[remotePeerId];
                            newStreams[socketId] = stream;
                            return newStreams;
                        }
                        return prev;
                    });
                }
            });

            // Disconnect olan varsa temizle
            setAudioStreams(prev => {
                const newStreams = { ...prev };
                Object.keys(newStreams).forEach(id => {
                    // id ya socketId dir ya da peerId.
                    if (id.length > 20) return; // peer id ler uzun guid oluyor genelde
                    if (!peerMap[id]) delete newStreams[id];
                });
                return newStreams;
            });

        };

        socket.on("peerMap", handlePeerMap);

        return () => {
            socket.off("peerMap", handlePeerMap);
            if (localPeer) {
                localPeer.destroy();
            }
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            callsRef.current = {};
            setAudioStreams({});
            setPeer(null);
            setMyStream(null);
        };
    }, [isJoined, myId]); // Bu hook içinde socket referansı değişmediği kabul edilir

    const toggleMute = () => {
        if (myStream) {
            myStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    return {
        isMuted,
        toggleMute,
        audioStreams,
        peerMap: peerMapRef.current
    };
}
