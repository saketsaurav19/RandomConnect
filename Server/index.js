const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');

const io = new Server(8000, {
    cors: true,
});

const rooms = {};
let Role;
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Emit 'hello' event to the connected client
    socket.emit('hello', { msg: 'hi socket' });

    socket.on('Generate Room', () => {
        const { roomId, role } = findAvailableRoom(socket.id);
        Role = role;
        if (roomId) {
            socket.emit('roomID' , roomId);
            socket.join(roomId);
            socket.emit('role' , role);
            io.to(roomId).emit('userConnected', socket.id);
            console.log(`User ${socket.id} connected to room ${roomId} as ${role}`);
        }
    });

    // Handle offer
    socket.on('offer', (roomId, offer) => {
        console.log(`Received offer ${offer} from ${socket.id} in room ${roomId}`);
        console.log(offer);
        // Broadcast offer to all peers in the room except the sender
        socket.to(roomId).emit('offer', offer);
        console.log('offer emitted from server to recipient');
    });

    // Handle answer
    socket.on('answer', (roomId, answer) => {
        console.log(`Received answer ${answer} from ${socket.id} in room ${roomId}`);
        // Broadcast answer to all peers in the room except the sender
        socket.to(roomId).emit('answer', answer);
    });

    socket.on('iceCandidate', (roomId, candidate) => {
        console.log(`Received ICE candidate ${candidate} from ${socket.id} in room ${roomId}`);
        // Broadcast ICE candidate to all peers in the room except the sender
        socket.to(roomId).emit('iceCandidate', candidate);
    });



    socket.on('disconnect', () => {
        console.log('A user disconnected');
        removeUserFromRoom(socket.id);
        console.log('Updated rooms:', JSON.stringify(rooms, null, 2));
    });
});

function findAvailableRoom(socketId) {
    for (const roomId in rooms) {
        const usersCount = Object.keys(rooms[roomId].users || {}).length;
        if (usersCount < 2) {
            let role;
            if (usersCount === 0 || rooms[roomId].users[Object.keys(rooms[roomId].users)[0]].role === 'recipient') {
                role = 'initiator';
            } else {
                role = 'recipient';
            }
            rooms[roomId].users[socketId] = { 'id': socketId, 'role': role };
            console.log('Updated rooms:', JSON.stringify(rooms, null, 2));
            return { roomId, role };
        }
    }

    const newRoomId = uuidv4();
    console.log('Generated new room ID:', newRoomId);
    const role = 'initiator';
    rooms[newRoomId] = { users: { [socketId]: { 'id': socketId, 'role': role } } };
    console.log('Updated rooms:', JSON.stringify(rooms, null, 2));
    return { roomId: newRoomId, role };
}

function removeUserFromRoom(socketId) {
    for (const roomId in rooms) {
        if (rooms[roomId].users.hasOwnProperty(socketId)) {
            delete rooms[roomId].users[socketId];
            const usersCount = Object.keys(rooms[roomId].users || {}).length;
            if(usersCount === 0) {
                delete rooms[roomId];
            }
            break;
        }
    }
}
