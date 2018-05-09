# FOG Mud Client

A JavaScript library and command line client for accessing resources stored within a Mud system.  Mud is a family cloud
storage system intended to be owned an operated by interested individuals.  A client only needs to be aware of how to
contact the Mud instance.

## Origin of the name

In the California Central Valley we get thick fog named Tule Fog.  Despite being very dry during the summers the clay
soil will become muddy and hang on to the moisture, increasing the density of the Fog.

## CLI Usage
TODO: Add a bin stub to the client to avoid needing to invoke `node` directly

```bash
> node cli put example-container some/key/name some-value
> node cli get example-container some/key/name
some-value
```

## API Usage

```javascript
const logger = bunyan.createLogger({name: "mud-client"});
const client = new MudHTTPClient( "http://localhost:9977", logger );
await client.store_value("example-container", "example/key", "some-value");
const value = await client.get_value("example-container", "example/key");
logger.info("Value ", value);
```