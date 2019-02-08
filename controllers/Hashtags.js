var Hashtag = require('../models/hashtags')
var Publicacoes = require('./Publicacoes')
var Utilizadores = require('./Utilizadores')

module.exports.consultar = (nome,uid) => {
    
    return Hashtag
        .findOne({nome: nome})
        .exec()
        .then(dados => {
            let publicacoes = []
            if(dados == null || dados == undefined ||
                dados._doc == null || dados._doc == undefined){
                    //podia dar erro nao? e podemos ver tbm o publicacoes nao?
                return {}
            }
            return Utilizadores.consultarTodasInformacoes(uid)
            .then(novosDados => {
                let amigos = novosDados.toObject().amigos.map(a => a.id)
                let promessa = new Promise((resolve, reject) => {
                
                    if(dados._doc.publicacoes.length==0){
                        resolve()
                    }
                    let recusou = 0;
                    dados._doc.publicacoes.forEach((pub,index,array) => {
                        Publicacoes.consultarPub(pub)
                        .then(publicacao => {
                          //  console.log('--------------------------------------------')
                            //console.dir(publicacao)
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
            })
            .catch(erro => {throw erro})
            
        })
        .catch(erro => {
            throw erro
        })
}

module.exports.inserir = hashtag => {
    return Hashtag
        .create(hashtag)
}


module.exports.adicionarPub = (nome, pub) => {
    return Hashtag
        .updateOne({nome: nome}, {$push: {publicacoes: {$each: [pub], $position:0}}}, {upsert: true})
        .exec()
}