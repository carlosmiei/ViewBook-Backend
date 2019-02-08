var Publicacao = require('../models/publicacoes')
var Utilizadores = require('./Utilizadores')


//Consultar a publicacao
module.exports.consultar = (id,uid) => {
    return Utilizadores.amigos(uid)
    .then(dados => {
            if(dados == null || dados == undefined ||
                dados._doc == null || dados._doc == undefined){
                    //podia dar erro nao?
                    return {}
            }
            let amigosA = dados.toObject()
            let meusAmigos = amigosA.amigos.map(a => a.id)
            return Publicacao
                .findOne({$and: [{_id: id}, {$or: [{'autor.id': uid}, { status: 'publico' },
                { $and: [ {'autor.id': {$in : meusAmigos} }, { status: {$not: /\^privado\$/ } }]}]}]}) 
                .exec()
    })
    .catch(error => {
        throw error
    })
}

module.exports.consultarPub = (id) => {
    return Publicacao
                .findOne({_id: id})
                .exec()
}

//Lista de publicacoes
/*module.exports.listar = () => {
    console.log("ENTREI NA LISTAGEM TOTAL SEM LIMITE")
    return Publicacao
        .find()
        .sort({data: -1})
        .exec()
}*/

//Lista de publicacoes (com limite)
module.exports.listar = limite => {
    return Publicacao
        .find()
        .sort({data: -1})
        .limit(limite)
        .exec()
}

//Lista de publicacoes do tipo
/*module.exports.listarTipo = (tipo,uid) => {
    console.log("TOU NO LISTAR TIPO")
    return Utilizadores.amigos(uid)
    .then(dados => {
        console.log(dados._doc)
        return Publicacao
            .find({$and: [{'tipo': tipo}, {$or: [{'autor.id': uid}, { status: 'publico' },
            { $and: [ {'autor.id': {$in : dados._doc.amigos.id} }, { status: {$not: /\^privado\$/ } }]}]}]}) 
            .sort({data: -1})
            .exec()
    })
    .catch(erro => {throw erro})
}*/

//Lista de publicacoes do tipo com limite
module.exports.listarTipo = (tipo,uid,limite) => {
    return Utilizadores.amigos(uid)
        .then(dados => {
            let amigosA = dados.toObject()
            let meusAmigos = amigosA.amigos.map(a => a.id)
            return Publicacao
                .find({$and: [{'tipo.tipo': tipo}, {$or: [{'autor.id': uid}, { status: 'publico' },
                { $and: [ {'autor.id': {$in : meusAmigos} }, { status: {$not: /\^privado\$/ } }]}]}]}) 
                .sort({data: -1})
                .limit(limite)
                .exec()
        })
        .catch(erro => {throw erro})
}

//Lista as publicacoes para um utilizador (feed)
//Só pode mostrar as publicações dos amigos que não sejam privadas e qualquer uma das suas
/*module.exports.feed = uid => {
    console.log("ENTREI NO FEED TOTAL SEM LIMITE")
    return Utilizadores.amigos(uid)
    .then(dados => {
        return Publicacao
            .find({$or: [{'autor.id': uid},
            { $and: [ {'autor.id': {$in : dados._doc.amigos.id} }, { status: {$not: /\^privado\$/ } }]}]}) 
            .sort({data: -1})
            .exec()
    })
    .catch(erro => {throw erro})
}  
*/
module.exports.tentativa = () => {
    console.log('Cheguei à tentativa')
}

//Lista as publicacoes para um utilizador (feed) com limite
//Só pode mostrar as publicações dos amigos que não sejam privadas e qualquer uma das suas 
module.exports.feed = (uid, limite) => {
   // console.log("ENTREI NA LISTAGEM TOTAL coM LIMITE" + limite)
    return Utilizadores.amigos(uid)
    .then(dados => {
        let amigosA = dados.toObject()
        let meusAmigos = amigosA.amigos.map(a => a.id)
        return Publicacao
            .find({$or: [{'autor.id': uid},
            { $and: [ {'autor.id': {$in : meusAmigos} }, { status: {$ne: "privado" } }]}]}) 
            .sort({data: -1})
            .limit(limite)
            .exec()
    })
    .catch(erro => {throw erro})
}

