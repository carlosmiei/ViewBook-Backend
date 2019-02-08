var Utilizador = require('../models/utilizadores')
var Publicacoes = require('./Publicacoes')

//Consultar o utilizador
module.exports.consultar = (id,uid) => {
    let publicacoes = []
    return Utilizador
        .findOne({_id: id})
        .exec()
        .then(dados => {
            if(dados == null || dados == undefined ||
                dados._doc == null || dados._doc == undefined){
                    //podia dar erro nao? e podemos ver tbm o publicacoes nao?
                return {}
            }

            let amigos = dados.toObject().amigos.map(a => a.id)
            
            let promessa = new Promise((resolve, reject) => {
                
                if(dados._doc.publicacoes.length==0){
                    resolve()
                }
                let recusou = 0;
                dados._doc.publicacoes.forEach((pub,index,array) => {
                    Publicacoes.consultarPub(pub)
                    .then(publicacao => {
                        if( !(publicacao == null || publicacao == undefined ||
                            publicacao._doc == null || publicacao._doc == undefined) ){
                                if(publicacao._doc.status == 'publico' ||
                                    (publicacao._doc.status == 'amigos') && amigos.includes(uid)){
                                
                                        publicacoes.push(publicacao._doc)
                                        if((publicacoes.length+recusou) == array.length){
                                            resolve()
                                        }
                                }
                                else{
                                    recusou++;
                                    if((publicacoes.length+recusou) == array.length){
                                        resolve()
                                    }
                                }
                        }
                        
                        else{
                            recusou++;
                            if((publicacoes.length+recusou) == array.length){
                                resolve()
                            }
                        }
                    })
                    .catch( erro => {
                        reject(erro)
                    })
    
                })
            })
            
            return promessa.then(valores => {
                publicacoes.sort( (a,b) => {
                    return (a.data < b.data) ? 1 : -1
                })
                dados._doc.publicacoes = publicacoes
                return dados
            })
            .catch(erro => {
                throw erro
            })
            
        })
        .catch(erro => {
            throw erro
        })
}

//Consulta por nome
module.exports.listarNome = (nome, limite) => {
    let regexp = '^'+nome+'|[ ]+'+nome
    let regexAux = new RegExp(regexp,'i')
    return Utilizador
            .find({nome: { $regex: new RegExp(regexp, 'i'), $options: 'i'}}, {publicacoes: false, password: false, email: false,
                                                                        nascimento: false, telefone: false, morada: false,
                                                                    amigos: false})
            .sort({nome : -1})
            .limit(limite)
            .exec()
}

module.exports.consultarTodasInformacoes = (id) => {
    return Utilizador
        .findOne({_id: id})
        .exec()
}

//Lista as fotos de perfil do utilizador
module.exports.consultarFotos = (id) => {
    return Utilizador
        .findOne({_id: id},
            {fotos: true})
        .exec()
}

//Lista as infos do utilizador
module.exports.consultarInformacoes = (id) => {
    return Utilizador
        .findOne({_id: id},
            {nome: true, nascimento: true, morada: true})
        .exec()
}

//Atualiza as infos do utilizador
module.exports.informacoes = (info) => {
    return Utilizador
        .updateOne({_id: info._id}, info)
        .exec()
}

//Insere nova foto
module.exports.adicionaFoto = (id, foto) => {
    return Utilizador
        .updateOne({_id: id}, {$push: {fotos: {$each: [foto], $position:0}}})
        .exec()
}

//Insere nova publicacao
module.exports.adicionaPub = (id, pub) => {
    return Utilizador
        .updateOne({_id: id}, {$push: {publicacoes: {$each: [pub], $position:0}}})
        .exec()
}

//Retorna os amigos do utilizador
module.exports.amigos = id => {
    return Utilizador
        .findOne({_id: id},{amigos:true})
        .exec()
}

//Insere um utilizador na lista
module.exports.inserir = u => {
    return Utilizador.create(u)
}

//Adiciona um pedido de amizade ao utilizador
module.exports.adicionaPedidoAmizade = (id,p, amigo) => {
    return Utilizador
        .updateOne({_id: id, 'amigos.id': { $ne: amigo.id }, 'pedidosAmizade.from.id': {$ne: amigo.id}, 'pedidosAmizade.to.id': {$ne: amigo.id}}, 
            {$push: {pedidosAmizade: {$each: [p], $position:0}}})
            .exec()
}

//Aceita um pedido de amizade
module.exports.aceitaPedidoAmizade = (id,p,amigo) => {
    return Utilizador
        .updateOne({_id: id, 'amigos.id': { $ne: amigo.id }, 'pedidosAmizade.from.id': p.from.id, 'pedidosAmizade.to.id': p.to.id}, 
            {$pull: {pedidosAmizade: {'to.id': p.to.id, 'from.id': p.from.id}}, $push: {amigos: amigo}})
            .exec()
}

//Nao aceita um pedido de amizade
module.exports.recusaPedidoAmizade = (id,p) => {
    return Utilizador
        .updateOne({_id: id}, 
            {$pull: {pedidosAmizade: {'to.id': p.to.id, 'from.id': p.from.id}}})
            .exec()
}

//Remove uma amizade
module.exports.removeAmizade = (id,p) => {
    return Utilizador
        .updateOne({_id: id, 'amigos.id': p.id }, 
            {$pull: {amigos: {id: p.id}}})
            .exec()
}

module.exports.adcionaNotificacao = (id,n) => {
    return Utilizador
            .updateOne({_id: id},
                {$push: {notificacoes: n}})
                .exec()
}

veNotificacoesAux = (id, elem) => {
    return Utilizador
        .updateOne({_id: id},
            { $set: {'notificacoes.$[c].vista': true}},
            { arrayFilters: [ { 'c._id': elem  } ], multi: true } )
            .exec()
}

module.exports.veNotificacoes = (id,n) => {
    let promessa = new Promise((resolve, reject) => {
        let quantos = 0;
        n.forEach((elem,index,array) => {
            
                veNotificacoesAux(id,elem)
                .then(dados => {
                    quantos++;
                    if(quantos == n.length){

                        resolve(dados)
                    }
                })
                .catch(erro => reject(erro))
        })
    })

    return promessa
    .then(dados => {console.log('Acabou promessa');return dados})
    .catch(erro => {throw erro})
}
