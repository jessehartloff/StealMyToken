const express = require('express');
const ws = require('ws');
const http = require('http');
const path = require('path');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongo = require('mongodb');
const monk = require('monk');

const index = require('./server/index');
const auth = require('./server/auth');

const app = express();

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const db = monk('mongo:27017/tokens');
app.use(function (req, res, next) {
	req.db = db;
	next();
});


const server = http.createServer(app)
const wsServer = new ws.WebSocketServer({ server })

wsServer.on("connection", function (socket) {
	// wss.setup(socket, wsServer);
})

app.use(function (req, res, next) {
	req.wss = wsServer;
	next();
});

app.use(index);
app.use(auth);

const port = 3012;
server.listen(port, () => {
	console.log("Starting Server on port " + port);
})
