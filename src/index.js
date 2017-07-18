import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import {MongoClient} from 'mongodb';
import Promise from 'bluebird';
import _ from 'underscore';

let app = express();

app.use(require('cors')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var CONN_STR,HEADER_API_KEY_FIELD, CLIENT_COLL_NAME, 
        API_FIELD, MISS_API_ERR_CODE,MISS_API_ERR_MSG,
        INVALID_API_ERR_CODE,INVALID_API_ERR_MSG;

var dbConnection;

let initialize = async (mongoConnString,headerAPikey, clientCollectionName , apiKeyField, MissingApiKeyErrCode,MissingApiKeyErrMsg,InvalidApiKeyErrorCode,InvalidApiKeyErrorMsg) =>{

    CONN_STR = mongoConnString;
    HEADER_API_KEY_FIELD = headerAPikey+'';
    CLIENT_COLL_NAME = clientCollectionName +'';
    API_FIELD = apiKeyField+'';
    MISS_API_ERR_CODE = MissingApiKeyErrCode;
    MISS_API_ERR_MSG = MissingApiKeyErrMsg;
    INVALID_API_ERR_CODE = InvalidApiKeyErrorCode;
    INVALID_API_ERR_MSG = InvalidApiKeyErrorMsg;

    initializeMongoConnection()
        .then(function (db) {
            dbConnection = db;
        })
        .catch(function (err) {
            console.log('Error connecting to db', err);
        });
    
    app.use(async (req,res,next)=>{

        console.log(' ********** : In request handler of pkSimpleCore');

        var url = req.originalUrl;
        var httpMethod = req.method;
        var apiKey = req.header(HEADER_API_KEY_FIELD);

        if (url.indexOf("healthcheck") > -1) {
            res.status(200).send("OK");
        }else{
            if (!apiKey) {
                return res.status(401).send({
                     "ok": false,
                     "error": {
                        "code": MissingApiKeyErrCode,
                        "reason": MissingApiKeyErrMsg
                     }    
                });
            }else{
                try{
                    let clientInfo = await isValidAPIKey(apiKey);
                    res.clientInfo = clientInfo;

                }catch(err){
                    console.log(err);
                    return res.status(401).send({
                        "ok": false,
                        "error": {
                            "code": InvalidApiKeyErrorCode,
                            "reason": InvalidApiKeyErrorMsg
                        }    
                    });
                }

            }

        }

        next();
    })

}

let  initializeMongoConnection = () => {
    return new Promise(function (resolve, reject) {
        MongoClient.connect(CONN_STR, function (err, db) {
            if (err) {
                return reject(err);
            }
            console.log("successfully connected to mongo:");
            resolve(db);
        });
    });
}

function isValidAPIKey(apiKey) {
    return new Promise(function (resolve, reject) {
        console.log({apiKey: apiKey}, 'Validating API key...in field :',API_FIELD, ' : in collection :',CLIENT_COLL_NAME);

        let query ={};
        query[API_FIELD] = apiKey;
        dbConnection.collection(CLIENT_COLL_NAME).findOne(query, function (err, client) {
            if (err) {
                console.log('Err:',{error: err});
                reject(err);
            } else {
                console.log({client: client});
                if (!client) {
                    console.log({apiKey: apiKey}, 'No client found!');
                    reject(new Error('InvalidAPIKey'));
                } else {
                    console.log('API key is valid');
                    resolve(client);
                }
            }
        });
    });
}

var responseHandler = function () {
    //Success Logger
    app.use(function (req, res, next) {

        if (!res.data) {
            res.status(404).send();
            return;
        }
        res.status(res.statusCode || 200).send(res.data);
    });

    //Error Logger
    app.use(function (err, req, res, next) {
        console.log(' ********** : Error occured in responseHandler :',err);
        res.status(err.statusCode || 500).send(res.data);

    });
};

module.exports = {
    app:app,
    initialize:initialize,
    responseHandler:responseHandler
}
