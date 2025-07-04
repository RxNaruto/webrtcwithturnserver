import { useEffect, useState } from "react";

export const Sender = () => {
    const [socket, setSocket] = useState<null | WebSocket>(null);

    useEffect(() => {
        const socket = new WebSocket('wss://webrtc2way.rithkchaudharytechnologies.xyz/ws/');
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'sender' }));
        };
        setSocket(socket);
    }, []);

    async function startSendingVideo() {
        if (!socket) return;

        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                {
                    urls: 'turn:myturnserver.rithkchaudharytechnologies.xyz:3478',
                    username: 'rithkturnserver',
                    credential: '8570'
                }
            ]
        });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({ type: 'iceCandidate', candidate: event.candidate, target: 'receiver' }));
            }
        };

        peerConnection.ontrack = (event) => {
            console.log('Received track from receiver!', event);
            const video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            video.srcObject = event.streams[0];
            document.body.appendChild(video);
        };

        socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'createOffer') {
                await peerConnection.setRemoteDescription(data.sdp);

                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.send(JSON.stringify({ type: 'createAnswer', sdp: peerConnection.localDescription, target: 'receiver' }));
            }
            else if (data.type === 'createAnswer') {
                await peerConnection.setRemoteDescription(data.sdp);
            }
            else if (data.type === 'iceCandidate') {
                await peerConnection.addIceCandidate(data.candidate);
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.send(JSON.stringify({ type: 'createOffer', sdp: peerConnection.localDescription, target: 'receiver' }));
    }

    return (
        <div onClick={startSendingVideo}>
            <button>Send Video</button>
        </div>
    );
};
