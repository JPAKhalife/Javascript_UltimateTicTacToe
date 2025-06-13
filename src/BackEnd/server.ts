/**
 * @file server.ts
 * @description  This is the primary file for the server. It uses the express framework to create a server that listens on port 3000.
 * It starts out with http, then transitions to a websocket connection.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

//Important constants
const host = 'tictacdb'; // The name of the database
const port = 6379; // The port of the database


//Dependencies
import express from 'express'; // This is the express framework
import expressWs from 'express-ws'; // This is the express websocket framework
//import mysql from 'mysql'; // This is the mysql database framework
//import('dotenv').config(); // This is the dotenv framework - used for loading .env files
import helmet from 'helmet'; // This is the helmet framework - used for security of http headers
import rateLimit from 'express-rate-limit'; // This is the express-rate-limit framework - used for limiting the number of requests a client can make
import cors from 'cors'; // The cors framework allows for resources (assets like fonts, ect) to be shared across different domains
import RedisManager from './RedisManager'

const ratelimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Create a new express application
const app = express();
var expressWsApp = require('express-ws')(app);
//Extend the express app with express-ws to add websocket support
app.use(cors());
app.options('*', cors());  // Pre-flight requests for all routes

//!P5.js conflicts with helmet because it has unsafe evals inside it.
//app.use(helmet()); // Use helmet to secure the server's http headers
app.use(ratelimiter); // Use the rate limiter to limit the number of requests a client can make (avoiding DDOS attacks)
app.use(cors()); // Use cors to allow resources to be shared across different domains

//Typescript's .ts can be interpreted as a video format based on MIME type.
//This fixes that.
app.use((req: any, res: any, next: any) => {
    if (req.path.endsWith('.ts')) {
        res.type('application/typescript');
    } else if (req.path.endsWith('.cjs')) {
        res.type('application/javascript');
    }
    next();
});

//Now before enabling any requests, we need to connect to the Redis server
const redis = new RedisManager(host,port); //initialize and connect client

/**  
*! We need to send multiple files to the client, but we cannot use the sendFile method more than once.
*? The reason is because the sendFile method sends a response, and one resquest can only have one response.
* Solution: Use express's static method. 
* This method serves static files from the specified directory automatically, when the browser requests them.
* The browser will request the index.html file, and the server will automatically send it.
* The browser will then request the other files automatically when it sees the html file requires other files.
* The server will automatically send them.
*/
app.use(express.static(process.cwd() + '/FrontEnd'));
console.log('Local directory is: ' + process.cwd());


app.get('/favicon.ico', (req: any, res: any) => res.status(204));
//Handling http requests
//* This is the default route for the server. It sends the index.html file to the client.
app.get('/', (req: any, res: any) => {
    //Send the index.html file to the client (any files included in the html file will be sent automatically)
    res.sendFile(process.cwd() + '/FrontEnd/index.html');
});

expressWsApp.app.ws('/', (ws: any, req: any) => {
    console.log("WebSocket connection established from client");

    // Send a message to the client upon connection
    ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server!' }));

    // Handle incoming messages from the client
    ws.on('message', async (message: any) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('Received message from client:', data);

            // Handle different message types
            if (data.type === 'createLobby') {
                await handleCreateLobby(ws, data);
            } else {
                // Default response for unhandled message types
                ws.send(JSON.stringify({ 
                    messageId: data.messageId,
                    message: 'Message received', 
                    data 
                }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({ 
                success: false, 
                error: 'Error processing message' 
            }));
        }
    });
})

/**
 * @function handleCreateLobby
 * @description Handles the createLobby message from the client
 * @param ws WebSocket connection
 * @param data Message data
 */
async function handleCreateLobby(ws: any, data: any) {
    let messageId: string | undefined;
    
    try {
        messageId = data.messageId;
        const { data: lobbyData } = data;
        const { lobbyName, lobbyData: lobby, playerData } = lobbyData;

        console.log(`Creating lobby ${lobbyName} with data:`, lobby, playerData);

        // Call RedisManager to create the lobby
        const success = await redis.createLobby(lobbyName, lobby, playerData);

        // Send response back to client
        ws.send(JSON.stringify({
            messageId,
            success,
            message: success ? `Lobby ${lobbyName} created successfully` : `Failed to create lobby ${lobbyName}`
        }));
    } catch (error) {
        console.error('Error creating lobby:', error);
        ws.send(JSON.stringify({
            messageId,
            success: false,
            error: 'Error creating lobby'
        }));
    }
}

// Listen on port 3000
app.listen(3000, () => {
    console.log('Server started on port 3000');
});

// Middleware to log the URL of any request
app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});
