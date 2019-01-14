const fs = require("fs");
const {promisify} = require("util");

const fs_readFile = promisify(fs.readFile);

const yargs = require('yargs');
const bunyan = require("bunyan");

const {MudHTTPClient} = require('./index');

async function clientFromArgs( logger, argv ){
	const agent = new MudHTTPClient( argv.service, logger );
	if( argv["jwt"] ){
		const token = (await fs_readFile(argv.jwt,"utf-8")).trim();
		agent.attachJWT( token );
	}
	return agent;
}

//TODO: See about merging with junk-drawer:main
function runCommand( target ){
	return function (args) {
		target(args).then( () => {}, (problem) => {
			console.error("Fatal error", problem);
		})
	}
}

async function getObjectStreamOut( argv ){
	const container = argv.container;
	const key = argv.key;
	console.debug( "Retrieving ", container, key );

	const client = await clientFromArgs(logger, argv);
	const stream = client.stream_from(container, key);
	stream.on('error', function (error) {
		console.error("Encountered error while stream: ", error);
	});
	stream.on('response', function (response) {
		if( response.statusCode != 200 ){
			console.error("Error: ", response.statusCode);
		}
	});
	stream.pipe(process.stdout);
}

async function putObjectFromValue( argv ) {
	const container = argv.container;
	const key = argv.key;
	const value = argv.value;
	console.debug( "Put ", container, key );

	const client = await clientFromArgs(logger, argv);
	await client.store_value(container, key, value);
}

async function deleteObject( argv ){
	const container = argv.container;
	const key = argv.key;

	const client = await clientFromArgs(logger, argv);
	const result = await client.delete( container, key );
	console.log(result);
}

async function listContainer( args ){
	const container = args.container;
	if( !container ){
		console.error("Container name is required");
		return;
	}

	const client = await clientFromArgs(logger, args);
	const items = await client.list( container, "" );
	console.log( items );
}

async function listContainers( args ){
	const client = await clientFromArgs(logger, args);
	const items = await client.listContainers();
	console.log( items );
}

const jwt = require("jsonwebtoken");
async function signJWT( args ) {
	const key = await fs_readFile( args.key );
	const claims = await fs_readFile( args.claims );
	const signedJWT = jwt.sign(claims, key);
	process.stdout.write(signedJWT);
}

const logger = bunyan.createLogger({name: "mud-client"});
const result = yargs
	.env('MUD')
	.option('service', {default: "http://localhost:9977"})
	.option("jwt", {description: "File name of the JSON web token to be used"})
	.command("get [container] [key]", "Retrieves the value of the given key", (yargs) => {
		yargs
			.positional("container",{required: true, description: "The container to be retrieved from"})
			.positional("key",{required: true, description: "key name to be retrieved from"})
	}, runCommand( getObjectStreamOut ))
	.command("put [container] [key] [value]", "Puts the contents of the given key", (yargs) => {
		yargs
			.positional("container",{required: true, description: "The container to be retrieved from"})
			.positional("key",{required: true, description: "key name to be retrieved from"})
			.positional("value",{required: true, description: "Value to be placed there"})
	}, runCommand( putObjectFromValue ))
	.command("delete [container] [key]", "Deletes the given key", (yargs) => {
		yargs
			.positional("container",{required: true, description: "The container to be operated on"})
			.positional("key",{required: true, description: "key name to be delete"})
	}, runCommand( deleteObject ))
	.command("list [container]", "Lists the available nodes within the container", (yargs) => {
		yargs
			.positional("container",{required: true, description: "The container to list"})
	}, runCommand( listContainer ))
	.command("sign-jwt key claims", "Signs a set of claims with the given key", (yargs) => {
		yargs
			.positional("key", { required:true, description: "File name of the key to sign with" })
			.positional("claims", {required:true, description: "JSON file with the claims to be signed"})
	}, runCommand( signJWT ))
	.command( "list-containers", "List the containers", (yargs) => {

	}, runCommand( listContainers ))
	.demandCommand()
	.argv;
