const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');

const io = new Server(8000, {
    cors: true,
});

const rooms = {};
let socketId;
io.on('connection', (socket) => {
    console.log('A user connected');
    socketId = socket.id;
    socket.on('Generate Room', () => {
        let roomId = findAvailableRoom();
        // If the room is available or newly created, join it
        if (roomId) {
            socket.emit('roomID', roomId);
            socket.join(roomId);

            io.to(roomId).emit('userConnected', socketId);
            console.log(`User ${socket.id} connected to room ${roomId}`);
            // Notify other users in the room about the new user joining
        }
    });

    socket.on('offer', ({ offer, remoteUserId }) => {
        console.log('Received offer from:', socket.id, 'to:', remoteUserId);
        // Broadcast the offer to the specified remote user
        io.to(remoteUserId).emit('offer', { offer, sender: socket.id });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        removeUserFromRoom(socketId);
    });
});

function findAvailableRoom() {
    for (const roomId in rooms) {
        const usersCount = Object.keys(rooms[roomId].users).length;
        if (usersCount < 2) {
            console.log(roomId);
            rooms[roomId].users[socketId] = true;
            console.log(rooms);
            return roomId;
        }
    }

    const newRoomId = uuidv4();
    console.log('Generated new room ID:', newRoomId);
    rooms[newRoomId] = { users: {[socketId]:true} };
    console.log(rooms);
    return newRoomId;
}


function removeUserFromRoom(socketId) {
    for (const roomId in rooms) {
        if (rooms[roomId].users.hasOwnProperty(socketId)) {
            delete rooms[roomId].users[socketId];
            break; // Exit the loop once the user is removed
        }
    }
}
