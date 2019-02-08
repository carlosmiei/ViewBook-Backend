var mongoose = require('mongoose')

var Schema = mongoose.Schema

var TipoSchema = new Schema({
    titulo: {type: String, required: true},
    data: {type: String, required: true},
    descricao: {type: String, required: true},
    tipo: {type: String, required: true},
    casamento: { type: {
        nubenteA: {type: String, required: true},
        nubenteB: {type: String, required: true},
        local: {type: String, required: true}
    }, required: false },
    culinaria: { type:{
        ingredientes: [{
            ingrediente: {type: String, required: true},
            quantidades: {type: String}       
        }],
        instrucoes: [{
            instrucao: {type: String, required: true}
        }]
    }, required: false},
    desportivo: { type: {
        atividade: {type: String, required: true},
        duracao: {type: String, required: true},
        calorias: {type: String},
        ritmoCardiaco: {type: String}
    }, required: false}
})

var AutorSchema = new Schema({
    id: {type: String, required: true},
    nome: {type: String, required: true},
    foto: {type: String}
})

//possivel estrutura para o comentairo aninhado
var ComentarioAninhadoSchema = new Schema({
    //id: {type: String, required: true},
    data: {type: String, required: true},
    corpo: {type: String, required: true},
    likes: [AutorSchema],
    autor: {type: AutorSchema, required: true}//ou uma estrutura nova?
})


var FicheiroSchema = new Schema({
    _id: {type: String, required: true},
    formato: {type: String, required: true},
})

var ComentarioSchema = new Schema({
    /**
     * Temos de definir qual é o id disto ..
     */
    //id: {type: String, required: true}, //autor+data
    data: {type: String, required: true},
    corpo: {type: String, required: true},
    likes: [AutorSchema],
    autor: {type: AutorSchema, required: true},
    comentarioAninhado: [ComentarioAninhadoSchema]
})

var PublicacaoSchema = new Schema({
    status:{type: String, required: true}, //publico, privado ou amigos
    autor: {type: AutorSchema, required:true}, //id, nome e foto do autor
    likes: [AutorSchema],
    comentarios: [ComentarioSchema],
    hashtags: [{type: String}],
    tipo: {type: TipoSchema, required: true},
    ficheiros: [FicheiroSchema],
    fotos: [FicheiroSchema],
    data: {type: String, required: true}
})

module.exports = mongoose.model('Publicacao', PublicacaoSchema, 'publicacoes')

