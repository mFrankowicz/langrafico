/*jslint node:true*/
// mongodb atlas: 
// selodois
// Fiheci!@3
// Fiheci%21%403
var _ = require('lodash');

var assert = require('assert');

var http = require('http');
// Path module
var path = require('path');

// Using the filesystem module
var fs = require('fs');

var server = http.createServer(handleRequest);
server.listen(8080);

console.log('Server started on port 8080');

function handleRequest(req, res) {
    // What did we request?
    var pathname = req.url;

    // If blank let's ask for index.html
    if (pathname == '/') {
        pathname = '/index.html';
    }

    // Ok what's our file extension
    var ext = path.extname(pathname);

    // Map extension to file type
    var typeExt = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css'
    };
    // What is it? Default to plain text

    var contentType = typeExt[ext] || 'text/plain';

    // User file system module
    fs.readFile(__dirname + pathname,
        // Callback function for reading
        function (err, data) {
            // if there is an error
            if (err) {
                res.writeHead(500);
                return res.end('Error loading ' + pathname);
            }
            // Otherwise, send the data, the contents of the file
            res.writeHead(200, {
                'Content-Type': contentType
            });
            res.end(data);
        });
}



var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver("bolt://107.22.143.53:33353", neo4j.auth.basic("neo4j", "hardcopy-petroleum-successes"));
var session = driver.session();


var io = require('socket.io').listen(server);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
    // We are given a websocket object in our function
    function (socket) {

        console.log("We have a new client: " + socket.id);

        // When this user emits, client side: socket.emit('otherevent',some data);

        socket.on('requireAll', function (data) {
            // Data comes in as whatever was sent, including objects

            console.log("Received requireAll: " + data);

            var source = [],
                target = [],
                rels = [];

            session
                .run(data)
                .subscribe({
                    onNext: function (result) {
                        var s = result.get('source');
                        var t = result.get('target');
                        var r = result.get('links');

                        var sId = s.identity.low;
                        var tId = t.identity.low;
                        var sName = s.properties.name;
                        var tName = t.properties.title;

                        source.push({
                            "id": sId,
                            "name": sName
                        });
                        target.push({
                            "id": tId,
                            "name": tName
                        });

                        //rels.push({"source": sId, "target": tId});

                        rels.push({
                            "source": r.start.low,
                            "target": r.end.low
                        });

                    },
                    onCompleted: function () {
                        session.close();
                        //driver.close();
                        var nodes = _.unionWith(source, target, _.isEqualWith);
                        mongoData = nodes;
                        //var nodes = _.union(source, target);
                        // console.log(nodes);
                        var response = {
                            nodes: nodes,
                            links: rels
                        };
                        io.sockets.emit('response', response);
                        io.sockets.emit('putToMongo', response);
                    },
                    onError: function (error) {
                        console.log(error);
                    }
                });


        });

        socket.on('disconnect', function () {
            console.log("Client has disconnected");
        });
    }
);
