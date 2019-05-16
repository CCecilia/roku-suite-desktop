class Ingestor {

    constructor() {
        const logger = require('express-logger');
        const EventEmitter = require('events');
        class AnalyticsEmitter extends EventEmitter {}
        const emitter = new AnalyticsEmitter();
        this.emitter = emitter;
    
        const express = require("express");
        const bodyParser = require("body-parser");
        const app = express();
    
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(logger({path: __dirname + "/logs/logfile.txt"}));
    
        app.post("/v1/track", function(req, res) {
            res.status(200).send("received");
            console.dir(req.body);
            console.log(req.body.properties.event_name + ' event registered');
            emitter.emit('update', JSON.stringify(req.body));
        });
    
        const server = app.listen(3000, function () {
            console.log("app running on port.", server.address().port);
        });
    }

}

module.exports = () => { return new Ingestor() };



