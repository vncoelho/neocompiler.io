var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var compile = require('./routes/compile');

var app = express();

app.set('port', 8000 || process.env.PORT);
//app.use(express.bodyParser()); // Automatically parses form data

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/compile', compile);

//app.use(express.bodyParser());
// parse urlencoded request bodies into req.body
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

//var cors = require('cors');
//app.use(cors());


app.post('/compilex', function(req, res) {
  // Specifies which URL to listen for
  // req.body -- contains form data
  //console.log("req.body.codesend='"+req.body.codesend+"'");

 if(!process.env.DOCKERNEOCOMPILER) {
  console.log("Error! No DOCKERNEOCOMPILER variable is set!\n");
  var msg64 = new Buffer("Unable to communicate with backend compiler. Please try again later.",'ascii').toString('base64');
  var msgret = "{\"output\":\""+msg64+"\",\"avm\":\"\",\"abi\":\"\"}";
  //console.log("output is: '"+msgret+"'");
  res.send(msgret);
 }
 else {
  var code64 = new Buffer(req.body.codesend, 'ascii').toString('base64');
  var cmddocker = "docker run -e COMPILECODE="+code64+" -t --rm $DOCKERNEOCOMPILER";
  var outp = "";
  outp = require('child_process').execSync(cmddocker).toString();
  //console.log("returning json..."+outp);
  //console.log("output is: '"+outp+"'");
  //res.send(JSON.stringify(outp));
  res.send(outp);
 }
});

app.post('/deployx', function(req, res) {
  var codeavm = new Buffer(req.body.codeavm, 'ascii').toString('base64');
  var contracthash = new Buffer(req.body.contracthash, 'ascii').toString('base64');
  var contractparams = new Buffer(req.body.contractparams, 'ascii').toString('base64');
  var contractreturn = new Buffer(req.body.contractreturn, 'ascii').toString('base64');

  var cbx_storage = "False";
  if(req.body["cbx_storage"])
     cbx_storage = "True";
  cbx_storage=new Buffer(cbx_storage, 'ascii').toString('base64');

  var cbx_dynamicinvoke = "False";
  if(req.body["cbx_dynamicinvoke"])
     cbx_dynamicinvoke = "True";
  cbx_dynamicinvoke=new Buffer(cbx_dynamicinvoke, 'ascii').toString('base64');

  var cmddocker = 'docker exec -t neo-privnet-with-gas dash -i -c "./execimportcontract.sh '+
       contracthash+' '+codeavm+' '+ contractparams + ' ' +contractreturn + ' ' +cbx_storage + ' ' +cbx_dynamicinvoke + '" | base64';
  var outp = "";

  console.log(cmddocker);
  outp = require('child_process').execSync(cmddocker).toString();
  outp = outp.replace(/(\r\n|\n|\r)/gm,"");

  //outp_str = new Buffer(outp, 'base64').toString('ascii');
  //outp = new Buffer(outp_str, 'ascii').toString('base64');
  //console.log(outp_str);

  outp = '{"output":"'+outp+'"}';
  //console.log(outp);
  //res.send(JSON.stringify(outp));
  //res.send(outp);
  //res.send(JSON.parse(outp));
  res.send(JSON.parse(outp));
});


//docker exec -t neo-privnet-with-gas dash -i -c "./execimportcontract.sh M2ZlMTY2ZTczMzIwYTVlZDNmZTg0YTFkNjhlMmRlMmE2YTk1YmJiZAo= MDBjNTZiNjE2Yzc1NjYK IiIK MDEK RmFsc2UK RmFsc2UK" > saida.log

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
