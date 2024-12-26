/**
 * @file server.ts
 * @description  This is the primary file for the server. It uses the express framework to create a server that listens on port 3000.
 * It starts out with http, then transitions to a websocket connection.
 * @author John Khalife
 * @created 2024-06-9
 * @updated 2024-06-23
 */
//Dependencies
var express = require('express'); // This is the express framework
var expressWs = require('express-ws'); // This is the express websocket framework
var mysql = require('mysql'); // This is the mysql database framework
//require('dotenv').config(); // This is the dotenv framework - used for loading .env files
var helmet = require('helmet'); // This is the helmet framework - used for security of http headers
var rateLimit = require('express-rate-limit'); // This is the express-rate-limit framework - used for limiting the number of requests a client can make
var cors = require('cors'); // The cors framework allows for resources (assets like fonts, ect) to be shared across different domains
var ratelimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
// Create a new express application
var app = express();
//Extend the express app with express-ws to add websocket support
expressWs(app);
// //Set up the msql database connection
// const connection = mysql.createConnection({
//     host: process.env.MYSQL_HOST,
//     user: process.env.MYSQL_USER,
//     password: process.env.MYSQL_PASSWORD,
//     database: process.env.MYSQL_DATABASE
// })
// //Connect to the database
// try {
//     connection.connect();
// } catch (err) {
//     console.log('Error connecting to the database: ', err);
// }
/**
*! We need to send multiple files to the client, but we cannot use the sendFile method more than once.
*? The reason is because the sendFile method sends a response, and one resquest can only have one response.
* Solution: Use express's static method.
* This method serves static files from the specified directory automatically, when the browser requests them.
* The browser will request the index.html file, and the server will automatically send it.
* The browser will then request the other files automatically when it sees the html file requires other files.
* The server will automatically send them.
*/
app.use(express.static(__dirname));
// app.use(helmet()); // Use helmet to secure the server's http headers
// app.use(ratelimiter); // Use the rate limiter to limit the number of requests a client can make (avoiding DDOS attacks)
// app.use(cors()); // Use cors to allow resources to be shared across different domains
//Typescript's .ts can be interpreted as a video format based on MIME type.
//This fixes that.
app.use(function (req, res, next) {
    if (req.path.endsWith('.ts')) {
        res.type('application/typescript');
    }
    next();
});
app.get('/favicon.ico', function (req, res) { return res.status(204); });
//Handling http requests
//* This is the default route for the server. It sends the index.html file to the client.
app.get('/', function (req, res) {
    //Send the index.html file to the client (any files included in the html file will be sent automatically)
    res.sendFile(__dirname + '/index.html');
});
//Handling websocket requests
// //This is for when the online button is pressed and the client needs a server to join.
// app.ws('/online', (ws, req) => {
//     //Event detection for when a message is received by the client
//     ws.on('message', (msg) => {
//         //Log the message
//         console.log(msg);
//     });
// });
// Listen on port 3000
app.listen(3000, function () {
    console.log('Server started on port 3000');
});
