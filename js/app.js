/*jslint esversion: 6*/
var socket;

var nodes;
var links;
var force;

var SVG;
var nodeSVG;
var linkSVG;


var width = 700;
var height = 700;
/*
var session = requirejs(["../node_modules/neo4j-driver/lib/v1"], function(util) {
    //This function is called when scripts/helper/util.js is loaded.
    //If util.js calls define(), then this function is not fired until
    //util's dependencies have loaded, and the util argument will hold
    //the module value for "helper/util".
});
*/
//var driver = neo4j.driver("bolt://hobby-mhfnpoiekhacgbkebnlojpal.dbs.graphenedb.com:24786",neo4j.auth.basic("langrafico-prod", "b.6vVjbPB8WyqO.rdqZB5dr9bJRZXa4"));
//var session = driver.session();

socket = io();

dataContainer = d3
    .select('body').append('container1');


SVG = d3
    .select("#graph")
    .select("svg")
    .attr("class", "appWindow")
    .attr("width", width)
    .attr("height", height)
    .attr("transfor", d3.zoomIdentity);

SVG.append('defs').append('marker')
.attrs({'id':'arrowhead',
            'viewBox':'-0 -5 10 10',
            'refX':15,
            'refY':0,
            'orient':'auto',
            'markerWidth':8,
            'markerHeight':8,
            'xoverflow':'visible'})
        .append('svg:path')
        .attr('d', 'M 0,-2 L 7 ,0 L 0,2');

var g = SVG.append("g");

force = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) {
        return d.id;
    }).distance(200))
    .force("charge", d3.forceManyBody()
    .strength(-10))
    .force("center", d3.forceCenter(width / 2, height / 2));

requestAll();

$( document ).ready(function() {

socket
    .on('response', function (data) {
        console.log(data);
        nodes = data.nodes;
        links = data.links;
        
        

        var link = g.selectAll(".link").data(links);
        link.exit().remove();
        link = link
                .enter()
                .append("line")
                .attr("class", "link")
                .attr('marker-end','url(#arrowhead)')
                .merge(link);
        link.append("text")
            .text(function(d){return d.type;});


        const context = d3.path();

        var edgepath = g.selectAll(".edgepath").data(links);
        edgepath.exit().remove();
       
        edgepath = edgepath
                    .enter()
                    .append("path")
                    .attr("class", "edgepath")
                    .attr("id", function(d,i) {return 'edgepath' +i;})
                    .style("pointer-events", "none")
                    .merge(edgepath);

        console.log(edgepath);
        
        var edgelabel = g.selectAll(".edgelabel").data(links);
        edgelabel.exit().remove();
        edgelabel = edgelabel
                    .enter()
                    .append('text')
                    .style("pointer-events", "none")
                    .attr("class", "edgelabel")
                    .attr("id", function (d, i) {return 'edgelabel' + i;})
                    .merge(edgelabel);
        
        edgelabel.append('textPath')
            .attr('xlink:href',function(d,i) {return '#edgepath'+i;})
            .style("pointer-events", "none")
            .attr("startOffset","50%")
            .text(function(d){return d.type;})
            .merge(edgelabel);

        
        var node = g.selectAll(".node").data(nodes);
    
        node.exit().remove();
        node = node
                .enter()
                .append("circle")
                .attr("r",20)
                .attr("class", "node")
                .merge(node);
        
        var nodelabel = g.selectAll(".nodelabel").data(nodes);
        nodelabel.exit().remove();
        nodelabel = nodelabel
                    .enter()
                    .append("text")
                    .attr("class", "nodelabel")
                    .attr("x", function(d){return d.x;})
                    .attr("y", function(d){return d.y;})
                    .text(function (d){return d.name;})
                    .merge(nodelabel);


        SVG.call(d3.zoom()
                    .scaleExtent([1 / 2, 8])
                    .on("zoom", zoomed));
        
        
        force.nodes(nodes);
        force.force("link").links(links);
        force.alpha(1).restart();

        force.on("tick", function() {

            link
                .attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            node
                .attr("cx" ,function(d){return d.x;})
                .attr("cy" ,function(d){return d.y;});

            nodelabel
                .attr("x", function(d) { return d.x; }) 
                .attr("y", function(d) { return d.y; });

            edgepath.attr('d', function (d) {
                return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
            });      

            edgelabel.attr('transform',function(d,i){
                if (d.target.x<d.source.x){
                    bbox = this.getBBox();
                    rx = bbox.x+bbox.width/2;
                    ry = bbox.y+bbox.height/2;
                    return 'rotate(180 '+rx+' '+ry+')';
                }
                else {
                    return 'rotate(0)';
                }
            });
        });


        node 
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

    });

});

function zoomed() {
    g.attr("transform", d3.event.transform);
  }


function dragstarted(d) {
if (!d3.event.active) force.alphaTarget(0.3).restart();
d.fx = d.x;
d.fy = d.y;
}

function dragged(d) {
d.fx = d3.event.x;
d.fy = d3.event.y;
}

function dragended(d) {
if (!d3.event.active) force.alphaTarget(0);
d.fx = null;
d.fy = null;
}


createInterface();

function requestAll() {
    socket
        .emit('requireStart', 'MATCH (source)-[links]->(target) MATCH (all) RETURN *');

    //MATCH (a:Person)-[r:DIRECTED]->(b:Movie) RETURN a AS source, b AS target, r AS links

    //MATCH (a:Person)-[r:FOLLOWS]->(b:Person) RETURN a AS source, b AS target, r AS links

    //MATCH (a:Person)-[r:ACTED_IN]->(b:Movie) WHERE b.title = "The Matrix" RETURN a AS source, b AS target, r AS links
}