var LineReader  = require( 'n-readlines' ),
	glob        = require( 'glob' ),
	outputRegex = /@output ([^\s]+)/;

function getFileOutput( file ) {
	var line, inComment, lineReader = new LineReader( file );

	while ( line = lineReader.next() ) {
		line = line.toString().trim();

		// Empty line or opening/closing of comment block.
		if ( line === '/**' ) {
			inComment = true;
			continue;
		}
		if ( line === '*/' ) {
			inComment = false;
			continue;
		}
		if ( line.length === 0 ) {
			continue;
		}

		// Single-line comment or line in comment block.
		if ( line.startsWith( '/*' ) || ( inComment && line.startsWith( '*' ) ) ) {
			var output = outputRegex.exec( line );

			if ( output ) {
				lineReader.close();
				return output[ 1 ];
			}

			continue;
		}

		lineReader.close();
		return false;
	}

	lineReader.close();
	return false;
}


function OutputAnnotationsPlugin( options ) {
	this.options = options;
}

OutputAnnotationsPlugin.generateEntries = function( options ) {
	var entries = {};

	var files = glob.sync( options.pattern, options.globOptions );

	for ( var i = 0; i < files.length; i++ ) {
		var output, file = files[ i ];

		output = getFileOutput( file );

		if ( output ) {
			output = options.prefix + output;
			if ( ! entries[ output ] ) {
				entries[output] = [];
			}
			entries[ output ].push( file );
		}
	}

	return entries;
};

OutputAnnotationsPlugin.prototype.apply = function( compiler ) {
	var options = this.options;

	compiler.hooks.entryOption.tap( function ( entries ) {
		var generatedEntries = OutputAnnotationsPlugin.generateEntries( options );

		entries = entries || {};

		for ( var output in generatedEntries ) {
			if ( generatedEntries.hasOwnProperty( output ) ) {
				if ( ! entries[ output ] ) {
					entries[ output ] = [];
				}
				entries[ output ] = entries[ output ].concat( generatedEntries[ output ] );
			}
		}

		return entries;
	} );
};

module.exports = OutputAnnotationsPlugin;
