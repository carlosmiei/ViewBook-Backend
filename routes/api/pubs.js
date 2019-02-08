const express = require('express')
const router = express.Router()
const querystring = require('querystring')
const formidable = require('formidable')
const axios = require('axios')
const mv = require('mv')
const fs = require('fs')
const Publicacao = require('../../controllers/Publicacoes')
const Utilizador = require('../../controllers/Utilizadores')
var passport = require('passport');
var jwt = require('jsonwebtoken');

/**
 * Neste router já vai estar consumida a parte do api/pubs !
 * Logo cada pedido só tem de começar com o /
 */

 /**
  * Dá o array de publicações associada a uma carateristica:
  * Tipo; Com ou sem limite? Se tiver limite tem de vir no req.param?
  */
daToken = req => {
    if(req && req.headers && req.headers.authorization) token = req.headers.authorization
    else
        if(req && req.session) token = req.session.token
    return token
}

router.get('/', passport.authenticate('jwt', {session: false}), (req, res) => {
   
    
    
    //Sacar da ssesao
    let user = req.user.id
    
    if(req.query.tipo != undefined){
        if(req.query.limite == undefined){
            Publicacao.listarTipo(req.query.tipo,user)
                .then(dados => res.jsonp(dados))
                .catch(erro => res.status(500).send('Erro na listagem de um estado: ' + erro))
        }else{
            console.log('Vou sacar uma publicacao com tipo com limite')
            Publicacao.listarTipo(req.query.tipo,user, parseInt(req.query.limite)/** tipo, limite, user */)
                .then(dados => res.jsonp(dados))
                .catch(erro => res.status(500).send('Erro na listagem de um estado com limite: ' + erro))
        }
    }
    else{
        if(req.query.limite != undefined){
            res.redirect('/api/feed?limite='+req.query.limite)
            /*axios.get('http://localhost:3000/api/feed?limite='+req.query.limite)
                .then(dados => res.jsonp(dados))
                .catch(erro => res.status(500).jsonp(erro))*/
        }else{
            res.redirect('/api/feed/')
            /*axios.get('http://localhost:3000/api/feed/')
                .then(dados => {console.dir(dados); res.jsonp(dados)})
                .catch(erro => {console.log('DEU ERRO AQUI'); res.status(500).jsonp(erro)})*/
        }
    }
})

/**
 * Retorna a publicacão do respetivo id
 * NECESSARIO COLOCAR ESTA EM ULTIMO DOS GETS!!!!
 */
router.get('/:id', passport.authenticate('jwt', {session: false}), (req, res) => {

    //Sacar da ssesao
    let user = req.user.id
    let id = req.params.id
    Publicacao.consultar(id,user)
        //Vai ser um array os dados? Para já trabalhamos com o findOne
        .then(dados => res.json(dados))
        .catch(erro => {
            console.log(erro)
            res.status(500).send('Houve um erro ao obter a seguinte publicacao ' + id)
        })
            
})

/**
 * Insere uma nova publicacao na base de dados
 * Precisa também de atualizar as hashtag
 * 
 * Pressupostos:
 * Vou assumir que o req.body já tem uma estrutura com as hashtags carregadas ... Depois temos de ver se colocámos logo no front end ou entao o parsing ao texto é efetuado aqui
 * Vamos ter de usar o formidable por causa dos ficheiros ... Mas para já, como só vamos testar a API vou usar o req.body
 */
