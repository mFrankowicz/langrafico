/*jslint node:true*/
// mongodb atlas: 
// selodois
// Fiheci!@3
// Fiheci%21%403
var _ = require('lodash');

var MongoClient = require('mongodb').MongoClient;

var assert = require('assert');

var uri = "mongodb://selodois:Fiheci123@selodois-shard-00-00-k3ecd.mongodb.net:27017,selodois-shard-00-01-k3ecd.mongodb.net:27017,selodois-shard-00-02-k3ecd.mongodb.net:27017/selodois?ssl=true&replicaSet=selodois-shard-0&authSource=admin";


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
                        //var nodes = _.union(source, target);
                        // console.log(nodes);
                        var response = {
                            nodes: nodes,
                            links: rels
                        };
                        io.sockets.emit('response', response);

                    },
                    onError: function (error) {
                        console.log(error);
                    }
                });


        });

        socket.on('disconnect', function () {
            console.log("Client has disconnected");
        });
    });



MongoClient.connect(uri, function (err, client) {
    assert.equal(null, err);

    const db = client.db("selodois");

    console.log("Connected successfully to server");
     findDocuments(db, function () {
        client.close();
    });
    /*
    insertDocuments(db, function () {
        client.close();
    });
    */
});

var insertDocuments = function (db, callback) {
    // Get the documents collection
    const collection = db.collection('documents');
    // Insert some documents
    collection.insertMany([
        {
            a: 1
        }, {
            a: 2
        }, {
            a: 3
        }
  ], function (err, result) {
        assert.equal(err, null);
        assert.equal(3, result.result.n);
        assert.equal(3, result.ops.length);
        console.log("Inserted 3 documents into the collection");
        callback(result);
    });
};

const findDocuments = function (db, callback) {
    // Get the documents collection
    const collection = db.collection('documents');
    // Find some documents
    collection.find({}).toArray(function (err, docs) {
        assert.equal(err, null);
        console.log("Found the following records");
        console.log(docs)
        callback(docs);
    });
}
