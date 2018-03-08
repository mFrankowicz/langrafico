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

console.log(chroma.brewer.RdBu);

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

            var edgepath = g.selectAll(".edgepath").data(links);

            edgepath = edgepath
                .enter()
                .append("path")
                .attr("class", "edgepath")
                .attr("id", function (d, i) {
                    return 'edgepath' + i;
                })
                .attr('marker-end', 'url(#arrowhead)')
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
                    return "--[" + d.type + "]--";
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
                .attr("class", "node")
                .attr("id", function (d) {
                    return "node_" + d.type;
                })
                .merge(node);

            node.exit().remove();

            var nodelabel = g.selectAll(".nodelabel").data(nodes);


            nodelabel = nodelabel
                .enter()
                .append("text")
                .attr("class", "nodelabel")
                .attr("id", function (d) {
                    return "nodelabel_" + d.type;
                })
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
                    return arcPath(true, d);
                });

            });

            node
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

            nodelabel
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

        });


    });

function getTransformation(transform) {
    // Create a dummy g for calculation purposes only. This will never
    // be appended to the DOM and will be discarded once this function
    // returns.
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Set the transform attribute to the provided string value.
    g.setAttributeNS(null, "transform", transform);

    // consolidate the SVGTransformList containing all transformations
    // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
    // its SVGMatrix.
    var matrix = g.transform.baseVal.consolidate().matrix;

    // Below calculations are taken and adapted from the private function
    // transform/decompose.js of D3's module d3-interpolate.
    var {
        a,
        b,
        c,
        d,
        e,
        f
    } = matrix; // ES6, if this doesn't work, use below assignment
    // var a=matrix.a, b=matrix.b, c=matrix.c, d=matrix.d, e=matrix.e, f=matrix.f; // ES5
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
    if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
    if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
    if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
    return {
        translateX: e,
        translateY: f,
        rotate: Math.atan2(b, a) * 180 / Math.PI,
        skewX: Math.atan(skewX) * 180 / Math.PI,
        scaleX: scaleX,
        scaleY: scaleY
    };
}

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

function requestUpdateAllClients(){
    socket
        .emit('requireStartAllClients', 'MATCH (source)-[links]->(target) MATCH (all) RETURN *');
}

socket.on('request_client_to_requireStart', function(data){
    requestAll();
});

var greet = "#  ███████╗███████╗██╗      ██████╗     ██████╗  ██████╗ ██╗███████╗ \n" +
            "#  ██╔════╝██╔════╝██║     ██╔═══██╗    ██╔══██╗██╔═══██╗██║██╔════╝ \n" +
            "#  ███████╗█████╗  ██║     ██║   ██║    ██║  ██║██║   ██║██║███████╗ \n" +
            "#  ╚════██║██╔══╝  ██║     ██║   ██║    ██║  ██║██║   ██║██║╚════██║ \n" +
            "#  ███████║███████╗███████╗╚██████╔╝    ██████╔╝╚██████╔╝██║███████║ \n" +
            "#  ╚══════╝╚══════╝╚══════╝ ╚═════╝     ╚═════╝  ╚═════╝ ╚═╝╚══════╝ \n" +
            "Terminal para criar diagramas. \n" +
            "Você pode interagir com o diagrama, clicando e arrastando os nós. \n" +
            "Use a roda do mouse para controlar o zoom. \n" +
            "Use CTRL + D para cancelar um comando (iOS: CMD + D) \n" +
            "------------------------------------ \n" +
            "para iniciar, começe digitando um dos comandos abaixo e digite e tecle ENTER: \n" +
            "|ajuda                \n" +
            "|criar nó             \n" +
            "|criar relação        \n "


var grammar = new tinynlp.Grammar([
        'A -> CRIAR NÓ TIPO NOME',
				'A -> CRIAR NÓ NOME TIPO',
        'CRIAR -> criar',
        'NÓ -> nó | W nó',
        'TIPO -> W tipo W | W W tipo W | tipo W',
        'NOME -> W nome W | W W nome W | nome W',
    ]);

grammar.terminalSymbols = function(token) {
    if ('criar' === token) return ['criar'];
    if ('nó' === token) return ['nó'];
    if ('tipo' === token) return ['tipo'];
    if ('nome' === token) return ['nome'];
    return['W'];
    //console.log("arraayyyyy", token);
}