router.post('/', passport.authenticate('jwt', {session: false}), (req, res) => {
    var form = new formidable.IncomingForm()
    form.parse(req, (erro, fields, files) => {
        let expRegImage = /image/
        /**
         * No fields já vem o objeto sem qualquer ficheiro
         * No campo files é um objeto do tipo: {ficheiro1: {valores}, ficheiro2: {valores}}
         * Eu vou tratar dos ficheiros e depois vou mandar um array com os paths
         */
        
        //Vai guardar o nome dos ficheiros
        let arrayFicheiros = []
        let imagens = []
        //Vai guardar qual o indice do ficheiro correspondente
        let arrayCaminhosFiles = []
        let arrayCaminhosFotos = []
        for(let key in files){
            if(files[key].name){
                let f = {}
                f._id = files[key].name
                f.formato = files[key].type
                let result = expRegImage.test(files[key].type)
                if(result == true){
                    imagens.push(f)
                    arrayCaminhosFotos.push(files[key].path)
                }
                else{
                    arrayFicheiros.push(f)
                    arrayCaminhosFiles.push(files[key].path)
                }
            }
        }
        
        let pub = {}

        pub.status = fields.status
        pub.ficheiros = arrayFicheiros
        pub.fotos = imagens

        pub.tipo = JSON.parse(fields.tipo)
        pub.autor = {id:req.user.id, nome: req.user.nome}
        pub.likes = []
        pub.comentarios = []
        pub.hashtags = JSON.parse(fields.hashtags)
        pub.data = fields.data
        
        // res.jsonp("Feito")

        Publicacao.inserir(pub)
            .then(dados => {
                //Para cada elemento do array de hashtags tenho de mandar acrescentar a hashtag
                //O id da publicação vem nos dados._doc
                let promise = new Promise((resolve, reject) => {
                    let tamanhoHashtags = dados._doc.hashtags.length
                    let i = 0;
                    let token = daToken(req)
                    axios.post('http://localhost:3000/api/perfil/novaPub', {'publicacao': dados._doc._id, 'user': dados._doc.autor.id},{headers: {Authorization: token}})
                    .then(sucesso => {
                    if(dados._doc.hashtags.length==0){resolve(dados)}
                    dados._doc.hashtags.forEach(item => {
                        i++
                       
                        
                        axios.post('http://localhost:3000/api/hashtag/novaPub', {'publicacao': dados._doc._id, 'hashtag': item}, {headers: {Authorization: token}})
                            .then(d =>{ 
                                if(i == tamanhoHashtags){
                                    //Ja acabou de fazer as hashtags vou agora para o user
                                    
                                    resolve(dados)
                                    
                                }
                            })
                            .catch(e => {
                                console.log('Deu um erro na hashtag! ' + e)
                                reject(e)
                            })
                    })
                })
                .catch(erroPostUser => reject(erroPostUser))
                })

                let promiseEscreveFile = new Promise((resolve, reject) => {
                    let diretorio = __dirname + '/../../public/upload/' + dados._doc.autor.id + '/' + dados._doc._id
                        fs.mkdirSync(diretorio)
                        if(dados._doc.ficheiros.length == 0)
                            resolve(dados)
                        for(let i = 0; i<dados._doc.ficheiros.length; i++){
                            let fnovo = __dirname + '/../../public/upload/' + dados._doc.autor.id + '/' + dados._doc._id + '/' + dados._doc.ficheiros[i]._id
                            let fantigo = arrayCaminhosFiles[i]
                            fs.rename(fantigo, fnovo, erroRename => {
                                if(erroRename){
                                    //tentativa com o mv
                                    mv(fantigo, fnovo, erroMV => {
                                        if(erroMV){
                                            console.log('Nao foi possivel guardar a publicacao com o mv e o fs.rename: ' + erroMV + ' ------- ' + erroRename)
                                            reject('Nao foi possivel guardar a publicacao com o mv e o fs.rename: ' + erroMV + ' ------- ' + erroRename)
                                        }else{
                                            if(i+1 == dados._doc.ficheiros.length)
                                            resolve(dados)
                                            console.log('Ja adicionei um ficheiro com o MV à sua pasta: ' + fnovo)
                                        }
                                    })
                                }else{
                                    if(i+1 == dados._doc.ficheiros.length)
                                        resolve(dados)
                                    console.log('Ja adicionei um ficheiro à sua pasta: ' + fnovo)
                                }
                            })
                        }

                        for(let i = 0; i<dados._doc.fotos.length; i++){
                            let fnovo = __dirname + '/../../public/upload/' + dados._doc.autor.id + '/' + dados._doc._id + '/' + dados._doc.fotos[i]._id
                            let fantigo = arrayCaminhosFotos[i]
                            fs.rename(fantigo, fnovo, erroRename => {
                                if(erroRename){
                                    //tentativa com o mv
                                    mv(fantigo, fnovo, erroMV => {
                                        if(erroMV){
                                            console.log('Nao foi possivel guardar a publicacao com o mv e o fs.rename: ' + erroMV + ' ------- ' + erroRename)
                                            reject('Nao foi possivel guardar a publicacao com o mv e o fs.rename: ' + erroMV + ' ------- ' + erroRename)
                                        }else{
                                            if(i+1 == dados._doc.fotos.length)
                                            resolve(dados)
                                            console.log('Ja adicionei um ficheiro com o MV à sua pasta: ' + fnovo)
                                        }
                                    })
                                }else{
                                    if(i+1 == dados._doc.fotos.length)
                                        resolve(dados)
                                    console.log('Ja adicionei um ficheiro à sua pasta: ' + fnovo)
                                }
                            })
                        }

                })
                
                promise
                    .then(promiseEscreveFile)
                        .then(data => {
                            res.jsonp(data)
                            
                        })
                        .catch(erro => {
                            console.dir(erro)
                            res.status(500).jsonp(erro)
                        })


                //Depois disto tudo posso mandar os dados de volta para a interface*/
                //console.log('Foi adicionado com sucesso')
                //res.jsonp(dados)
            })
            .catch(erro => {console.log(erro); res.status(500).send('Erro ao inserir uma publicacao: ' + erro)})


    })

})

