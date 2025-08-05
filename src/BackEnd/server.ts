/**
 * @file server.ts
 * @description  This is the primary file for the server. It uses the express framework to create a server that listens on port 3000.
 * It starts out with http, then transitions to a websocket connection when an online game is initiated.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

//Important constants
const host = 'tictacdb'; // The name of the database
const port = 6379; // The port of the database


//Dependencies
import express from 'express'; // This is the express framework
import rateLimit from 'express-rate-limit'; // This is the express-rate-limit framework - used for limiting the number of requests a client can make
import cors from 'cors'; // The cors framework allows for resources (assets like fonts, ect) to be shared across different domains
import { handleWebsocketRequest } from './WebsocketRequestHandler'
import Redis from 'ioredis';
import { disconnect, getWebsocketObject, removeConnection } from './Database/Connections';

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

//The webserver must maintain two separate connections to the database:
// 1. A subscriber connection for keyspace notifications
// 2. A regular connection for normal Redis operations
const redisRegular = createRedisRegularConnection(host, port);
const redisSubscriber = createRedisSubscriberConnection(host, port, redisRegular);

//Automatically statically serves the frontEnd directory for the user
app.use(express.static(process.cwd() + '/FrontEnd'));
console.log('Local directory is: ' + process.cwd());

app.get('/favicon.ico', (req: any, res: any) => res.status(204));
//*HTTP REQUESTS
//* This is the default route for the server. It sends the index.html file to the client.
app.get('/', (req: any, res: any) => {
    //Send the index.html file to the client (any files included in the html file will be sent automatically)
    res.sendFile(process.cwd() + '/FrontEnd/index.html');
});

//Websocket 
expressWsApp.app.ws('/', (ws: any, req: any) => handleWebsocketRequest(ws, req, redisRegular));
// Listen on port 3000
app.listen(3000, () => {
    console.log('Server started on port 3000');
});

// Middleware to log the URL of any request
app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

//*****************************Helper functions *************************/
/**
 * Creates a Redis connection dedicated to subscribing to keyspace notifications
 * @param host Redis host
 * @param port Redis port
 * @returns Redis client configured for subscription
 */
function createRedisSubscriberConnection(host: string, port: number, regularClient: Redis): Redis {
    //Create the client object
    let redisClient = new Redis({
        host: host,
        port: port,
    });
    //Enable pubsub events for when a field expires
    redisClient.config('SET', 'notify-keyspace-events', 'Ex');
    redisClient.on('error', (err) => {
        console.error('Error occurred while connecting or accessing Redis subscriber server:', err);
    });
    redisClient.on('connect', () => {
        console.log('Connected to Redis subscriber server');
    });
    redisClient.psubscribe('__keyevent@0__:expired', (err, count) => {
        if (err) {
            console.error('Failed to subscribe to key expiration events:', err);
        } else {
            console.log(`Subscribed to ${count} key expiration event(s).`);
        }
    });
    // Listen for expiration events - disconnect users when this happens
    redisClient.on('pmessage', (pattern, channel, expiredKey) => {
        console.log(`Key expired: ${expiredKey}`);
        disconnect(regularClient, expiredKey);
    });

    return redisClient;
}

/**
 * Creates a Redis connection for regular operations (non-subscription)
 * @param host Redis host
 * @param port Redis port
 * @returns Redis client configured for regular operations
 */
function createRedisRegularConnection(host: string, port: number): Redis {
    //Create the client object
    let redisClient = new Redis({
        host: host,
        port: port,
    });
    redisClient.on('error', (err) => {
        console.error('Error occurred while connecting or accessing Redis regular server:', err);
    });
    redisClient.on('connect', () => {
        console.log('Connected to Redis regular server');
    });

    return redisClient;
}
