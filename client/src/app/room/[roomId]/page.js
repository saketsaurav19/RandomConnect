// "useSocket" hook must be imported from the correct location
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '../../hook/page';

function Room({ params }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const socket = useSocket();
    const [peerConnection, setPeerConnection] = useState(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);


    console.log(socket);


    useEffect(() => {

        if (socket) {
            console.log(socket);
            setLoading(false);


            socket.on('userConnected', (socketId) => {
                console.log(socketId);
                offerToCall(socketId);
            });
    

            return () => {
                socket.off('userConnected');
            };
        }
    }, [socket]);

    // if (loading) {
    //     return <div>Loading...</div>; // Render loading indicator while socket is being initialized
    // }


    const offerToCall = (remoteUserId) => {
        // Set up WebRTC peer connection with Google's STUN server
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };
        
        const pc = new RTCPeerConnection(configuration);
        setPeerConnection(pc);

        // Add local media stream to peer connection
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localVideoRef.current.srcObject = stream;
                pc.addStream(stream);
            })
            .catch((error) => {
                console.error('Error accessing local media:', error);
            });

        // Event listener for ICE candidate events
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    // Send ICE candidate to remote peer
                    const candidate = event.candidate.toJSON();
                    socket.emit('iceCandidate', { candidate, remoteUserId });
                }
            };

            pc.onaddstream = (event) => {
                remoteVideoRef.current.srcObject = event.stream;
            };

            pc.createOffer()
            .then((offer) => {
                return pc.setLocalDescription(offer);
            })
            .then(() => {
                // Send offer to remote peer
                const offerData = pc.localDescription.toJSON();
                socket.emit('offer', { offer: offerData, remoteUserId });
            })
            .catch((error) => {
                console.error('Error creating offer:', error);
            });
    };


    const handleOffer = ({ offer, remoteUserId }) => {
        // Set up WebRTC peer connection with Google's STUN server
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };
        const pc = new RTCPeerConnection(configuration);
        setPeerConnection(pc);

        // Add local media stream to peer connection
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localVideoRef.current.srcObject = stream;
                pc.addStream(stream);
            })
            .catch((error) => {
                console.error('Error accessing local media:', error);
            });

        // Event listener for ICE candidate events
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // Send ICE candidate to remote peer
                const candidate = event.candidate.toJSON();
                socket.emit('iceCandidate', { candidate, remoteUserId });
            }
        };

        pc.onaddstream = (event) => {
            remoteVideoRef.current.srcObject = event.stream;
        };

        // Set remote description
        pc.setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => {
                // Create answer
                return pc.createAnswer();
            })
            .then((answer) => {
                return pc.setLocalDescription(answer);
            })
            .then(() => {
                // Send answer to remote peer
                const answerData = pc.localDescription.toJSON();
                socket.emit('answer', { answer: answerData, remoteUserId });
            })
            .catch((error) => {
                console.error('Error handling offer:', error);
            });
    };

    const handleAnswer = ({ answer }) => {
        if (peerConnection) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
                .catch((error) => {
                    console.error('Error handling answer:', error);
                });
        }
    };

    // Handle incoming ICE candidate from another user
    const handleIceCandidate = ({ candidate }) => {
        if (peerConnection) {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                .catch((error) => {
                    console.error('Error handling ICE candidate:', error);
                });
        }
    };


    return (
        <>
            <h1>Room : {params.roomId}</h1>
            <div>
                <video  ref={localVideoRef} autoPlay muted width="320" height="240"></video>
                <video ref={remoteVideoRef} autoPlay width="320" height="240"></video>
            </div>
        </>
    );
}

export default Room;
