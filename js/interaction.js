function createInterface(data){

        var nodes = data.nodes;
        var links = data.links;
        console.log("getting data..");
        console.log(nodes);
        console.log(links);
        var MENU = d3.select('#main').selectAll('.menu');
            //selection List
            d3.json('../json/types.json', function(json){
                console.log(json);
                var nodeTypes = json.nodes;
                var linkTypes = json.links;

                j = 0;

                var radio_nodes = d3.select('.menu').select("#lists")
                                    .select("#radios_node").selectAll("label")
                                    .data(nodeTypes);

                radio_nodes = radio_nodes
                            .enter()
                            .append("label")
                            .attr("id", "radio_label")
                            .attr("class", "types_label")
                            .merge(radio_nodes)
                            .text(function(d) { return d.node_group + ">";})
                            .insert("input")
                            .attr("type", "radio")
                            .attr("id", "radio_node_value")
                            .attr("class", "types_list")
                            .attr("name", "nodeStack")
                            .attr("value", function(d,i) {return i;})
                            .property("checked", function(d,i) { return i===j;});

                radio_nodes.exit().remove();

                var radio_links = d3.select('.menu').select("#lists")
                                   .select("#radios_link").selectAll("label")
                                   .data(linkTypes);

                radio_links = radio_links
                            .enter()
                            .append("label")
                            .attr("id", "link_label")
                            .attr("class", "types_label")
                            .merge(radio_links)
                            .text(function(d) {return d.link_group + ">";})
                            .insert("input")
                            .attr("type", "radio")
                            .attr("id", "link_node_value")
                            .attr("class", "types_list")
                            .attr("name", "linkStack")
                            .attr("value", function(d,i) {return i;})
                            .property("checked", function(d,i) { return i===j;});
                
                radio_links.exit().remove();

            });

            //list this graph
            var graph_nodes = d3.select('.menu').select(".graph_node_summary").selectAll("node_option").data(nodes);
            graph_nodes = graph_nodes.enter()
                        .append("li")
                        .attr("class", "graph_list")
                        .merge(graph_nodes)
                        .text(function (d) { return d.name + " - tipo: " + d.type; });

            graph_nodes.exit().remove();
           
            var graph_links = d3.select('.menu').select(".graph_link_summary").selectAll("link_option").data(links);
            graph_links = graph_links.enter()
                        .append("li")
                        .attr("class", "graph_list")
                        .merge(graph_links)
                        .text(function (d) { return  d.source.name + "--->" + d.target.name + " | tipo: " + d.type ;});

            graph_links.exit().remove();

            //inputs

            //get values
            d3.select("#node_submit")
            .on("click", function(){
               var text_value = d3
                        .select("#input_node.inputText")
                        .property("value");
                
                var radio_value = d3.select('input[name="nodeStack"]:checked').data()[0].node_group;
                var theData = {
                    name: text_value,
                    type: radio_value
                };
                 
                var msg = 'MATCH (source)-[links]->(target) MATCH (all) CREATE (n:' + theData.type + ' {name: ' + '\"' + text_value + '\"}) RETURN *';
                console.log(msg);

                socket
                .emit('createNode',msg);

                d3
                .select("#input_node.inputText")
                .property("value", function(d){ return "";});
                    
            });

            d3.select(".menu").select("#relation_submit")
            .on("click", function(){
                var text_value = d3
                        .select("#input_link.inputText")
                        .property("value");

                var radio_value = d3.select('input[name="linkStack"]:checked').data()[0].link_group;
                console.log(radio_value);
                console.log(text_value + " | " + radio_value);
                
                /* 
                socket
                    .emit('createNode', d3.select("#relationCreate.inputText").property("value"));
                */
                d3.select("#input_link.inputText").property("value", function(d){ return "";});
                    
            });
}