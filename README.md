#pk_thincore
A Simple Middleware to do api key validation and response handling

# Getting Started
First install the library as below
```
npm install pkthincore
```

In your app.js file intialize the ThinCore as below:

```javascript
import pkThincore from 'pkthincore';

// 1st Param is MONGO db connection string
// 2nd Param is the header field to be checked for api key
// 3rd param is mongo collection to be checked for api key
// 4th param is the property in the collection to be checked for api key
// 5th, 6th, 7th and 8th params are he error codes and error messages for missing and invalid api key respectively
pkThincore.initialize(config.dbconfig.conn_string,'pk-api-key','Clients','pk_api_key',1002,'No API Key Provided',1003,'Invalid API key provided')
var app = pkThincore.app;


// Keep your api routes here
// app.use('/v4/users', users);

// In the last, call the following method to use the responseHandler
pkThincore.responseHandler();


```


