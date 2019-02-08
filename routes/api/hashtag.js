var express = require('express')
var router = express.Router()
var querystring = require('querystring')
var axios = require('axios')
var passport = require('passport');

var Hashtag = require('../../controllers/Hashtags')

/**
 * O que vai estar consumido aqui é: api/hashtag, logo / => api/hashtag/
 */


/**
 * Retorna o objeto da respetiva hashtag
 * ATENCAO!! Deve ser o ultimo metodo dos GETs
 */
router.get('/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
    let id = req.params.id
    Hashtag.consultar(id,req.user.id)
        .then(dados => {res.jsonp(dados)})
        .catch(erro => {
            res.status(500).jsonp('Houve um erro a sacar a tag ' + id)
        })
})

/**
 * Cria uma nova entrada na hashtag
 */
router.post('/', passport.authenticate('jwt', {session: false}), (req, res) => {
    let hashtag = {}
    hashtag.publicacoes = []
    hashtag.nome = req.body.nome
    Hashtag.inserir(hashtag)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.jsonp('Erro a criar a hashtag!'))
})

/**
 * Vai adicionar uma publicacao à lista da hashtag
 * Recebe no body o ID publicacao e o ID da hashtag
 */
router.post('/novaPub', passport.authenticate('jwt', {session: false}), (req, res) => {
    let pub = req.body.publicacao
    let has = req.body.hashtag
    Hashtag.adicionarPub(has, pub)
        .then(dados => {res.jsonp(dados)})
        .catch(erro => res.status(500).jsonp('Erro ao adicionar a pub ' + pub + ' à hashtag ' + has))
})

module.exports = router