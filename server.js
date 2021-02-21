const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const GameMaster = require("./game");


var wait_client = null;

class GameRoom
{
    constructor(ws1,ws2)
    {
        this.game = new GameMaster();
        this.p1socket = ws1;
        this.p2socket = ws2;
        
        this.p1decision = -1;
        this.p2decision = -1;

        this.p1socket.send("");
        this.p2socket.send("");
    }
}

var Rooms = [];

var test = {
    command:"",
}

wss.on('connection', (ws) => {
    ws.on('message', (data) => {

        const json = JSON.parse(data);
        if (data.command == "Join")
        {
            if (wait_client && wait_client.readyState == WebSocket.OPEN)
            {
                let game = new GameRoom(wait_client,ws);
                Rooms.push(game);
                ws = null;
            }
            else{
                wait_client = ws;
            }
        }

        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(data);
            }
        });
    });
    ws.on('close', () => {
        if (ws === wait_client) {
            wait_client = nulll;
        }

    });
});