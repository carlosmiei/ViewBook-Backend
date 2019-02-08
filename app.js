var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');



var passport = require('passport')
var uuid = require('uuid/v4')
var session = require('express-session')
var FileStore = require('session-file-store')(session)

require('./auth/auth')


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const perfilAPIRouter = require('./routes/api/perfil')
const pubsAPIRouter = require('./routes/api/pubs')
const feedAPIRouter = require('./routes/api/feed')
const hashtagAPIRouter = require('./routes/api/hashtag')
const usersAPIRouter = require('./routes/api/users')

var app = express();

//Base de dados
mongoose.connect('mongodb://daw:daw2019@ds231374.mlab.com:31374/viewbook', {useNewUrlParser: true})
  .then(() => console.log('Mongo ready: ' + mongoose.connection.readyState))
  .catch(error => console.error('Erro conexao: ' + error))

// Configuração da sessão
app.use(session({
  genid: () => {
    return uuid()},
  store: new FileStore(),
  secret: 'dweb2018',
  resave: false,
  saveUninitialized: true
}))

// Inicialização do passport
app.use(passport.initialize())
app.use(passport.session())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


var cors = require('cors');
app.use(cors({origin: 'http://localhost:8080'}));

//app.use('/', indexRouter);
//app.use('/users', usersRouter);

app.use('/api/perfil', perfilAPIRouter)
app.use('/api/pubs', pubsAPIRouter)
app.use('/api/feed', feedAPIRouter)
app.use('/api/hashtag', hashtagAPIRouter)
app.use('/api/users', usersAPIRouter)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
