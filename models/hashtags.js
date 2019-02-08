var mongoose = require('mongoose')

var Schema = mongoose.Schema

var HashtagSchema = new Schema({
    nome: {type: String, required: true, unique: true}, //o nome identifica unicamente a hashtag
    publicacoes: [{type: String}]
})

module.exports = mongoose.model('Hashtag', HashtagSchema, 'hashtags')