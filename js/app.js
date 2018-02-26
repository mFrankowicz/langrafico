/*jslint node: true */

var socket;

var nodes;
var links;
var force;

var SVG;
var nodeSVG;
var linkSVG;


var width = 700;
var height = 700;

socket = io();

dataContainer = d3
    .select('body').append('container1');


SVG = d3
    .select("#graph")
    .append("svg")
    .attr("class", "appWindow")
    .attr("width", width)
    .attr("height", height)
    .style("background", d3.color("#D4E1E5"));



force = d3.forceSimulation()
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("link", d3.forceLink().id(function (d) {
        return d.id;
    }))
    .force("charge", d3.forceManyBody(0.3));

requestAll();

socket
    .on('response', function (data) {
        console.log(data);
        nodes = data.nodes;
        links = data.links;

        linkSVG = SVG.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .style("stroke", d3.color("#FF4D40"));

        var elem = SVG.selectAll("g nodeLabels").data(nodes);
        var elemEnter = elem
            .enter()
            .append("g")
            .attr("class", "nodes");

        nodeSVG = elemEnter.append("circle")
            .attr("r", 10)
            .style("fill", d3.color("#2CA4CC"));

        elemEnter
            .append("text")
            .attr("class", "labels")
            .text(function (d) {
                return d.name;
            })
            .attr("fill", d3.color("#BF1340"));


        force.nodes(nodes).on("tick", ticked);
        force.force("link").links(links);

        function ticked() {

            linkSVG
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

            elemEnter
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

        }
    });


function dragstarted(d) {
    if (!d3.event.active) force.alphaTarget(0.1).restart();
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


function requestAll() {
    socket
        .emit('requireAll', 'MATCH (a:Atuadores)-[r:Movimento]->(b:Discurso) RETURN a AS source, b AS target, r AS links');

    //MATCH (a:Person)-[r:DIRECTED]->(b:Movie) RETURN a AS source, b AS target, r AS links

    //MATCH (a:Person)-[r:FOLLOWS]->(b:Person) RETURN a AS source, b AS target, r AS links

    //MATCH (a:Person)-[r:ACTED_IN]->(b:Movie) WHERE b.title = "The Matrix" RETURN a AS source, b AS target, r AS links
}

