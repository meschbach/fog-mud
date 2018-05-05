const yargs = require('yargs');
const bunyan = require("bunyan");

const {MudHTTPClient} = require('./index');

function clientFromArgs( logger, argv ){
	return new MudHTTPClient( argv.service, logger );
}

const logger = bunyan.createLogger({name: "mud-client"});
const result = yargs
	.env('MUD')
	.options('service', {default: "http://localhost:9977"})
	.command("get [container] [key]", "Retrieves the value of the given key", (yargs) => {
		yargs
			.positional("container",{required: true, description: "The container to be retrieved from"})
			.positional("key",{required: true, description: "key name to be retrieved from"})
	}, (argv) =>{
		const container = argv.container;
		const key = argv.key;
		console.debug( "Retrieving ", container, key );

		const client = clientFromArgs(logger, argv);
		const stream = client.stream_from(container, key);
		stream.pipe(process.stdout);
	})
	.command("put [container] [key] [value]", "Puts the contents of the given key", (yargs) => {
		yargs
			.positional("container",{required: true, description: "The container to be retrieved from"})
			.positional("key",{required: true, description: "key name to be retrieved from"})
			.positional("value",{required: true, description: "Value to be placed there"})
	}, (argv) => {
		const container = argv.container;
		const key = argv.key;
		const value = argv.value;
		console.debug( "Put ", container, key );

		const client = clientFromArgs(logger, argv);
		client.store_value(container, key, value)
	})
	.demandCommand()
	.argv;
