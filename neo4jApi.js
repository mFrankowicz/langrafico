/*jslint node:true*/
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "1234"));


function getGraph(data){
    var session = driver.session();
    return session.run(data)
    .then(results => {
       session.close();
       var nodes = [], rels = [];
       results.records.forEach(res => {
           nodes.push(res.get('nodes'));
           console.log(nodes);
       });
        
       return {nodes};
    });
}

exports.getGraph = getGraph;