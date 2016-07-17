"use strict";
var https = require("https");
var os = require("os");
var pjson = require("../package.json");

module.exports = WebHelper;

function WebHelper(credentials, hostName) {

    this.get = function (path, callback) {
        var options = {
            hostname: hostName,
            method: "GET",
            path: path,
            port: 443,
            headers: {
                "Api-Key": credentials.apiKey,
                "Accept": "application/json"
            }
        };
        if (credentials.apiKey && credentials.apiSecret) {
            credentials.getAccessToken(function (err, response) {
                if (err) {
                    return callback(err, null);
                }
                if (response.access_token) {
                    options.headers.Authorization = "Bearer " + response.access_token;
                }
                var request = beginRequest(options, callback);
                request.end();
            });
        } else {
            var request = beginRequest(options, callback);
            request.end();
        }
    };

    this.postForm = function (postData, path, callback) {
        var options = {
            hostname: hostName,
            method: "POST",
            path: path,
            port: 443,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": postData.length
            }
        };
        var request = beginRequest(options, callback);
        request.write(postData);
        request.end();
    };

    this.postQuery = function (path, data, callback) {
        credentials.getAccessToken(function (err, response) {
            if (err) {
                return callback(err, null);
            }
            var body = data ? JSON.stringify(data) : "";
            var options = {
                hostname: hostName,
                method: "POST",
                path: path,
                port: 443,
                headers: {
                    "Api-Key": credentials.apiKey,
                    "Authorization": "Bearer " + response.access_token,
                    "Content-Type": "application/json",
                    "Content-Length": body.length
                }
            };
            var request = beginRequest(options, callback);
            request.write(body);
            request.end();
        });
    };

    function beginRequest(options, callback) {
        addUserAgentString(options);
        return https.request(options, function (response) {
            var str = "";
            response.on("data", function (chunk) {
                str += chunk;
            });
            response.on("end", function () {
                if (response.statusCode === 404) {
                    var err = new Error("Not Found");
                    err.statusCode = response.statusCode;
                    return callback(err, null);

                }
                return callback(null, (str.length > 0) ? JSON.parse(str) : {});
            });
            response.on("error", function (err) {
                callback(err, null);
            });
            try {
                if (response.setEncoding) {
                    // This line will fail if the request is already broken (as for CORS issues)
                    response.setEncoding("utf8");
                }
            } catch (e) {
                return callback(e, null);
            }
        });
    }

    function addUserAgentString(options) {
        options.headers["User-Agent"] = "GettyImagesApiSdk/" + pjson.version + " (" + os.type() + " " + os.release() + "; Node.js " + process.version + ")";
    }
}
