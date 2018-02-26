/*jslint node:true*/

const _ = require('lodash');

const assert = require('assert');

const neo4j = require('neo4j-driver').v1;

const socketIO = require('socket.io');

const express = require('express');

const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname,'index.html');

const server = express()
    .use('/js', express.static(__dirname + '/js'))
    .use('/css', express.static(__dirname + '/css'))
    .use((req,res) => res.sendFile(INDEX))
    .listen(PORT, () => console.log('Escutando em ${ PORT }'));

//langrafico-prod //b.6vVjbPB8WyqO.rdqZB5dr9bJRZXa4 //graphene auth
//bolt://hobby-mhfnpoiekhacgbkebnlojpal.dbs.graphenedb.com:24786
var driver = neo4j.driver("bolt://hobby-mhfnpoiekhacgbkebnlojpal.dbs.graphenedb.com:24786",neo4j.auth.basic("langrafico-prod", "b.6vVjbPB8WyqO.rdqZB5dr9bJRZXa4"));
//var driver = neo4j.driver("bolt://107.22.143.53:33353", neo4j.auth.basic("neo4j", "hardcopy-petroleum-successes"));
var session = driver.session();

const io = socketIO(server);

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
                        var tName = t.properties.name;

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
                        //io.clients[socket.id].emit('response', response);
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
