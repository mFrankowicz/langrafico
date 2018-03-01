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
    .attrs({
        'id': 'arrowhead',
        'viewBox': '-0 -5 10 10',
        'refX': 15,
        'refY': 0,
        'orient': 'auto',
        'markerWidth': 8,
        'markerHeight': 8,
        'xoverflow': 'visible'
    })
    .append('svg:path')
    .attr('d', 'M 0,-2 L 7 ,0 L 0,2');

var g = SVG.append("g");

force = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) {
        return d.id;
    }).distance(200).strength(0.5))
    .force("charge", d3.forceManyBody()
        .strength(-100))
    .force("center", d3.forceCenter(width / 2, height / 2));

//.force("collide",d3.forceCollide( function(d){return d.r + 8; }).iterations(16) )

requestAll();

socket
    .on('createNode_Response', function (data) {
        //console.log(data);
        requestAll();
    });

socket
    .on('response', function (data) {

        $(document).ready(function () {

            console.log(data);
            nodes = data.nodes;
            links = data.links;



            var link = g.selectAll(".link").data(links);



            link = link
                .enter()
                .append("line")
                .attr("class", "link")
                .attr('marker-end', 'url(#arrowhead)')
                .merge(link);

            link.append("text")
                .text(function (d) {
                    return d.type;
                });

            link.exit().remove();


            var edgepath = g.selectAll(".edgepath").data(links);

            edgepath = edgepath
                .enter()
                .append("path")
                .attr("class", "edgepath")
                .attr("id", function (d, i) {
                    return 'edgepath' + i;
                })
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
                .attr("id", function (d, i) {
                    return 'edgelabel' + i;
                })
                .attr('xlink:href', function (d, i) {
                    return '#edgepath' + i;
                })
                .style("pointer-events", "none")
                .attr("startOffset", "50%")
                .merge(edgelabel)
                .text(function (d) {
                    return d.type;
                });
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
                .attr("r", 15)
                .attr("class", "node")
                .merge(node);

            node.exit().remove();

            var nodelabel = g.selectAll(".nodelabel").data(nodes);


            nodelabel = nodelabel
                .enter()
                .append("text")
                .attr("class", "nodelabel")
                .attr("x", function (d) {
                    return d.x;
                })
                .attr("y", function (d) {
                    return d.y;
                })
                .merge(nodelabel)
                .text(function (d) {
                    return d.name;
                });

            nodelabel.exit().remove();

            var nodetype = g.selectAll(".nodetype").data(nodes);

            nodetype = nodetype
                .enter()
                .append("text")
                .attr("class", "nodetype")
                .attr("x", function (d) {
                    return d.x;
                })
                .attr("y", function (d) {
                    return d.y;
                })
                .attr("dy", 12)
                .merge(nodetype)
                .text(function (d) {
                    return d.type;
                });

            nodetype.exit().remove();

            SVG.call(d3.zoom()
                .scaleExtent([1 / 10, 8])
                .on("zoom", zoomed));


            force.nodes(nodes);
            force.force("link").links(links);
            force.alpha(1).restart();

            //arc path function
            function arcPath(leftHand, d) {

                var countSiblingLinks = function (source, target) {
                    var count = 0;
                    for (var i = 0; i < links.length; ++i) {
                        if ((links[i].source.id === source.id && links[i].target.id === target.id) || (links[i].source.id === target.id && links[i].target.id === source.id))
                            count++;
                    }
                    return count;
                };

                var getSiblingLinks = function (source, target) {
                    var siblings = [];
                    for (var i = 0; i < links.length; ++i) {
                        if ((links[i].source.id === source.id && links[i].target.id === target.id) || (links[i].source.id === target.id && links[i].target.id === source.id))
                            siblings.push(links[i].type);
                    }
                    return siblings;
                };

                var x1 = leftHand ? d.source.x : d.target.x,
                    y1 = leftHand ? d.source.y : d.target.y,
                    x2 = leftHand ? d.target.x : d.source.x,
                    y2 = leftHand ? d.target.y : d.source.y,
                    dx = x2 - x1,
                    dy = y2 - y1,
                    dr = Math.sqrt(dx * dx + dy * dy),
                    drx = dr,
                    dry = dr,
                    sweep = leftHand ? 0 : 1;
                var siblingCount = countSiblingLinks(d.source, d.target),
                    xRotation = 0,
                    largeArc = 0;

                if (siblingCount > 1) {
                    var siblings = getSiblingLinks(d.source, d.target);
                    // console.log(siblings);
                    var arcScale = d3.scalePoint()
                        .domain(siblings)
                        .range([1, siblingCount]);
                    drx = drx / (1 + (1 / siblingCount) * (arcScale(d.type) - 1));
                    dry = dry / (1 + (1 / siblingCount) * (arcScale(d.type) - 1));
                }

                return "M" + x1 + "," + y1 + "A" + drx + ", " + dry + " " + xRotation + ", " + largeArc + ", " + sweep + " " + x2 + "," + y2;
            }


            force.on("tick", function () {

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
                    .attr("cx", function (d) {
                        return d.x;
                    })
                    .attr("cy", function (d) {
                        return d.y;
                    });

                nodelabel
                    .attr("x", function (d) {
                        return d.x;
                    })
                    .attr("y", function (d) {
                        return d.y;
                    });

                nodetype
                    .attr("x", function (d) {
                        return d.x;
                    })
                    .attr("y", function (d) {
                        return d.y;
                    });

                edgepath.attr("d", function (d) {
                    if (d.source.x < d.target.x) {

                        return arcPath(true, d);
                    } else {
                        //return arcPath(true, d);
                        return arcPath(d.source.x < d.target.x, d);
                    }
                });
                /*
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

            if (d.source.id === d.target.id || d.target.id === d.source.id){
                return "M" + d.target.x + "," + d.target.y + "A" + dr + "," + dr + " 0 0,1 " + d.source.x + "," + d.source.y;
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
}



function setup() {
    var canvas = createCanvas(700, 100);
    canvas.parent('p5_canvas');
    p5_interface();
    socket
        .on('request_client_to_requireStart', function (data) {
            console.log(data + ' ...gotit!')
            requestAll();
        });
}

function draw() {
    background("#D1C4E9");

}

function p5_interface() {

    var div = createDiv('<p> Criar novo nó :</p>');
    div.attribute('id', 'menus');
    div.attribute('class', 'main_menu');
    div.parent('main_menu');

    var div_create_node = createDiv('<p> Criar nova relação a partir de existente  :</p>');
    div_create_node.attribute('id', 'create_node');
    div_create_node.attribute('class', 'main_menu');
    div_create_node.parent('main_menu');

    ////////////////
    var sel_nodes_sum_start = createSelect();
    var sel_nodes_sum_end = createSelect();

    ///////////////
    var sel_nodes_label_sum_start = createSpan('<p>primeiro nó: </p>');
    sel_nodes_label_sum_start.parent('create_node');
    sel_nodes_label_sum_start.attribute('class', 'list_span');
    /*
    var start_input = createInput('insira palavra do primeiro nó', 'text');
    start_input.attribute('id', 'input_start_node');
    start_input.attribute('class', 'input');
    start_input.parent(sel_nodes_label_sum_start);
    */
    sel_nodes_sum_start.attribute('id', 'node_sum_list_start');
    sel_nodes_sum_start.parent(sel_nodes_label_sum_start);
    ////////////////
    $('.list_span').append('<p> -- </p>');
    ////////////////
    var sel_nodes_label_sum_end = createSpan('<p>segundo nó: </p>');
    sel_nodes_label_sum_end.parent('create_node');
    sel_nodes_label_sum_end.attribute('class', 'list_span');
    /*
    var end_input = createInput('insira palavra do segundo nó', 'text');
    end_input.attribute('id', 'input_end_node');
    end_input.attribute('class', 'input');
    end_input.parent(sel_nodes_label_sum_end);
    */
    sel_nodes_sum_end.attribute('id', 'node_sum_list_end');
    sel_nodes_sum_end.parent(sel_nodes_label_sum_end);


    button = createButton('criar relação!');
    button.parent('create_node');
    button.attribute('class', 'button');
    button.mousePressed(button_create_link);
    //$('#create_node').append('<p> -- </p>');
    ////////////////////////////////////////////////////////////////////////
    $(document).ready(function () {

        var type_options = loadJSON('../json/types.json', makeList);

        socket
            .on('response', function (data) {

                console.log("getting data..");
                createLink(data, sel_nodes_sum_start, sel_nodes_sum_end);
            });

        var from_existing_type_options = loadJSON('../json/types.json', from_existing_makeList);


    });

}

function button_create_link() {
    var start_node = _.replace(select('#node_sum_list_start').value(), /\s\[.*\]/g, '');
    var end_node = _.replace(select('#node_sum_list_end').value(), /\s\[.*\]/g, '');
    var relation = select('#types_list_create').value();

    var require = "MATCH (start),(end) WHERE start.name = \"" + start_node + "\" AND end.name = \"" + end_node + "\" CREATE (start)-[:" + relation + "]->(end)";
    socket
        .emit('create_relation', require);
}

function createLink(data, node_list_start, node_list_end) {
    var nodes = data.nodes;
    //var links = json.links;

    var sel_nodes_start = node_list_start;
    var sel_nodes_end = node_list_end;


    nodes.forEach(n => {
        sel_nodes_start.option(n.name, n.name + " [" + n.type + "]");
    });
    nodes.forEach(n => {
        sel_nodes_end.option(n.name, n.name + " [" + n.type + "]");
    });

}

function from_existing_makeList(json) {
    var links = json.links;

    var sel_links = createSelect();

    var sel_nodes_links = createSpan('<p> tipos de relações:');
    sel_nodes_links.parent('create_node');
    sel_nodes_links.attribute('class', 'list_span');
    sel_links.attribute('id', 'types_list_create');
    sel_links.parent(sel_nodes_links);

    links.forEach(l => {
        sel_links.option(l.link_group);
    });
}

function makeList(json) {
    var nodes = json.nodes;
    //var links = json.links;

    var sel_nodes = select("#node_create_select");
    //var sel_links = createSelect();
    //sel_nodes.attribute('class', 'types_list');
    sel_nodes.parent('span_create_node_1');
    /*
        var sel_nodes_links = createSpan('<p> tipos de relações:');
        sel_nodes_links.parent('menus');
        sel_nodes_links.attribute('class', 'list_span');
        sel_links.attribute('class', 'types_list');
        sel_links.parent(sel_nodes_links);
    */
    nodes.forEach(n => {
        sel_nodes.option(n.node_group);
    });
    // links.forEach(l => {sel_links.option(l.link_group);});
}