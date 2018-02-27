function createInterface(){

    function getTypes(callback){
        $.getJSON("../json/types.json", function(json){
            callback(json);
        });
    }

    $( document ).ready(function() {

        socket.on('response', function (data) {
                       
            var nodes = data.nodes;
            var links = data.links;

            console.log(nodes);
            console.log(links);

            //selection List
            d3.json('../json/types.json', function(json){
                var nodeTypes = json.nodes;
                var linkTypes = json.links;

                $("#radios_node").append("<p> .</p><p> . </p>");
                $("#radios_node").append("<p>~~~~~~~~~~~~~~~~~~~~</p>");
                $("#radios_node").append("<p>tipos de nós: </p>");
                j = 0;
                
                
                d3.select(".menu")
                .select("#lists")
                .select("#radios_node")
                .selectAll("label")
                .data(nodeTypes).enter()
                .append("label")
                .attr("id", "radio_label")
                .attr("class", "types_label")
                .text(function(d) { return d.node_group + ">";})
                .insert("input")
                .attr("type", "radio")
                .attr("id", "radio_node_value")
                .attr("class", "types_list")
                .attr("name", "nodeStack")
                .attr("value", function(d,i) {return i;})
                .property("checked", function(d,i) { return i===j;});
                

                $("#radios_link").append("<p>~~~~~~~~~~~~~~~~~~~~</p>");
                $("#radios_link").append("<p>tipos de relações: </p>");
                d3.select(".menu")
                .select("#lists")
                .select("#radios_link")
                .selectAll("label")
                .data(linkTypes).enter()
                .append("label")
                .attr("id", "link_label")
                .attr("class", "types_label")
                .text(function(d) {return d.link_group + ">";})
                .insert("input")
                .attr("type", "radio")
                .attr("id", "link_node_value")
                .attr("class", "types_list")
                .attr("name", "linkStack")
                .attr("value", function(d,i) {return i;})
                .property("checked", function(d,i) { return i===j;});

            });
            //list this graph
            $("#graph_summary").append("<p> Resumo -> ");
            $("#graph_summary").append("nós: </p>");
            d3.select(".menu")
            .select("#graph_summary")
            .selectAll("node_option")
            .data(nodes).enter()
            .append("li")
            .attr("class", "graph_list")
            .text(function (d) { return d.name + " - tipo: " + d.type; });

            $("#graph_summary").append("<p> relações: </p>");

            d3.select(".menu")
            .select("#graph_summary")
            .selectAll("node_links")
            .data(links).enter()
            .append("li")
            .attr("class", "graph_list")
            .text(function (d) { return  d.source.name + "--->" + d.target.name + " | tipo: " + d.type ;});

            //inputs
            d3.select(".menu")
            .select("#create")
            .append("input")
            .attr("type", "text")
            .attr("class", "inputText")
            .attr("id", "nodeCreate");
            
            d3.select(".menu")
            .select("#create")
            .append("button")
            .attr("class", "button")
            .attr("id", "node_submit")
            .text("criar nó");

             d3.select(".menu")
             .select("#create")
            .append("input")
            .attr("type", "text")
            .attr("class", "inputText")
            .attr("id", "relationCreate");

            d3.select(".menu")
            .select("#create")
            .append("button")
            .attr("class", "button")
            .attr("id", "relation_submit")
            .text("criar relação");

            $(".menu").append("</p>");
            

            //get values
            d3.select(".menu").select("#node_submit")
            .on("click", function(){
               var text_value = d3
                        .select("#nodeCreate.inputText")
                        .property("value");
                
                var radio_value = d3.select('input[name="nodeStack"]:checked').data()[0].node_group;
                var theData = {
                    name: text_value,
                    type: radio_value
                };
                 
                var msg = 'CREATE (n:' + theData.type + ' {name: ' + '\"' + text_value + '\"})';
                console.log(msg);
                socket
                    .emit('createNode',msg);
                
                    d3
                    .select("#nodeCreate.inputText")
                    .property("value", function(d){ return "";});
                    
            });

            d3.select(".menu").select("#relation_submit")
            .on("click", function(){
                var text_value = d3
                        .select("#relationCreate.inputText")
                        .property("value");

                var radio_value = d3.select('input[name="linkStack"]:checked').data()[0].link_group;
                console.log(radio_value);
                console.log(text_value + " | " + radio_value);
                
                /* 
                socket
                    .emit('createNode', d3.select("#relationCreate.inputText").property("value"));
                */
                d3.select("#relationCreate.inputText").property("value", function(d){ return "";});
                    
            });

        });
    });
}