var express = require('express')
var router = express.Router()
var querystring = require('querystring')
var formidable = require('formidable')
var axios = require('axios')
var passport = require('passport');
var mongoose = require('mongoose')
const mv = require('mv')
const bcrypt = require('bcrypt')
var UserModel = require('../../models/utilizadores')
const fs = require('fs')



const Perfil = require('../../controllers/Utilizadores')

router.get('/:id', passport.authenticate('jwt', {session: false}),
(req, res) => {
    let idUtlizador = req.user.id
    
    Perfil.consultar(req.params.id, idUtlizador)
        .then(dados => {
            res.jsonp(dados)
        })
        .catch(erro => {console.log(erro); res.status(500).jsonp('Deu erro a consultar as informações do ' + req.params.id )})
})

router.get('/foto/:id', passport.authenticate('jwt', {session: false}), (req, res) => {

    //Sera o da sessao
    let user = req.user.id

    let id = req.params.id
    Perfil.consultarFotos(id, user)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).jsonp('Houve um erro consultar as fotos do utilizador:  ' + id))
})

router.get('/infoTotal/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
    //Sera o da sessao
    let user = req.user.id

    let id = req.params.id
    Perfil.consultarTodasInformacoes(id)
        .then(dados => {
            res.jsonp(dados)
        })
        .catch(erro =>{
                    res.status(500).jsonp('Houve um erro consultar as informaçoes do perfil do utilizador:  ' + id)
                })
})

router.get('/info/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
    //Sera o da sessao
    let user = req.user.id

    let id = req.params.id
    Perfil.consultarInformacoes(id, user)
        .then(dados => {
            res.jsonp(dados)
        })
        .catch(erro =>{
                    res.status(500).jsonp('Houve um erro consultar as informaçoes do perfil do utilizador:  ' + id)
                })
})

router.post('/foto', passport.authenticate('jwt', {session: false}), (req, res) => {

    // tenho de  por isto a usar o formidable
    var form = new formidable.IncomingForm()
    form.parse(req,(erro,fields,files)=>{
        let user = req.user.id
        var fenviado = files.ficheiro.path
        var fnovo=  files.ficheiro.name
        fs.rename(fenviado,fnovo,function(err){
            if (!err) {
                
                Perfil.adicionaFoto(user,fnovo)
                .then(dados => res.jsonp(dados))
                .catch(erro => res.jsonp('Erro ao adicionar uma nova foto..!'))
            
            }else {
                //res.write() erro
                res.end()
            }

        })
    })
  
})

router.post('/novaPub', passport.authenticate('jwt', {session: false}), (req, res) => {
    Perfil.adicionaPub(req.body.user, req.body.publicacao)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.jsonp('Erro ao criar uma nova publicacao no utilizador!'))
})

router.post('/adicionaPedido', passport.authenticate('jwt', {session: false}), (req, res) => {
    let nome = req.body.nome
    let id = req.body.id

    if(nome && id){
        let to = {
            id: id,
            nome: nome
        }

        let from = {
            id: req.user.id,
            nome: req.user.nome
        }

        let pedido = {
            from: from,
            to: to
        }

        Perfil.adicionaPedidoAmizade(id,pedido,from)
        .then(dados => {
            
            Perfil.adicionaPedidoAmizade(req.user.id,pedido,to)
            .then(dados => {
                let notificacao = {
                    vista: false,
                    tipo: 'amizade', 
                    idUtlizador: from.id,
                    texto: 'Recebeu um pedido de amizade do utilizador ' + from.nome
                }
                Perfil.adcionaNotificacao(to.id,notificacao)
                .then(dados => res.jsonp(dados))
                .catch(erro => res.status(500).jsonp(erro))
            })
            .catch(erro => res.status(500).jsonp(erro))
        })
        .catch(erro => res.status(500).jsonp(erro))
    }
    else{
        res.status(500).jsonp('Erro ao inserir amizade!')
    }
})

router.post('/aceitaPedido', passport.authenticate('jwt', {session: false}), (req, res) => {
    let nome = req.body.nome
    let id = req.body.id

    if(nome && id){
        let from = {
            id: id,
            nome: nome
        }

        let to = {
            id: req.user.id,
            nome: req.user.nome
        }

        let pedido = {
            from: from,
            to: to
        }


        Perfil.aceitaPedidoAmizade(id,pedido,to)
        .then(dados => {
            
            Perfil.aceitaPedidoAmizade(req.user.id,pedido,from)
            .then(dados => {
                let notificacao = {
                    vista: false,
                    tipo: 'amizade', 
                    idUtlizador: to.id,
                    texto: 'O utilizador ' + to.nome + ' aceitou o seu pedido de amizade'
                }
                Perfil.adcionaNotificacao(from.id,notificacao)
                .then(dados => res.jsonp(dados))
                .catch(erro => res.status(500).jsonp(erro))
            })
            .catch(erro => res.status(500).jsonp(erro))
        })
        .catch(erro => res.status(500).jsonp(erro))
    }
    else{
        res.status(500).jsonp('Erro ao inserir amizade!')
    }
})

