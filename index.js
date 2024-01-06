const express=require('express');
const cors=require('cors')
const path=require('path');
require("dotenv").config()
require("./db/config")
const User=require("./db/User")
const Product=require("./db/Product");

const Jwt = require('jsonwebtoken')
const jwtKey='e-comm';

const mongoose = require('mongoose');
// const {App}= require('./front-end/src/App');

// require();

const app = express();

app.use(cors());    
app.use(express.json());

app.get("/",(req,resp)=>{
    app.use(express.static(path.resolve(__dirname,"front-end","build")));
    resp.sendFile(path.resolve(__dirname,"front-end","build","index.html"));
})

app.post("/register",async (req,resp)=>{
    let user=new User(req.body);
    let result=await user.save();
    result=result.toObject();
    delete result.password;
    // resp.send(result);
    Jwt.sign({ result }, jwtKey,{expiresIn:'2h'},(err,token)=>{
        if(err){
            resp.send({result: "something went to wrong"})
        }
        resp.send({result,auth:token})
    })
})


app.post("/login",async (req,resp)=>{
    if(req.body.password && req.body.email){
        let user=await User.findOne(req.body).select("-password");
    
        if(user){
            Jwt.sign({ user }, jwtKey,{expiresIn:'2h'},(err,token)=>{
                if(err){
                    resp.send({result: "something went to wrong"})
                }
                resp.send({user,auth:token})
            })
            // resp.send(user);
        }else{
            resp.send({result:"No User Found"})
        }
    }else{
        resp.send({result:"No User Found"})
    }
    
})
    
app.post("/add-product",verifytoken,async (req,resp)=>{
    let product= new Product(req.body);
    let result= await product.save();
    resp.send(result)
})

app.get("/products",verifytoken,async (req,resp)=>{
    let products=await Product.find();
    if(products.length>0){
        resp.send(products)
    }else{
        resp.send({result:"NO PRODUCT FOUND"})
    }
})

app.delete("/product/:id",verifytoken,async(req,resp)=>{
    const result = await Product.deleteOne({ _id: req.params.id });
    resp.send(result)
})

app.get("/product/:id",verifytoken,async (req,resp)=>{
    let result = await Product.findOne({ _id: req.params.id });
    if(result){
        resp.send(result)
    }else{
        resp.send({result:"NO RECORD FOUND"})
    }
})

app.put("/product/:id",verifytoken,async (req,resp)=>{
    let result = await Product.updateOne({ _id: req.params.id},{
        $set : req.body
    })
    resp.send(result)
})

app.get("/search/:key",verifytoken,async (req,resp)=>{
    let result = await Product.find({
        "$or":[
            {name:{$regex: req.params.key }},
            {company : {$regex: req.params.key}},
            {category : {$regex : req.params.key}},
            {price: {$regex: req.params.key}}
        ]
    });
    resp.send(result)
})

function verifytoken(req,resp,next){
    let token = req.headers['authorization'];
    if(token){
        token=token.split(' ')[1];
        Jwt.verify(token,jwtKey,(err,valid)=>{
            if(err){
                resp.status(401).send({ result:"Please provide valid token"})
            }
            else{
                next();
            }
        })
    }else{
        resp.status(401).send({ result:"Please token with header"})

    }
}

app.listen(5000);