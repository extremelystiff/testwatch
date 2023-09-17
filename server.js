const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const lobbies = {};

io.on('connection', (socket) => {
    socket.on('create', (username, callback) => {
        const lobbyCode = generateLobbyCode();
        lobbies[lobbyCode] = {
            host: socket.id,
            users: { [socket.id]: username },
            video: { state: 'pause', time: 0, url: '' }
        };
        socket.join(lobbyCode);
        callback(lobbyCode);
    });

    socket.on('join', (lobbyCode, username, callback) => {
        if (lobbies[lobbyCode]) {
            lobbies[lobbyCode].users[socket.id] = username;
            socket.join(lobbyCode);
            callback(true);
        } else {
            callback(false);
        }
    });

    socket.on('sync', (lobbyCode, videoState) => {
        const lobby = lobbies[lobbyCode];
        if (lobby && lobby.host === socket.id) {
            lobby.video = videoState;
            // Emit to everyone except the sender to synchronize the video state.
            socket.to(lobbyCode).emit('sync', lobby.video);
        }
    });


    socket.on('setVideo', (lobbyCode, url) => {
        const lobby = lobbies[lobbyCode];
        if (lobby && lobby.host === socket.id) {
            lobby.video.url = url;
        }
    });
});

function generateLobbyCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
