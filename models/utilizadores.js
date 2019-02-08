var mongoose = require('mongoose')
const bcrypt = require('bcrypt')
var Schema = mongoose.Schema

var NotificacaoSchema = new Schema({
    vista: {type: Boolean, required: true},
    tipo: {type: String, required: true}, 
    publicacao: {type: String},
    comentario: {type: String},
    comentarioAninhado: {type: String},
    idUtilizador: {type: String},
    texto: {type: String, required: true}
})


var FotoSchema = new Schema({
    id: {type: String, required: true},
    formato: {type: String, required: true},
    data:{type: String, required: true}

})

var MoradaSchema = new Schema({
    rua: {type: String},
    codigoPostal: {type: String},
    localizacao: {type: String}
})

var AmigoSchema = new Schema({
    id: {type: String, required: true},
    nome: {type: String, required: true}
})

var PedidoSchema = new Schema({
    to: {type: AmigoSchema, required: true},
    from: {type: AmigoSchema, required: true}
})

var UtilizadorSchema = new Schema({
    email: {type: String, required: true, unique: true}, //deixamos estar como _id mas sabemos que é o email?
    nome: {type: String, required: true},
    password: {type: String, required: true},
    sexo: {type: String},
    nascimento: {type: String}, //depois temos de ter em atençao se colocarmos data no input, passar para string
    telefone: {type: String},
    morada: MoradaSchema,
    fotos: [FotoSchema], 
    publicacoes: [{type: String}],
    amigos: [AmigoSchema],
    notificacoes: [NotificacaoSchema],
    pedidosAmizade: [PedidoSchema]
})

UtilizadorSchema.pre('save', async function(next){
    var hash = await bcrypt.hash(this.password, 10)
    this.password = hash
    next()
})

UtilizadorSchema.methods.isValidPassword = async function (password){
    var user = this
    var compare = await bcrypt.compare(password, user.password)
    return compare
}

module.exports = mongoose.model('Utilizador', UtilizadorSchema, 'utilizadores')