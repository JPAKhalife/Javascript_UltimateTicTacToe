/**
 * @file server.ts
 * @description  This is the primary file for the server. It uses the express framework to create a server that listens on port 3000.
 * It starts out with http, then transitions to a websocket connection.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */

//Dependencies
import express from 'express'; // This is the express framework
import expressWs from 'express-ws'; // This is the express websocket framework
//import mysql from 'mysql'; // This is the mysql database framework
//import('dotenv').config(); // This is the dotenv framework - used for loading .env files
import helmet from 'helmet'; // This is the helmet framework - used for security of http headers
import rateLimit from 'express-rate-limit'; // This is the express-rate-limit framework - used for limiting the number of requests a client can make
import cors from 'cors'; // The cors framework allows for resources (assets like fonts, ect) to be shared across different domains


const ratelimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Create a new express application
const app = express();
//Extend the express app with express-ws to add websocket support
expressWs(app);
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
})

/**  
*! We need to send multiple files to the client, but we cannot use the sendFile method more than once.
*? The reason is because the sendFile method sends a response, and one resquest can only have one response.
* Solution: Use express's static method. 
* This method serves static files from the specified directory automatically, when the browser requests them.
* The browser will request the index.html file, and the server will automatically send it.
* The browser will then request the other files automatically when it sees the html file requires other files.
* The server will automatically send them.
*/
app.use(express.static(process.cwd()));

app.get('/favicon.ico', (req: any, res: any) => res.status(204));
//Handling http requests
//* This is the default route for the server. It sends the index.html file to the client.
app.get('/', (req: any, res: any) => {
    //Send the index.html file to the client (any files included in the html file will be sent automatically)
    res.sendFile(process.cwd() + '/index.html');
});

// Listen on port 3000
app.listen(3000, () => {
    console.log('Server started on port 3000');
});

