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

        this.p1socket.send(this.game.p1result);
        this.p2socket.send(this.game.p2result);
    }
    Select(ws,index)
    {
        if (ws === this.p1socket)
        {
            this.game.p1decision = index;
            console.log("Select P1:index=" + index);
        }
        else if (ws === this.p2socket)
        {
             this.game.p2decision = index;
             console.log("Select P2:index=" + index);
        }
        console.log("Select ??:index=" + index);
        if (this.game.p1decision >= 0 && this.game.p2decision >= 0)
        {
            this.game.Deside();
            this.p1socket.send(this.game.p1result);
            this.p2socket.send(this.game.p2result);
            console.log("Desice:");
        }
    }
}

var WaitRooms = new Map();
var Rooms = new Map();

var JoinCommand = {
    command:"Join",
    wait_room_name:"???"
}
var SelectCommand = {
    command:"Select",
    index:"select_hand_index"
}

wss.on('connection', (ws) => {
    console.log("connect:");
    ws.on('message', (json) => {
        console.log("message:" + json);

        const data = JSON.parse(json);
        switch (data.command)
        {
        case "Join":
            if (wait_client && wait_client.readyState == WebSocket.OPEN)
            {
                if (wait_client === ws)
                {
                    console.log("Join:Matching???");
                }
                let game = new GameRoom(wait_client,ws);
                Rooms.set(ws,game);
                Rooms.set(wait_client,game);
                wait_client = null;

                console.log("Join:Matching");
            }
            else{
                wait_client = ws;

                console.log("Join:Wait");
            }
            break;
        case "Select":
            console.log("Select:index=" + data.index);
            const game = Rooms.get(ws);
            game.Select(ws,data.index);
            break;
        }

    });

    ws.on('close', () => {
        if (ws === wait_client) {
            wait_client = nulll;
        }
        if (Rooms.has(ws))
        {
            Rooms.delete(ws);
        }

    });
});