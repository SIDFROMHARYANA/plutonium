// const { Timestamp } = require('mongodb')
const validator=require('validator')
const mongoose=require('mongoose')
const authormodelchema=mongoose.Schema({
  fname:{
    type:String,
    required:true
  },
  lname:{
    type:String,
    required:true
  },
  title:{
    type:String,
    enum:['Mr','Mrs','Miss']
  },
  email:{
    type:String,
    required:true,
    unique:true,
    validate(value){
      if(!validator.isEmail(value)){
        throw new Error("Email Is not valid")
      }
    }
  },
  password:{
    type:String,
    required:true,
    unique:true
  }

},{timestamps:true})

module.exports=mongoose.model('Authormodel',authormodelchema)
