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
    }).distance(150).strength(0.5))
    .force("charge", d3.forceManyBody()
    .strength(-10))
    .force("center", d3.forceCenter(width / 2, height / 2));

    //.force("collide",d3.forceCollide( function(d){return d.r + 8; }).iterations(16) )

requestAll();

socket
    .on('createNode_Response', function (data){
        //console.log(data);
        requestAll();
    });

socket
    .on('response', function (data) {

    $( document ).ready(function() {

        console.log(data);
        nodes = data.nodes;
        links = data.links;
        
        
        
        var link = g.selectAll(".link").data(links);

        

        link = link
                .enter()
                .append("line")
                .attr("class", "link")
                .attr('marker-end','url(#arrowhead)')
                .merge(link);

        link.append("text")
            .text(function(d){return d.type;});
        
        link.exit().remove();

        
        var edgepath = g.selectAll(".edgepath").data(links);
        
        edgepath = edgepath
                    .enter()
                    .append("path")
                    .attr("class", "edgepath")
                    .attr("id", function(d,i) {return 'edgepath' +i;})
                    .style("pointer-events", "none")
                    .merge(edgepath);

        edgepath.exit().remove();        
        
        
        var edgelabel = g.selectAll(".edgelabel").data(links);
       //append???
        
       edgelabel
            .enter()
            .append('text')
            .append('textPath')
            .attr('class', 'edgelabel')
            .attr("id", function (d, i) {return 'edgelabel' + i;})
            .attr('xlink:href',function(d,i) {return '#edgepath'+i;})
            .style("pointer-events", "none")
            .attr("startOffset","50%")
            .merge(edgelabel)
            .text(function(d){return d.type;});
/*
        edgelabel    
            .enter()
            .style("pointer-events", "none")
            .attr("class", "edgelabel")
            .attr("id", function (d, i) {return 'edgelabel' + i;})
            .merge(edgelabel);
*/
        edgelabel.exit().remove();

        var node = g.selectAll(".node").data(nodes);
       

        node = node
                .enter()
                .append("circle")
                .attr("r",15)
                .attr("class", "node")
                .merge(node);

        node.exit().remove();

        var nodelabel = g.selectAll(".nodelabel").data(nodes);

        
        nodelabel = nodelabel
                    .enter()
                    .append("text")
                    .attr("class", "nodelabel")
                    .attr("x", function(d){return d.x;})
                    .attr("y", function(d){return d.y;})
                    .merge(nodelabel)
                    .text(function (d){return d.name;});
                    
        nodelabel.exit().remove();
        

        SVG.call(d3.zoom()
                    .scaleExtent([1 / 10, 8])
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
            
            /*
            edgepath.attr('d', function (d) {
                return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
            });
            */

           edgepath.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
        
            if (d.source.x < d.target.x) {
              return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
            }
            else {
              return "M" + d.target.x + "," + d.target.y + "A" + dr + "," + dr + " 0 0,1 " + d.source.x + "," + d.source.y;
            }
          });
          /*
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
            */
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


function requestAll() {
    socket
        .emit('requireStart', 'MATCH (source)-[links]->(target) MATCH (all) RETURN *');

    //MATCH (a:Person)-[r:DIRECTED]->(b:Movie) RETURN a AS source, b AS target, r AS links

    //MATCH (a:Person)-[r:FOLLOWS]->(b:Person) RETURN a AS source, b AS target, r AS links

    //MATCH (a:Person)-[r:ACTED_IN]->(b:Movie) WHERE b.title = "The Matrix" RETURN a AS source, b AS target, r AS links
}



function setup(){
    var canvas = createCanvas(700,100);
    canvas.parent('main_menu');
    p5_interface();
}

function draw(){
    background("#D1C4E9");
   
}

function p5_interface(){
   
        var div2 = createDiv('<p> Gráfico atual  :</p>');
        div2.attribute('id', 'resumos');
        div2.attribute('class', 'main_menu');
        div2.parent('main_menu');

        var div = createDiv('<p> Criar nova relação  :</p>');
        div.attribute('id', 'menus');
        div.attribute('class', 'main_menu');
        div.parent('main_menu');

        var sel_nodes_sum = createSelect();
        var sel_links_sum = createSelect();

        var sel_nodes_label_sum = createSpan('nós existentes: </p>');
        sel_nodes_label_sum.parent('resumos');
        sel_nodes_label_sum.attribute('class', 'list_span');
        sel_nodes_sum.attribute('id', 'node_sum_list');
        sel_nodes_sum.parent(sel_nodes_label_sum);

        var sel_nodes_links_sum = createSpan('<p>relações existentes:');
        sel_nodes_links_sum.parent('resumos');
        sel_nodes_links_sum.attribute('class', 'list_span');
        sel_links_sum.attribute('id', 'link_sum_list');
        sel_links_sum.parent(sel_nodes_links_sum);
    
    $( document ).ready(function() {

        var type_options = loadJSON('../json/types.json', makeList);

        socket
        .on('response', function (data) {

                console.log("getting data..");
                var list_graph = graphSummary(data,sel_nodes_sum,sel_links_sum);
        });

        socket
        .on('update', function (data) {

                console.log("getting data..");
                var list_graph = graphSummary(data,sel_nodes_sum,sel_links_sum);
        });

    });
        
}

function keyTyped(){
    requestAll();
}

function graphSummary(data, node_list, link_list){
    console.log("graph summary:");
    console.log(data);

    var nodes = data.nodes;
    var links = data.links;

    var sel_links = link_list;
    var sel_nodes = node_list;
    

    console.log(sel_nodes.elt);
    console.log(sel_links.elt);

    nodes.forEach(n => {sel_nodes.option(n.name,n.name + " [" + n.type + "]");});
    links.forEach(l => {sel_links.option(l.type,l.source_name + "-->" + l.target_name + " [" + l.type + "]");});
    
}

function createLink(data, node_list, json){
    var nodes = data.nodes;
    var links = json.links;

    var sel_nodes = node_list;



    nodes.forEach(n => {sel_nodes.option(n.node_group);});
}


function makeList(json){
    var nodes = json.nodes;
    var links = json.links;

    var sel_nodes = createSelect();
    var sel_links = createSelect();

    var sel_nodes_label = createSpan('tipos de nós: </p>');
    sel_nodes_label.parent('menus');
    sel_nodes_label.attribute('class', 'list_span');
    sel_nodes.attribute('class', 'types_list');
    sel_nodes.parent(sel_nodes_label);

    var sel_nodes_links = createSpan('<p> tipos de relações:');
    sel_nodes_links.parent('menus');
    sel_nodes_links.attribute('class', 'list_span');
    sel_links.attribute('class', 'types_list');
    sel_links.parent(sel_nodes_links);

    nodes.forEach(n => {sel_nodes.option(n.node_group);});
    links.forEach(l => {sel_links.option(l.link_group);});
}