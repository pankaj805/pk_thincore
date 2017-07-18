'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _mongodb = require('mongodb');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _bluebird2.default(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _bluebird2.default.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var app = (0, _express2.default)();

app.use(require('cors')());
app.use(_bodyParser2.default.json());
app.use(_bodyParser2.default.urlencoded({ extended: false }));

var CONN_STR, HEADER_API_KEY_FIELD, CLIENT_COLL_NAME, API_FIELD, MISS_API_ERR_CODE, MISS_API_ERR_MSG, INVALID_API_ERR_CODE, INVALID_API_ERR_MSG;

var dbConnection;

var initialize = function () {
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(mongoConnString, headerAPikey, clientCollectionName, apiKeyField, MissingApiKeyErrCode, MissingApiKeyErrMsg, InvalidApiKeyErrorCode, InvalidApiKeyErrorMsg) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:

                        CONN_STR = mongoConnString;
                        HEADER_API_KEY_FIELD = headerAPikey + '';
                        CLIENT_COLL_NAME = clientCollectionName + '';
                        API_FIELD = apiKeyField + '';
                        MISS_API_ERR_CODE = MissingApiKeyErrCode;
                        MISS_API_ERR_MSG = MissingApiKeyErrMsg;
                        INVALID_API_ERR_CODE = InvalidApiKeyErrorCode;
                        INVALID_API_ERR_MSG = InvalidApiKeyErrorMsg;

                        initializeMongoConnection().then(function (db) {
                            dbConnection = db;
                        }).catch(function (err) {
                            console.log('Error connecting to db', err);
                        });

                        app.use(function () {
                            var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(req, res, next) {
                                var url, httpMethod, apiKey, clientInfo;
                                return regeneratorRuntime.wrap(function _callee$(_context) {
                                    while (1) {
                                        switch (_context.prev = _context.next) {
                                            case 0:

                                                console.log(' ********** : In request handler of pkSimpleCore');

                                                url = req.originalUrl;
                                                httpMethod = req.method;
                                                apiKey = req.header(HEADER_API_KEY_FIELD);

                                                if (!(url.indexOf("healthcheck") > -1)) {
                                                    _context.next = 8;
                                                    break;
                                                }

                                                res.status(200).send("OK");
                                                _context.next = 23;
                                                break;

                                            case 8:
                                                if (apiKey) {
                                                    _context.next = 12;
                                                    break;
                                                }

                                                return _context.abrupt('return', res.status(401).send({
                                                    "ok": false,
                                                    "error": {
                                                        "code": MissingApiKeyErrCode,
                                                        "reason": MissingApiKeyErrMsg
                                                    }
                                                }));

                                            case 12:
                                                _context.prev = 12;
                                                _context.next = 15;
                                                return isValidAPIKey(apiKey);

                                            case 15:
                                                clientInfo = _context.sent;

                                                res.clientInfo = clientInfo;

                                                _context.next = 23;
                                                break;

                                            case 19:
                                                _context.prev = 19;
                                                _context.t0 = _context['catch'](12);

                                                console.log(_context.t0);
                                                return _context.abrupt('return', res.status(401).send({
                                                    "ok": false,
                                                    "error": {
                                                        "code": InvalidApiKeyErrorCode,
                                                        "reason": InvalidApiKeyErrorMsg
                                                    }
                                                }));

                                            case 23:

                                                next();

                                            case 24:
                                            case 'end':
                                                return _context.stop();
                                        }
                                    }
                                }, _callee, undefined, [[12, 19]]);
                            }));

                            return function (_x9, _x10, _x11) {
                                return _ref2.apply(this, arguments);
                            };
                        }());

                    case 10:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, undefined);
    }));

    return function initialize(_x, _x2, _x3, _x4, _x5, _x6, _x7, _x8) {
        return _ref.apply(this, arguments);
    };
}();

var initializeMongoConnection = function initializeMongoConnection() {
    return new _bluebird2.default(function (resolve, reject) {
        _mongodb.MongoClient.connect(CONN_STR, function (err, db) {
            if (err) {
                return reject(err);
            }
            console.log("successfully connected to mongo:");
            resolve(db);
        });
    });
};

function isValidAPIKey(apiKey) {
    return new _bluebird2.default(function (resolve, reject) {
        console.log({ apiKey: apiKey }, 'Validating API key...in field :', API_FIELD, ' : in collection :', CLIENT_COLL_NAME);

        var query = {};
        query[API_FIELD] = apiKey;
        dbConnection.collection(CLIENT_COLL_NAME).findOne(query, function (err, client) {
            if (err) {
                console.log('Err:', { error: err });
                reject(err);
            } else {
                console.log({ client: client });
                if (!client) {
                    console.log({ apiKey: apiKey }, 'No client found!');
                    reject(new Error('InvalidAPIKey'));
                } else {
                    console.log('API key is valid');
                    resolve(client);
                }
            }
        });
    });
}

var responseHandler = function responseHandler() {
    //Success Logger
    app.use(function (req, res, next) {

        if (!res.data) {
            res.status(404).send();
            return;
        }

        res.status(res.statusCode || 200).send({ status: true, response: res.data });
    });

    //Error Logger
    app.use(function (err, req, res, next) {

        res.status(err.status || 500).send({
            status: false,
            error: {
                code: err.code || 1000,
                reason: err.message
            }
        });
    });
};

module.exports = {
    app: app,
    initialize: initialize,
    responseHandler: responseHandler
};