router.post('/recusaPedido', passport.authenticate('jwt', {session: false}), (req, res) => {
    let nome = req.body.nome
    let id = req.body.id

    if(nome && id){
        let to = {
            id: id,
            nome: nome
        }

        let from = {
            id: req.user.id,
            nome: req.user.nome
        }
        let pedido = {}
        if(!req.body.recusa){
            pedido = {
                from: from,
                to: to
            }
        }
        else{
            pedido = {
                to: from,
                from: to
            } 
        }
        
        Perfil.recusaPedidoAmizade(id,pedido)
        .then(dados => {
            
            Perfil.recusaPedidoAmizade(req.user.id,pedido)
            .then(dados => {
                if(!req.body.notificacao){
                    res.jsonp(dados)
                }
                else{
                    let notificacao = {
                    vista: false,
                    tipo: 'amizade', 
                    idUtlizador: to.id,
                    texto: 'O utilizador ' + to.nome + ' recusou o seu pedido de amizade'
                }
                Perfil.adcionaNotificacao(from.id,notificacao)
                .then(dados => res.jsonp(dados))
                .catch(erro => res.status(500).jsonp(erro))
            }
            })
            .catch(erro => {console.dir(erro);res.status(500).jsonp(erro)})
            
        })
        .catch(erro => {console.dir(erro);res.status(500).jsonp(erro)})
    }
    else{
        res.status(500).jsonp('Erro ao inserir amizade!')
    }
})

router.post('/removeAmizade', passport.authenticate('jwt', {session: false}), (req, res) => {
    let nome = req.body.nome
    let id = req.body.id

    if(nome && id){
        let to = {
            id: id,
            nome: nome
        }

        let from = {
            id: req.user.id,
            nome: req.user.nome
        }

        Perfil.removeAmizade(id,from)
        .then(dados => {
            
            Perfil.removeAmizade(req.user.id,to)
            .then(dados => res.send(dados))
            .catch(erro => res.status(500).jsonp(erro))
        })
        .catch(erro => res.status(500).jsonp(erro))
    }
    else{
        res.status(500).jsonp('Erro ao inserir amizade!')
    }
})

router.post('/veNotificacoes',passport.authenticate('jwt', {session: false}), (req, res) => {
    Perfil.veNotificacoes(req.user.id,req.body.notificacoes.map(a => a._id))
    .then(dados => {res.jsonp(dados)})
    .catch(erro => {res.status(500).jsonp(erro)})
})

router.post('/novaFoto',passport.authenticate('jwt',{session: false}), (req, res) => {
    var form = new formidable.IncomingForm()
    form.parse(req, (erro, fields, files) => {
        let utilizador = fields.id

        let foto = {
            id: files.foto.name,
            formato: files.foto.type,
            data: Date.now()
        }
        let fantigo = files.foto.path
        let diretorio = __dirname + '/../../public/upload/' + utilizador
        let pastaFotos = diretorio + '/Fotos'
        let fnovo = pastaFotos + '/' + foto.id

        Perfil.adicionaFoto(utilizador,foto)
        .then(dados => {

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
        .catch(erro => { res.status(500).jsonp(erro)})

    })

})

router.post('/alteraInfo',passport.authenticate('jwt',{session: false}), async (req, res) => {
    let utilizador = req.body
    //console.dir(utilizador)

    try{
        if(utilizador.passwordAntiga){
        var user = await UserModel.findOne({_id:utilizador._id})
        if(!user){
            res.status(500).jsonp('Erro, utilizador inexistente')
            return
        }
        else{
            var valid = await user.isValidPassword(utilizador.passwordAntiga)
            if(!valid){
                res.status(500).send('Erro, password inválida')
                return
            }
            else{
                var hash = await bcrypt.hash(utilizador.passwordNova, 10)
                utilizador.password = hash
                Perfil.informacoes(utilizador)
                    .then(dados => res.jsonp(dados))
                    .catch(erro => res.status(500).send('Erro ao modificar as alterações, tente novamente daqui a 5 minutos!'))
            }
        }
        }else{
            Perfil.informacoes(utilizador)
                .then(dados => {res.jsonp(dados)})
                .catch(erro => res.status(500).send('Erro ao modificar as alterações, tente novamente daqui a 5 minutos!'))
            
        }
    }
    catch(erro){
        res.status(500).jsonp(erro)
        return
    }
        
})

//pesquisa por utilizadores por nome
router.get('/nome/:nome', (req, res) => {
    let nome = req.params.nome
    if(req.query.limite == undefined){
        Perfil.listarNome(nome)
        .then(dados => {
            res.jsonp(dados)
        })
        .catch(erro => {
            console.log(erro)
            res.status(500).jsonp('Erro na consulta de utilizadores por nomes')
        })
    }
    else{
        Perfil.listarNome(nome, req.query.limite)
        .then(dados => {
            res.jsonp(dados)
        })
        .catch(erro => {
            console.log(erro)
            res.status(500).jsonp('Erro na consulta de utilizadores por nomes')
        })
    }

    
})
// Nao sei mt bem como se faz o PUT
module.exports = router