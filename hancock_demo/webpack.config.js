module.exports = {
    entry: "./main.js",
    node :{
		fs : "empty",
		net : "empty",
		tls : "empty"
	},
	output: {
        path: __dirname,
        filename: "bundle.js"
    },
    module: {
        loaders: [
			{ test: /\.json$/, loader: "json" },
			{
				test: /\.js$/,
				loader: 'babel',
				query: {
					presets: ['es2015']
				}
			}
        ]
    }
};