$('#terminal').terminal(function(command, term) {
//  term.greetings(function(){return "ndndn"});
    if (command == 'criar nó'){
    var settings = {};
    var questions = [
      {
        name: "nome do nó",
        text: "escreva uma definição/nome para o nó: ",
        prompt: "definição/nome do nó será: "
      },
      {
        name: "tipo do nó",
        text: "defina um tipo ao qual o nó pertencerá : ",
        prompt: "tipo do nó será: "
      }
    ];

    function ask_node_creation(step) {
      var question = questions[step];
      if(question){
        if(question.text){
          term.echo('[[b;#fff;]' + question.text + ']');
        }
        term.push(function(command) {
          if(question.boolean) {
            var value;
            if(command.match(/sim/i)) {
              value = true;
            }else if(command.match(/não/i)) {
              value = false;
            }
            if(typeof value != 'undefined') {
              settings[question.name] = value;
              term.pop();
              ask_node_creation(step+1);
            }
          } else {
            settings[question.name] = command;
            term.pop();
            ask_node_creation(step+1);
          }
        }, {
          prompt: question.prompt || question.name + ": "
        });
        if(typeof settings[question.name] != 'undefined') {
          if(typeof settings[question.name] == 'boolean') {
            term.set_command(settings[question.name] ? 'confirmar' : 'descartar');
          } else {
            term.set_command(settings[question.name]);
          }
        }
      } else {
        finish();
      }
    }

    function finish() {
      term.echo('resumo de suas escolhas: ');
      var get_args = [];
      var str = Object.keys(settings).map(function(key){
        var value = settings[key];
        console.log(value);
        get_args.push(value);
        return '[[b;#fff;]' + key + ']: ' + value;
      }).join('\n');
      term.echo(str);
      term.push(function(command) {
        if(command.match(/confirmar/i)) {
          var result = JSON.stringify(settings);
          var node_type = get_args[1];
          var node_name = '"'+get_args[0]+'"';
          socket.emit('create_node',`CREATE (:${_.upperFirst(node_type)} {name: ${_.upperFirst(node_name)}})`);
          term.echo(result);
          term.echo(`CREATE (:${node_type} {name: ${node_name}})`);
          term.pop().history().enable();
        } else if (command.match(/descartar/i)) {
          term.pop();
          ask_node_creation(0);
        }
      }, {
        prompt: 'essas escolhas lhe agradam? (digite confirmar ou descartar): '
      })
    }

    term.history().disable();
    ask_node_creation(0);
  }

  if(command == 'criar relação') {
    var settings = {};
    var questions = [
      {
        name: "primeiro nó",
        text: "escolha o nome/definição do primeiro nó: ",
        prompt: "primeiro nó: "
      },
      {
        name: "segundo nó",
        text: "agora digite o nome do segundo nó: ",
        prompt: "segundo nó: "
      },
      {
        name: "nome da relação",
        text: "digite o tipo de relação que os dois nós se ligarão: ",
        prompt: "tipo da relação: "
      }
    ];

  function ask_relation_creation(step) {
    var question = questions[step];
    if(question){
      if(question.text){
        term.echo('[[b;#fff;]' + question.text + ']');
      }
      term.push(function(command) {
        if(question.boolean) {
          var value;
          if(command.match(/sim/i)) {
            value = true;
          }else if(command.match(/não/i)) {
            value = false;
          }
          if(typeof value != 'undefined') {
            settings[question.name] = value;
            term.pop();
            ask_relation_creation(step+1);
          }
        } else {
          settings[question.name] = command;
          term.pop();
          ask_relation_creation(step+1);
        }
      }, {
        prompt: question.prompt || question.name + ": "
      });
      if(typeof settings[question.name] != 'undefined') {
        if(typeof settings[question.name] == 'boolean') {
          term.set_command(settings[question.name] ? 'confirmar' : 'descartar');
        } else {
          term.set_command(settings[question.name]);
        }
      }
    } else {
      finish();
    }
  }

  function finish() {
    term.echo('resumo de suas escolhas: ');
    var get_args = [];
    var str = Object.keys(settings).map(function(key){
      var value = settings[key];
      console.log(value);
      get_args.push(value);
      return '[[b;#fff;]' + key + ']: ' + value;
    }).join('\n');
    term.echo(str);
    term.push(function(command) {
      if(command.match(/confirmar/i)) {
        var node_in = get_args[0];
        var node_out = get_args[1];
        var relation_type = get_args[2];
        socket.emit('create_relation',`MATCH (n1),(n2) WHERE n1.name = \"${_.upperFirst(node_in)}\" AND n2.name = \"${_.upperFirst(node_out)}\" CREATE (n1)-[:${_.upperFirst(relation_type)}]->(n2)`);
        term.echo(JSON.stringify(settings));
        term.echo(`CREATE (${node_in})-[:${relation_type}]->(${node_out})`)
        term.pop().history().enable();
      } else if (command.match(/descartar/i)) {
        term.pop();
        ask_relation_creation(0);
      }
    }, {
      prompt: 'essas escolhas lhe agradam? (digite confirmar ou descartar): '
    })
  }

  term.history().disable();
  ask_relation_creation(0);

}
if (command == 'ajuda'){
  term.echo('-Esse é um sistema para criar um diagrama coletivo a partir de comandos textuais. \n \n' +
            '-Cada comando é digitado separadamente e confirmado com a tecla enter. \n \n' +
            '-O sistema lhe guiará passo a passo, por tanto, é importante ler as instruções. \n \n' +
            '-Ao final do percurso, o sistema lhe dará um resumo das escolhas e pedirá para confirmar. \n \n' +
            '-O diagrama será atualizado com suas escolhas após a confirmação \n');

  term.echo('--------------------------------------------- \n');

  term.echo('-criar nó: Este comando lhe permite criar nós, elementos que invocam um significado \n em específico. \n \n' +
           '-Será perguntado o nome/definição e o tipo de nó, que é sua representação \n ou referência de algo no mundo. \n \n' +
           '-Após isso, escolha a definição, que é a propriedade ou qualidade interna deste nó. \n \n' +
           '-Exemplo 1: supomos o nó "Artista", podemos lhe inferir a qualidade de "Atuador", \n no sentido de evidenciar tipos de ações e a qual contexto este artista pertence. \n \n' +
           '-Exemplo 2: o nó "Exposição" pode ter uma qualidade de "Espaço", ou "Não-Espaço", \n dependendo do contexto ao qual o nó pertence. \n \n');

  term.echo('--------------------------------------------- \n');

  term.echo('-criar relação: Um comando para estabelecer uma relação entre dois nós. \n \n' +
            '-Primeiro escolha o nome do primeiro nó, de onde partirá a relação. \n' +
            '[[b;yellow;]-->Importante!:] O nome deve ser escrito exatamente como no diagrama \n com todos os pingos nos is. \n \n' +
            '-Após isso Escolha o nome do segundo nó, assim como fez com o primeiro \n' +
            '-Então escolha um texto que representará essa relação, podendo ser uma palavra \n que defina uma ação, ou um sentido que ligue os dois nós \n \n' +
            '-Exemplo: O exemplo mais simples é pensar a relação de Amizade (A relação) \n entre duas Pessoas (Os nós). \n \n'
          );

  term.echo('▲ use a roda do mouse para subir a tela e ler o início ▲ \n');
}

}, {
  greetings: greet
});

// mysql keywords
var uppercase = [
    'CRIAR NÓ','CRIAR RELAÇÃO', 'AJUDA'];
var keywords = uppercase.concat(uppercase.map(function(keyword) {
    return keyword.toLowerCase();
}));
$.terminal.defaults.formatters.push(function(string) {
    return string.split(/((?:\s|&nbsp;)+)/).map(function(string) {
        if (keywords.indexOf(string) != -1) {
            return '[[b;yellow;]' + string + ']';
        } else {
            return string;
        }
    }).join('');
});
/*
jQuery(function($, undefined) {
    $('#term_demo').terminal(function(command) {
        if (command !== '') {
            try {
                var result = window.eval(command);
                if (result !== undefined) {
                    this.echo(new String(result));
                }
            } catch(e) {
                this.error(new String(e));
            }
        } else {
           this.echo('');
        }
    }, {
        greetings: 'Javascript Interpreter',
        name: 'js_demo',
        height: 200,
        prompt: 'js> '
    });
});
*/

///////////////////////
