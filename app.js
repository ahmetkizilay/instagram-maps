(function () {
    var application_root = __dirname,
        express = require('express'),
        path = require('path'),
        https = require('https'),
        config = require('./config'),
        app = express();


    var post_req_handler = function (longUrl, onsuccess, onfail) {
        var post_data = {
            'longUrl': config.base_url + longUrl,
            'key': config.key
        };

        var post_options = {
            host: 'www.googleapis.com',
            port: 443,
            path: '/urlshortener/v1/url',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        var post_req = https.request(post_options, function (res) {
            var output = '';

            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function () {
                onsuccess(res.statusCode, output);
            });
        });

        post_req.on('error', function (err) {
            console.log('problem with request', err.message);
            onfail({msg: e.message});
        });

        post_req.write(JSON.stringify(post_data));
        post_req.end();
    };

    app.configure(function() {
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.static(path.join(application_root, "public")));
    });

    app.get('/url', function (req, res) {
        var q = req.query.q;

        if(q === undefined) {
            res.status(400).send({msg: 'q param is not specified'});
        }

        post_req_handler(q, function (statusCode, data) {
            res.status(statusCode).send(data);
        }, function (err) {
            console.dir(err);
            res.status(500).send(err);
        });
    });

    app.listen(process.env.PORT || 2424);

}).call(this);
