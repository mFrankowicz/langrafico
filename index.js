/*jslint node:true*/
/*jslint esversion: 6*/

const _ = require('lodash');

const assert = require('assert');

const neo4j = require('neo4j-driver').v1;

const socketIO = require('socket.io');

const express = require('express');

const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
    .use('/js', express.static(__dirname + '/js'))
    .use('/css', express.static(__dirname + '/css'))
    .use('/json', express.static(__dirname + '/json'))
    .use((req, res) => res.sendFile(INDEX))
    .listen(PORT, () => console.log('Escutando em ${ PORT }'));

//langrafico-prod //b.6vVjbPB8WyqO.rdqZB5dr9bJRZXa4 //graphene auth
//bolt://hobby-mhfnpoiekhacgbkebnlojpal.dbs.graphenedb.com:24786
var driver = neo4j.driver("bolt://hobby-mhfnpoiekhacgbkebnlojpal.dbs.graphenedb.com:24786", neo4j.auth.basic("langrafico-prod", "b.6vVjbPB8WyqO.rdqZB5dr9bJRZXa4"));
//var driver = neo4j.driver("bolt://107.22.143.53:33353", neo4j.auth.basic("neo4j", "hardcopy-petroleum-successes"));
var session = driver.session();

const io = socketIO(server);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
    // We are given a websocket object in our function
    function (socket) {

        console.log("We have a new client: " + socket.id);
        const id = socket.client.id;
        // When this user emits, client side: socket.emit('otherevent',some data);

        socket.on('requireStart', function (data) {
            console.log("Received requireStart: " + data);

            var source = [],
                target = [],
                all = [],
                rels = [];

            session
                .run(data)
                .subscribe({
                    onNext: function (result) {
                        //console.log(result);
                        var s = result.get('source');
                        var t = result.get('target');
                        var r = result.get('links');
                        var a = result.get('all');


                        var sId = s.identity.low;
                        var tId = t.identity.low;
                        var aId = a.identity.low;

                        var sName = s.properties.name;
                        var tName = t.properties.name;
                        var aName = a.properties.name;

                        var sLabels = s.labels;
                        var tLabels = t.labels;
                        var aLabels = a.labels;

                        var rType = r.type;
                        var rId = r.identity.low;

                        source.push({
                            "id": sId,
                            "name": sName,
                            "type": sLabels
                        });
                        target.push({
                            "id": tId,
                            "name": tName,
                            "type": tLabels
                        });
                        all.push({
                            "id": aId,
                            "name": aName,
                            "type": aLabels
                        });

                        //console.log(r);
                        rels.push({
                            "id": rId,
                            "source": r.start.low,
                            "target": r.end.low,
                            "source_name": sName,
                            "target_name": tName,
                            "type": rType
                        });

                    },
                    onCompleted: function () {
                        session.close();
                        //driver.close();
                        var nodesPre = _.unionWith(source, target, _.isEqualWith);
                        var nodes = _.unionWith(nodesPre, all, _.isEqualWith);

                        //console.log(nodesPre);
                        //console.log(nodes);
                        //var nodes = _.union(source, target);
                        // console.log(nodes);

                        console.log(rels);
                        console.log("desdulicatingyeah . . .");
                        rels = _.sortedUniqBy(rels, 'id');
                        nodes = _.sortedUniqBy(nodes, 'id');
                        console.log(rels);
                        console.log(nodes);

                        var response = {
                            nodes: nodes,
                            links: rels
                        };
                        //socket.client[socket.id].emit('response',response);
                        //console.log(id);
                        io.in(id).emit('response', response);
                        console.log('sent response to client ' + id);
                        //io.sockets.emit('response', response);
                        //io.clients[socket.id].emit('response', response);
                    },
                    onError: function (error) {
                        console.log(error);
                    }
                });
        });

        socket.on('requireStartAllClients', function (data) {
            console.log("Received requireStart: " + data);

            var source = [],
                target = [],
                all = [],
                rels = [];

            session
                .run(data)
                .subscribe({
                    onNext: function (result) {
                        //console.log(result);
                        var s = result.get('source');
                        var t = result.get('target');
                        var r = result.get('links');
                        var a = result.get('all');


                        var sId = s.identity.low;
                        var tId = t.identity.low;
                        var aId = a.identity.low;

                        var sName = s.properties.name;
                        var tName = t.properties.name;
                        var aName = a.properties.name;

                        var sLabels = s.labels;
                        var tLabels = t.labels;
                        var aLabels = a.labels;

                        var rType = r.type;
                        var rId = r.identity.low;

                        source.push({
                            "id": sId,
                            "name": sName,
                            "type": sLabels
                        });
                        target.push({
                            "id": tId,
                            "name": tName,
                            "type": tLabels
                        });
                        all.push({
                            "id": aId,
                            "name": aName,
                            "type": aLabels
                        });

                        //console.log(r);
                        rels.push({
                            "id": rId,
                            "source": r.start.low,
                            "target": r.end.low,
                            "source_name": sName,
                            "target_name": tName,
                            "type": rType
                        });

                    },
                    onCompleted: function () {
                        session.close();
                        //driver.close();
                        var nodesPre = _.unionWith(source, target, _.isEqualWith);
                        var nodes = _.unionWith(nodesPre, all, _.isEqualWith);

                        //console.log(nodesPre);
                        //console.log(nodes);
                        //var nodes = _.union(source, target);
                        // console.log(nodes);

                        console.log(rels);
                        console.log("desdulicatingyeah . . .");
                        rels = _.sortedUniqBy(rels, 'id');
                        nodes = _.sortedUniqBy(nodes, 'id');
                        console.log(rels);
                        console.log(nodes);

                        var response = {
                            nodes: nodes,
                            links: rels
                        };
                        //socket.client[socket.id].emit('response',response);
                        //console.log(id);
                        //io.in(id).emit('response', response);
                        console.log('sent response to all clients ' + id);
                        io.sockets.emit('response', response);
                        //io.clients[socket.id].emit('response', response);
                    },
                    onError: function (error) {
                        console.log(error);
                    }
                });
        });

        socket.on('create_relation', function (data) {
            console.log("Received create_relation: " + data);

            var back_result = [];
            session
                .run(data)
                .subscribe({
                    onNext: function (result) {
                        back_result.push(result);
                    },
                    onCompleted: function () {
                       // console.log(back_result);

                        io.sockets.emit('request_client_to_requireStart', 'now you can require all');
                    },
                    onError: function (error) {
                        console.log(error);
                    }
                });
        });

        socket.on('create_node', function (data) {
            console.log("Received create_relation: " + data);

            var back_result = [];
            session
                .run(data)
                .subscribe({
                    onNext: function (result) {
                        back_result.push(result);
                    },
                    onCompleted: function () {
                        //console.log(back_result);
                        io.sockets.emit('request_client_to_requireStart', 'now you can require all');
                    },
                    onError: function (error) {
                        console.log(error);
                    }
                });
        });

        socket.on('create_query', function (data) {
            console.log("Received create_relation: " + data);
            var check_doubles = [];
            var keys = [];
            var back_result = [];
            var count = 0;
            session
                .run(data)
                .subscribe({
                    onNext: function (result) {
                        //console.log('------------------');

                           //console.log(e.toString());
                           // console.log(obj);
                           // console.log(key);
                           // console.log(rec);
                            //console.log(JSON.stringify(rec.toObject()));
                            back_result.push((result.toObject()));
                            //check_doubles = _.unionBy(e, e.identity.low);
                       // back_result.push(check_doubles);
                       // console.log(result._fields);

                        //check_doubles = _.sortedUniqBy(check_doubles, 'identity.low');
                      },
                    onCompleted: function () {
                        //keys = _.sortedUniq(keys);
                        back_result.forEach(e => {
                            console.log(e);
                        });
                        console.log(keys);
                        //console.log(check_doubles);
                        //console.log(back_result);
                       // back_result.forEach(e => { return _.sortedUniqBy(e, 'identity.low');});
                        console.log("number of operations: "+count);
                        socket.emit('query_response', back_result);
                    },
                    onError: function (error) {
                        console.log(error);
                    }
                });
        });

        socket.on('create_query_2', function (data) {
            console.log("Received requireStart: " + data);

            var source = [],
                target = [],
                all = [],
                rels = [];

            session
                .run(data)
                .subscribe({
                    onNext: function (result) {
                        //console.log(result);
                        var s = result.get('source');
                        var t = result.get('target');
                        var r = result.get('links');
                        var a = result.get('all');


                        var sId = s.identity.low;
                        var tId = t.identity.low;
                        var aId = a.identity.low;

                        var sName = s.properties.name;
                        var tName = t.properties.name;
                        var aName = a.properties.name;

                        var sLabels = s.labels;
                        var tLabels = t.labels;
                        var aLabels = a.labels;

                        var rType = r.type;
                        var rId = r.identity.low;

                        source.push({
                            "id": sId,
                            "name": sName,
                            "type": sLabels
                        });
                        target.push({
                            "id": tId,
                            "name": tName,
                            "type": tLabels
                        });
                        all.push({
                            "id": aId,
                            "name": aName,
                            "type": aLabels
                        });

                        //console.log(r);
                        rels.push({
                            "id": rId,
                            "source": r.start.low,
                            "target": r.end.low,
                            "source_name": sName,
                            "target_name": tName,
                            "type": rType
                        });

                    },
                    onCompleted: function () {
                        session.close();
                        //driver.close();
                        var nodesPre = _.unionWith(source, target, _.isEqualWith);
                        var nodes = _.unionWith(nodesPre, all, _.isEqualWith);

                        //console.log(nodesPre);
                        //console.log(nodes);
                        //var nodes = _.union(source, target);
                        // console.log(nodes);

                        console.log(rels);
                        console.log("desdulicatingyeah . . .");
                        rels = _.sortedUniqBy(rels, 'id');
                        nodes = _.sortedUniqBy(nodes, 'id');
                        console.log(rels);
                        console.log(nodes);

                        var response = {
                            nodes: nodes,
                            links: rels
                        };
                        //socket.client[socket.id].emit('response',response);
                        //console.log(id);
                        io.in(id).emit('response', response);
                        console.log('sent response to client ' + id);
                        //io.sockets.emit('response', response);
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
