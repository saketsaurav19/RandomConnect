'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '../../hook/page'; // Check if this is the correct import path

function Room({ params }) {
    const router = useRouter();
    const [peerConnection, setPeerConnection] = useState(null);
    const socket = useSocket();
    const [remoteSocket, setRemoteSocket] = useState(null);
    const role = localStorage.getItem('role');
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const roomId = params.roomId;

    useEffect(() => {
        // Establish socket connection
        if (socket) {
            console.log('Socket connected.');
            // Listen for user connected event
            socket.on('userConnected', (socketId) => {
                console.log('User connected:', socketId);
                setRemoteSocket(socketId);
            });
        }
    }, [socket, peerConnection]);

    useEffect(() => {
        // Create peer connection for initiator
        if (socket && role === 'initiator') {
            console.log('Creating peer connection for initiator...');
            const peer = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Google's public STUN server
            });
            setPeerConnection(peer);

            // Get user media and add tracks to the peer connection
            console.log('Getting user media for initiator...');
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    console.log('Local stream obtained for initiator:', stream);
                    localVideoRef.current.srcObject = stream;
                    stream.getTracks().forEach((track) => {
                        peer.addTrack(track, stream);
                    });
                })
                .catch((error) =>
                    console.error('Error accessing media devices:', error)
                );

            // Listen for negotiation needed event
            peer.onnegotiationneeded = async () => {
                console.log('Negotiation needed - creating offer...');
                try {
                    const offer = await peer.createOffer();
                    console.log('Local offer created:', offer);
                    await peer.setLocalDescription(offer);
                    console.log('Local description set:', peer.localDescription);
                    // Send offer to the other user
                    socket.emit('offer', roomId, peer.localDescription);
                } catch (error) {
                    console.error('Error creating offer:', error);
                }
            };

            // Listen for ICE candidates and send them to the other user
            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Sending ICE candidate:', event.candidate);
                    socket.emit('iceCandidate', roomId, event.candidate);
                }
            };

            // Listen for incoming stream
            peer.ontrack = (event) => {
                console.log('try to receiving  remote stream');
                console.log('Received remote stream:', event.streams[0]);
                remoteVideoRef.current.srcObject = event.streams[0];
            };
        }
    }, [socket, roomId]);

    // Handle offer from recipient
    useEffect(() => {
        if (socket && role === 'recipient') {
            console.log('Waiting for offer as recipient...');
            socket.on('offer', async (offer) => {
                console.log('Received offer:', offer);
                if (!peerConnection) {
                    console.log('Creating peer connection for recipient...');
                    const peer = new RTCPeerConnection({
                        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Google's public STUN server
                    });
                    setPeerConnection(peer);

                    // Get user media and add tracks to the peer connection
                    console.log('Getting user media for recipient...');
                    navigator.mediaDevices
                        .getUserMedia({ video: true, audio: true })
                        .then((stream) => {
                            console.log('Local stream obtained for recipient:', stream);
                            localVideoRef.current.srcObject = stream;
                            stream.getTracks().forEach((track) => {
                                peer.addTrack(track, stream);
                            });
                        })
                        .catch((error) =>
                            console.error('Error accessing media devices:', error)
                        );

                    // Set remote description
                    console.log('Setting remote description...');
                    await peer.setRemoteDescription(new RTCSessionDescription(offer));

                    // Create answer
                    peer.onnegotiationneeded = async () => {
                        console.log('Negotiation needed - creating answer...');
                        try {
                            const answer = await peer.createAnswer();
                            console.log('Local answer created:', answer);
                            await peer.setLocalDescription(answer);
                            console.log('Local description set:', answer);
                            // Send answer back to the offerer
                            socket.emit('answer', roomId, answer);
                        } catch (error) {
                            console.error('Error creating answer:', error);
                        }
                    };

                    // Listen for ICE candidates and send them to the other user
                    peer.onicecandidate = (event) => {
                        if (event.candidate) {
                            console.log('Sending ICE candidate:', event.candidate);
                            socket.emit('iceCandidate', roomId, event.candidate);
                        }
                    };

                    // Listen for incoming stream
                    peer.ontrack = (event) => {
                        console.log('try to receiving  remote stream');
                        console.log('Received remote stream:', event.streams[0]);
                        remoteVideoRef.current.srcObject = event.streams[0];
                    };
                }
            });
        }
    }, [socket, peerConnection, roomId]);


    useEffect(() => {
        if (socket && role === 'initiator') {
            console.log('Waiting for answer as initiator...');
            socket.on('answer', async (answer) => {
                console.log('Received answer:', answer);
                if (peerConnection) {
                    try {
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                    } catch (error) {
                        console.error('Error setting remote description:', error);
                    }
                }
            });
        }
    }, [socket, peerConnection]);
    

    // Handle incoming ICE candidates from both initiator and responder
    useEffect(() => {
        if (socket && peerConnection ) {
            socket.on('iceCandidate', async (candidate) => {
                console.log('Received ICE candidate:', candidate);
                try {
                    await peerConnection.addIceCandidate(candidate);
                } catch (error) {
                    console.error('Error adding ICE candidate:', error);
                }
            });
        }
    }, [socket, peerConnection]);

    useEffect(() => {
        const handleTrackEvent = (event) => {
            console.log('Received remote stream:', event.streams[0]);
            remoteVideoRef.current.srcObject = event.streams[0];
        };

        if (peerConnection) {
            peerConnection.ontrack = handleTrackEvent;
        }

        return () => {
            // Cleanup on unmount or change of peer connection
            if (peerConnection) {
                peerConnection.ontrack = null;
            }
        };
    }, [peerConnection]);

    useEffect(() => {
        if (socket && peerConnection && role === 'initiator') {
            const handleTrackEvent = (event) => {
                console.log('Received remote stream:', event.streams[0]);
                remoteVideoRef.current.srcObject = event.streams[0];
            };
    
            if (peerConnection) {
                peerConnection.ontrack = handleTrackEvent;
                if(peerConnection.ontrack === null ){
                    console.log('remote video is null');
                    peerConnection.ontrack = handleTrackEvent;
                }
            }
    
        }
        }, [peerConnection , remoteSocket]);

    return (
        <>
            <h1>Room : {roomId}</h1>
            <div>
                <video ref={localVideoRef} autoPlay muted width="320" height="240"></video>
                <video ref={remoteVideoRef} autoPlay width="320" height="240"></video>
            </div>
        </>
    );
}

export default Room;
