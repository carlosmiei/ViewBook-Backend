
var passport = require('passport')
var localStrategy = require('passport-local').Strategy
var UserModel = require('../models/utilizadores')

// Registo de um utilizador
passport.use('registo', new localStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try{
        var user = await UserModel.create({email, password})
        return done(null, user)
    }
    catch(error){
        return done(error)
    }
}))

// Login de utilizadores
passport.use('login', new localStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try{
        console.log('Entrei no try!');
        var user = await UserModel.findOne({email:email})
        console.log('Passei user')
        if(!user) 
            return done(null, false, {message: 'Utilizador não existe!'})

        var valid = await user.isValidPassword(password)
        if(!valid)
            return done(null, false, {message: 'Password inválida!'})

        var nossouser = user.toObject()
        console.dir(nossouser)

        return done(null, nossouser, {message: 'Login feito com sucesso.'})

    }
    catch(error){
        console.log('entrei no erro!');
        return done(error)
    }
}))

// Autenticação com JWT
var JWTStrategy = require('passport-jwt').Strategy
var ExtractJWT = require('passport-jwt').ExtractJwt

var extractFromSession = function(req){
    var token = null
    if(req && req.headers && req.headers.authorization) token = req.headers.authorization
    else
        if(req && req.session) token = req.session.token
    
    //console.log('TOKEN NA JWT: ' + token)
    //console.dir(req)
    return token
}

passport.use(new JWTStrategy({
    secretOrKey: 'dweb2018',
    jwtFromRequest: ExtractJWT.fromExtractors([extractFromSession])
}, async (token, done) => {
    try{
        //console.log('ANTESUSEPASS')
        //console.dir(token)
        return done(null, token.user)
    }
    catch(error){
        return done(error)
    }
}))