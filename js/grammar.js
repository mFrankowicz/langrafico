var grammar = new tinynlp.Grammar([
        'A -> CRIAR NÓ TIPO NOME',
				'A -> CRIAR NÓ NOME TIPO',
        'CRIAR -> criar',
        'NÓ -> nó | W nó',
        'TIPO -> W tipo W | W W tipo W | tipo W',
        'NOME -> W nome W | W W nome W | nome W',
    ]);
		// new RegExp(/\(([^()]*)\)/, 'g')
    grammar.terminalSymbols = function(token) {
        if ('criar' === token) return ['criar'];
        if ('nó' === token) return ['nó'];
        if ('tipo' === token) return ['tipo'];
        if ('nome' === token) return ['nome'];
        return['W'];
    }

    function displayTree(tree) {
        if (!tree.subtrees || tree.subtrees.length == 0) {
            return '<li><a href="#">' + tree.root + '</a></li>';
        }
        var builder = [];
        builder.push('<li><a href="#">');
        builder.push(tree.root);
        builder.push('</a>')
        builder.push('<ul>')
        for (var i in tree.subtrees) {
            builder.push(displayTree(tree.subtrees[i]))
        }
        builder.push('</ul>')
        builder.push('</li>')
        return builder.join('');
    }

    $('#txt').bind('input', function() {
        var s = $(this).val();

        var tokenStream = s.split(' ');
        var chart = tinynlp.parse(tokenStream, grammar, 'A');
        console.log('\n')
        var state = chart.getFinishedRoot('A');
        if (state) {
            var trees = state.traverse();
            for (var i in trees) {
                console.log(JSON.stringify(trees[i], ","))
                $('#dv').html('<div class="tree" id="displayTree"><ul>' + displayTree(trees[i]) + '</ul></div></br>');
            }
        }
    });