/**
 * Serve para gerar uma notificacao
 * Funciona quer seja para gosto, comenatario ...
 * idUtilizador -> id do utilizador
 * obj -> contem a informação de que se é notificacao para uma publicacao, comentario ou comentario aninhado
 * texto -> mensagem da notificacao
 * tipo -> tipo da notificacao
 */
function geraNotificacao(idUtilizador, obj, texto, tipo){

    let notificacoes = {}
    notificacoes.vista = false
    notificacoes.tipo = tipo
    notificacoes.publicacao = obj.publicacao
    if(obj.comentario)
        notificacoes.comentario = obj.comentario
    if(obj.comentarioAninhado)
        notificacoes.comentarioAninhado = obj.comentarioAninhado
    notificacoes.idUtilizador = idUtilizador
    notificacoes.texto = texto

    let promessa = new Promise((resolve, reject) => {
        let quantos = 0
        let tamanhoArray = obj.usersNotificados.length
        if(tamanhoArray == 0){
            resolve()
        }
        obj.usersNotificados.forEach(element => {
            Utilizador.adcionaNotificacao(element, notificacoes)
                .then(dados => {
                    quantos++;
                    if(quantos == tamanhoArray){
                        resolve()
                    }
                })
                .catch(erro => reject(erro))
        })
    })
    //Verificar este nome ...
    return promessa
        .then(dados => {return dados})
        .catch(erro => {throw erro})

}


/**
 * Adiciona um novo comentario
 */
router.post('/comment', passport.authenticate('jwt', {session: false}),
    (req, res) => {
    let comentarioShema = {}
    comentarioShema.data = req.body.data
    comentarioShema.corpo = req.body.corpo
    comentarioShema.likes = []
    /**
     * Como é que vamos fazer aqui? Vamos buscar o user ou entao vem no front end?
     */
    comentarioShema.autor = {id:req.user.id, nome: req.user.nome}
    comentarioShema.comentarioAninhado = []
    let idPub = req.body.publicacao
    Publicacao.adicionaComentario(idPub, comentarioShema)
        .then(dados => {
            let texto = 'O ' + req.user.nome + ' comentou uma publicação!'
            let obj = {
                publicacao: idPub,
                //comentario: req.body.comentario
                usersNotificados: req.body.usersNotificados 
            }
            //res.jsonp(dados)
            geraNotificacao(req.user.id, obj, texto, 'comentario')
                .then(() => {
                    Publicacao.consultarPub(idPub)
                        .then(dadosFinal => {
                            res.jsonp(dadosFinal)
                    })
                })
                .catch(erro => {
                    Publicacao.consultarPub(idPub)
                        .then(dadosFinal => {
                            res.jsonp(dadosFinal)
                    })
                })
        })
        .catch(erro => res.status(500).send('Erro ao inserir o comentario na pub ' + idPub))
})


router.post('/nestedComment', passport.authenticate('jwt', {session: false}),
    (req, res) => {
    let comentarioAninhadoShema = {}
    comentarioAninhadoShema.data = req.body.data
    comentarioAninhadoShema.corpo = req.body.corpo
    comentarioAninhadoShema.likes = []
    /**
     * Como é que vamos fazer aqui? Vamos buscar o user ou entao vem no front end?
     */
    comentarioAninhadoShema.autor = {id: req.user.id, nome: req.user.nome}
    let idPub = req.body.publicacao
    let idCom = req.body.comentario
    Publicacao.adicionaComentarioAninhado(idPub, idCom, comentarioAninhadoShema)
        .then(dados => {
            //console.dir(dados);
            //res.jsonp(dados)
            let texto = 'O ' + req.user.nome + ' respondeu a um comentário!'
            let obj = {
                publicacao: req.body.publicacao,
                comentario: req.body.comentario,
                //comentarioAninhado:
                usersNotificados: req.body.usersNotificados 
            }
            geraNotificacao(req.user.id, obj, texto, 'comentario')
                .then(() => {
                    Publicacao.consultarPub(idPub)
                        .then(dadosFinal => {
                            res.jsonp(dadosFinal)
                    })
                })
                .catch(erro => {
                    Publicacao.consultarPub(idPub)
                        .then(dadosFinal => {
                            res.jsonp(dadosFinal)
                    })
                })
        })
        .catch(erro => {
            console.log(erro)
            res.status(500).send('Erro ao inserir o comentario na pub ' + idPub)
        })
})