//Lista publicacoes com a hashtag
/*module.exports.listarHashtag = (hash,uid) => {
    return Utilizadores.amigos(uid)
        .then(dados => {
            return Publicacao
                .find({$and: [{hashtag: hash}, {$or: [{'autor.id': uid}, { status: 'publico' },
                { $and: [ {'autor.id': {$in : dados._doc.amigos.id} }, { status: {$not: /\^privado\$/ } }]}]}]}) 
                .sort({data: -1})
                .exec()
        })
        .catch(erro => {throw erro})
}*/

//Lista limite publicacoes com a hashtag
module.exports.listarHashtag = (hash,limite,uid) => {
    return Utilizadores.amigos(uid)
        .then(dados => {
            let amigosA = dados.toObject()
            let meusAmigos = amigosA.amigos.map(a => a.id)
            return Publicacao
                .find({$and: [{hashtag: hash}, {$or: [{'autor.id': uid}, { status: 'publico' },
                { $and: [ {'autor.id': {$in : meusAmigos} }, { status: {$not: /\^privado\$/ } }]}]}]}) 
                .sort({data: -1})
                .limit(limite)
                .exec()
        })
        .catch(erro => {throw erro})
}

//Insere uma publicacao na lista
module.exports.inserir = (pub) => {
    return Publicacao.create(pub)
}

//Insere comentario na publicacao
module.exports.adicionaComentario = (pub, comentario) => {
    return Publicacao
        .updateOne({_id: pub}, {$push: {comentarios: comentario}},{returnOriginal: false})
        .exec()
}

//Insere comentario na publicacao
module.exports.adicionaComentarioAninhado = (pub, idC, comentario) => {
    return Publicacao
        .updateOne({_id: pub}, {$push: {'comentarios.$[c].comentarioAninhado': comentario}}, 
            { returnOriginal: false, arrayFilters: [ { 'c._id': idC } ], multi: true })
        .exec()
}

//Altera as informações dos autores porque este alterou o seu nome ou foto
//querermos fazer update ao Autor da publicacao se o autor for o que mudou a foto
//queremos fazer update ao autor dos comentarios se o autor dos comentarios for o que mudou a foto
//queremos fazer update ao autor dos likes se o autor dos likes foi o que mudou a foto
module.exports.alteraAutor = autor => {
    return Publicacao
        .update({ 'autor.id': autor.id }, { $set: { autor: autor } } )
        .update( { }, 
            { $set: { 'comentarios.$[c].autor': autor, 'likes.$[l]': autor, 'comentarios.$[].likes.$[l]': autor } },
            { arrayFilters: [ { 'c.autor.id': autor.id }, { 'l.id' : autor.id } ], multi: true } )
        .exec()
}

/**
 * Vai alterar o status de uma publicação
 */
module.exports.alteraStatus = (pub, status) => {
    return Publicacao
        .updateOne({_id: pub}, {$set: {status: status}})
        .exec()
}

module.exports.acrescentaGostoPublicacao = (idPub, autor) => {
    return Publicacao
        .updateOne({_id: idPub}, {$push: {likes: autor}})
        .exec()
}

module.exports.retiraGostoPublicacao = (idPub, autor) => {
    return Publicacao
        .updateOne({_id: idPub}, {$pull: {likes: autor}})
        .exec()
}

module.exports.acrescentaGostoComentario = (idPub, idComentario, autor) => {
    return Publicacao
        .updateOne({_id: idPub}, {$push: {'comentarios.$[c].likes': autor}},
        { arrayFilters: [ { 'c._id': idComentario }] })
        .exec()
}

module.exports.retiraGostoComentario = (idPub, idComentario, autor) => {
    return Publicacao
        .updateOne({_id: idPub}, {$pull: {'comentarios.$[c].likes': autor}},
        { arrayFilters: [ { 'c._id': idComentario }] })
        .exec()
}

module.exports.acrescentaGostoComentarioAninhado = (idPub, idComentario, idComentarioAninhado, autor) => {
    return Publicacao
        .updateOne({_id: idPub}, {$push: {'comentarios.$[c].comentarioAninhado.$[a].likes': autor}},
        { arrayFilters: [ { 'c._id': idComentario }, { 'a._id': idComentarioAninhado }] })
        .exec()
}

module.exports.retiraGostoComentarioAninhado = (idPub, idComentario, idComentarioAninhado, autor) => {
    return Publicacao
        .updateOne({_id: idPub}, {$pull: {'comentarios.$[c].comentarioAninhado.$[a].likes': autor}},
        { arrayFilters: [ { 'c._id': idComentario }, { 'a._id': idComentarioAninhado }] })
        .exec()
}