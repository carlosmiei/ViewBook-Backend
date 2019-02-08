const express = require('express')
const router = express.Router()
//TENHO DE VER QUAL É QUE VAI SER O NOME DO CONTROLLER!
const Publicacao = require('../../controllers/Publicacoes')
var passport = require('passport');
var jwt = require('jsonwebtoken');
/**
 * Neste router já vai estar consumida a parte do api/feed !
 * Logo cada pedido só tem de começar com o /
 */

 /**
  * Dá o array de publicações associada a uma carateristica:
  * Tenho de enviar o utilizador
  * Com ou sem limite? Se tiver limite tem de vir no req.param?
  */

 router.get('/',passport.authenticate('jwt', {session: false}), 
 (req,res) => {
    if(req.query.limite == undefined){
    
        let idUtlizador = req.user.id
        Publicacao.feed(idUtlizador)
            .then(dados => {
                res.jsonp(dados)
            })
            .catch(erro => {console.log('Error');console.log(erro);res.status(500).jsonp('Erro na listagem de um estado!')})
        }else{
        Publicacao.feed(idUtlizador, parseInt(req.query.limite))
            .then(dados => res.jsonp(dados))
            .catch(erro => {console.log(erro);res.status(500).send('Erro na listagem de um estado com limite!')})
    }
    
})



module.exports = router