router.post('/gosto', passport.authenticate('jwt', {session: false}),
    (req, res) => {
        let user = {
            id: req.user.id,
            nome: req.user.nome
        }
        if(req.body.comentarioAninhado){
            Publicacao.acrescentaGostoComentarioAninhado(req.body.publicacao, req.body.comentario, req.body.comentarioAninhado, user)
                .then(dados => {
                    let texto = 'O ' + user.nome + ' colocou um gosto no seu comentário!'
                    geraNotificacao(user.id, req.body, texto, 'gosto')
                        .then(() => res.jsonp(dados))
                        .catch(erro => res.status(500).send('Gosto adicionado mas nem todos foram notificados: ' + erro))
                    
                })
                .catch(erro => res.status(500).send('Erro no gosto de comentario aninhado: ' + erro))
        }else{
            if(req.body.comentario){
                Publicacao.acrescentaGostoComentario(req.body.publicacao, req.body.comentario, user)
                    .then(dados => {
                        let texto = 'O ' + user.nome + ' colocou um gosto no seu comentário!'
                        geraNotificacao(user.id, req.body, texto, 'gosto')
                            .then(() => res.jsonp(dados))
                            .catch(erro => res.status(500).send('Gosto adicionado mas nem todos foram notificados: ' + erro))
                    })
                    .catch(erro => res.status(500).send('Erro no gosto de comentario: ' + erro))
            }else{
                if(req.body.publicacao){
                    Publicacao.acrescentaGostoPublicacao(req.body.publicacao, user)
                        .then(dados => {
                            let texto = 'O ' + user.nome + ' colocou um gosto na sua publicação!'
                            geraNotificacao(user.id, req.body, texto, 'gosto')
                                .then(() => res.jsonp(dados))
                                .catch(erro => res.status(500).send('Gosto adicionado mas nem todos foram notificados: ' + erro))
                        })
                        .catch(erro => {console.log('ERRO: ' + erro); res.status(500).send('Erro no gosto de publicacao: ' + erro)})
                }else{
                    console.log('Algo aqui correu muito mal com o GOSTOOOOOO!!')
                    res.status(500).send('Body errado!')
                }
            }
        }

})

router.post('/desgosto', passport.authenticate('jwt', {session: false}),
    (req, res) => {
        let user = {
            id: req.user.id,
            nome: req.user.nome
        }
        if(req.body.comentarioAninhado){
            Publicacao.retiraGostoComentarioAninhado(req.body.publicacao, req.body.comentario, req.body.comentarioAninhado, user)
                .then(dados => {
                    res.jsonp(dados)
                })
                .catch(erro => res.status(500).send('Erro ao retirar gosto de comentario aninhado: ' + erro))
        }else{
            if(req.body.comentario){
                Publicacao.retiraGostoComentario(req.body.publicacao, req.body.comentario, user)
                    .then(dados => res.jsonp(dados))
                    .catch(erro => res.status(500).send('Erro ao retirar gosto de comentario: ' + erro))
            }else{
                if(req.body.publicacao){
                    Publicacao.retiraGostoPublicacao(req.body.publicacao, user)
                        .then(dados => {
                            res.jsonp(dados)
                        })
                        .catch(erro => {console.log('ERRO: ' + erro); res.status(500).send('Erro ao retirar gosto de publicacao: ' + erro)})
                }else{
                    console.log('Algo aqui correu muito mal com o NAAAAOOOO GOSTOOOOOO!!')
                    res.status(500).send('Body errado!')
                }
            }
        }

})

/**
 * Altera o status de uma publicação
 */
router.put('/status/:id/:status', passport.authenticate('jwt', {session: false}),
    (req, res) => {
        Publicacao.alteraStatus(req.params.id, req.params.status)
            .then(dados => res.jsonp(dados))
            .catch(erro => {
                res.status(500).send('Erro ao alterar o status de uma pub: ' + erro)
            })

})

module.exports = router