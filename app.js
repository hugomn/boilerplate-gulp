var express = require('express')
var serveStatic = require('serve-static')

var app = express();

app.use(serveStatic('dist'));
app.listen(80);
console.log("=====================================")
console.log("Express server listening on port 80");
console.log("=====================================")
