
const assert = require("assert");
const request = require('request-promise-native');
const requestBase = require('request');

class MudHTTPClient {
	constructor( serviceURL, logger ){
		this.base = serviceURL;
		this.logger = logger.child({mud: "http-v1", serviceURL});
		this.baseHeaders = {};
	}

	attachJWT( jwt ){
		this.baseHeaders["Authorization"] = "Token " + jwt;
	}

	async store_value( container, key, object ) {
		this.logger.trace("Storing simple value", {key, object});
		const storage_result = await request.post({
			url: this.base + "/container/" + container + "/object/" + key,
			headers: Object.assign({
				'X-Mud-Type' : 'Immediate'
			}, this.baseHeaders),
			body: { object: object},
			json: true});
		this.logger.trace("Storage result", storage_result);
		return storage_result;
	}

	stream_to( container, key ){
		const url = this.base + "/container/" + container + "/object-stream/" + key;
		this.logger.trace("Streaming from ", {container, key, url});
		return requestBase.post( url );
	}

	async get_value( container, key) {
		this.logger.trace("Retrieving key", {container, key});
		const result = JSON.parse(await request.get({
			url: this.base + "/container/" + container + "/object/" + key
		}));
		this.logger.trace("Retrieval instructions", {container, key, result});
		return result;
	}

	stream_from( container, key ){
		const url = this.base + "/container/" + container + "/object-stream/" + key ;
		this.logger.trace("Streaming from", {container, key, url});
		return requestBase.get({url: url, headers: this.baseHeaders } );
	}

	async list( container, prefix ){
		assert(container, "container");
		this.logger.trace("Listing", {container, prefix});
		const url = this.base + "/container/" + container + "?list=" + prefix;
		try {
			const prefixResults = await request({
				method: "GET",
				url: url,
				headers: Object.assign({
					'X-Mud-Type': 'Immediate'
				}, this.baseHeaders),
				json: true
			});

			this.logger.trace("Prefix results", prefixResults);
			return prefixResults;
		}catch (e) {
			if( e.statusCode == 403 ){
				throw new Error("Forbidden -- " + e.options.method  + " " + e.options.url);
			}else {
				throw e;
			}
		}
	}
}

module.exports = {
	MudHTTPClient
};
