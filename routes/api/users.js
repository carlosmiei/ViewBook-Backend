var express = require('express')
var router = express.Router()
const fs = require('fs')
var passport = require('passport')
var jwt = require('jsonwebtoken')
const User = require('../../controllers/Utilizadores')
const formidable = require('formidable')
const mv = require('mv')

router.post('/registo', (req, res) => {
    // tenho de  por isto a usar o formidable
    var form = new formidable.IncomingForm()
    form.parse(req, (erro, fields, files) => {
        
        let utilizador = fields
        console.dir(utilizador)
        utilizador.morada = JSON.parse(utilizador.morada)
    
        //NECESSARIO CIFRAR A PASSWORD!
        
        utilizador.fotos = []
        utilizador.publicacoes = []
        utilizador.amigos = []
        utilizador.pedidosAmizade = []
        utilizador.fotos.push({
            id: files.foto.name,
            formato: files.foto.type,
            data: Date.now()
        })
        const fantigo = files.foto.path
        const nomeFicheiro = files.foto.name
        User.inserir(utilizador)
            .then(dados => {
                //VOu ter de criar uma pasta com o nome do utilizador ... Vai ter de ficar um public/upload
                let diretorio = __dirname + '/../../public/upload/' + dados._doc._id
                fs.mkdirSync(diretorio)
                let pastaFotos = diretorio + '/Fotos'
                fs.mkdirSync(pastaFotos)
                let fnovo = pastaFotos + '/' + nomeFicheiro
                fs.rename(fantigo, fnovo, erroRename => {
                    if(erroRename){
                        //tentativa com o mv
                        mv(fantigo, fnovo, erroMV => {
                            if(erroMV){
                                console.log('Nao foi possivel guardar a publicacao com o mv e o fs.rename: ' + erroMV + ' ------- ' + erroRename)
                                res.status(500).send('Nao foi possivel guardar a publicacao com o mv e o fs.rename: ' + erroMV + ' ------- ' + erroRename)
                            }else{
                                console.log('Ja adicionei um ficheiro com o MV à sua pasta: ' + fnovo)
                                res.jsonp(dados)
                            }
                        })
                    }else{
                        console.log('Ja adicionei um ficheiro à sua pasta: ' + fnovo)
                        res.jsonp(dados)
                    }
                })
            })
            .catch(erro => {console.log(erro); res.status(500).jsonp('Erro a criar utilizador! ' + erro)})
    })
    
})

// Login de um utilizador
router.post('/login', async (req, res, next) => {
    passport.authenticate('login', async (err, user, info) => {     
        try {
            // nao verificar o user pq nao o tou a passar no auth.js
            if(err || !user){
                if(err)
                    return res.status(500).jsonp(err)
                else {
                    console.log('User nao existe')
                    return res.status(500).jsonp('Nome de utilizador/Palavra-passe inválidos!')
                }
            }
            req.login(user, { session : false }, async (error) => {
                if( error ) {
                    console.log('Erro')
                    return res.status(500).jsonp(err)
                }
                // Geração do token
                var token = jwt.sign({ user : {email: user.email, nome: user.nome, id: user._id} },'dweb2018');
                req.session.token = token
                let resposta = {
                    token: token,
                    id: user._id,
                    nome: user.nome
                }
                //res.redirect('/api/login');
                //res.write(200,{'Content-Type':'text/html'})
                res.status(200).jsonp(resposta);
                
            });     
        } 
        catch (error) {
            return next(error);
        }
    })(req, res, next);
});


//aqui o login tem de receber o id tmb maybe?
router.get('/login/:id', (req, res) => {
    let id = req.params.id
    // nao sei qual e a funcao q dara isto
    User.consultarUser(id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).jsonp('Erro a consultar utilizador!'))
})


module.exports = router