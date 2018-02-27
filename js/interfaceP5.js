function createInterface(data){

        var nodes = data.nodes;
        var links = data.links;
        console.log("getting data..");
        console.log(nodes);
        console.log(links);
            //selection List
            d3.json('../json/types.json', function(json){
                console.log(json);
            });
        
}