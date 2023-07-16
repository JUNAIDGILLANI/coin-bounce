const Joi = require('joi')
const passwordPattern = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
const bcrypt = require('bcryptjs')
const User = require('../models/user')
const userDTO = require('../dto/userDTO')
const JWTService = require('../services/JWTService')
const RefreshToken = require('../models/token')
const token = require('../models/token')
const authController = {
    async register(req,res,next){
        const userRegisterSchema = Joi.object({
            username:Joi.string().min(5).max(30).required(),
            name:Joi.string().max(30).required(),
            email:Joi.string().email().required(),
            password:Joi.string().pattern(passwordPattern).required(),
            confirmPassword:Joi.ref('password')
        });
        const {error} = userRegisterSchema.validate(req.body)
        if(error){
            return next(error)
        }
        const {username,name,email,password} = req.body
        try{
            const emailInUse = await User.exists({email})
            const usernameInUse = await User.exists({username})
            if(emailInUse){
                const error = {
                    status : 409,
                    message: 'Email already registered, use another email'
                }
                return next(error)
            }
            if(usernameInUse){
                const error = {
                    status : 409,
                    message: 'Username not available, choose another Username'
                }
                return next(error)
            }
        }
        catch(error){
            return next(error)
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        let accessToken;
        let refreshToken;
        let user;
        try{
            const userToRegister = new User({
                name,
                username,
                email,
                password:hashedPassword
            })
            user = await userToRegister.save()
            accessToken = JWTService.signAccessToken({_id:user._id},'30m')
            refreshToken = JWTService.signRefreshToken({_id:user._id},'60m')
        }
        catch(error){
            return next(error)
        }
        await JWTService.storeRefreshToken(refreshToken,user._id)
        res.cookie('accessToken',accessToken,{
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true
        })
        res.cookie('refreshToken',refreshToken,{
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true
        })

        
        const userDto = new userDTO(user)
        return res.status(201).json({user:userDto,auth:true})
    },
    async login(req,res,next){
        const userLoginSchema = Joi.object({
            username: Joi.string().min(5).max(30).required(),
            password: Joi.string().pattern(passwordPattern).required()
        })
        const {error} = userLoginSchema.validate(req.body)
        if(error){
            return next(error)
        }
        const {username,password} = req.body
        let user;
        try{
            user = await User.findOne({username:username})
            if(!user){
                const error = {
                    status:401,
                    messgae: 'Invalid User name'
                }
                return next(error)
            }
            const match = await bcrypt.compare(password,user.password)
            if(!match){
                const error = {
                    status:401,
                    messgae: 'Invalid Password'
                }
                return next(error)
            }
        }
        catch(error){
            return next(error)
        }
        const accessToken = JWTService.signAccessToken({_id:user._id},'30m')
        const refreshToken = JWTService.signAccessToken({_id:user._id},'60m')
        try{
            await RefreshToken.updateOne({
                userId:user._id},
                {token:refreshToken},
                {upsert: true}
            )
        }catch(error){
            return next(error)
        }
        
        res.cookie('accessToken',accessToken,{
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true
        })
        res.cookie('refreshToken',refreshToken,{
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true
        })

        const userDto = new userDTO(user)
        return res.status(200).json({user:userDto,auth:true})
    },
    async logout(req,res,next){
        // console.log(req);
        const {refreshToken} = req.cookies
        try{
            await RefreshToken.deleteOne({token:refreshToken})
        }
        catch(error){
            return next(error)
        }
        res.clearCookie('accessToken')
        res.clearCookie('refreshToken')
        return res.status(200).json({user:null,auth:false})
    },
    async refresh(req,res,next){
        const {refreshToken} = req.cookies
        let id
        try{
            id = JWTService.verifyRefreshToken(refreshToken)._id
        }
        catch(e){
            
            const error = {
                status:401,
                message:"Unauthorized"
            }
            return next(error)
        } 
        console.log("Hi");
        try{
            const match = await RefreshToken.findOne({userId:id, token:refreshToken})
            if(!match){
                const error = {
                    status:401,
                    message:"Unauthorized"
                }
                return next(error)
            }
            console.log("Hi");
            try{ 
                const accessToken = JWTService.signAccessToken({_id:id},'30m')
                
                const newrefreshToken = JWTService.signRefreshToken({_id:id},'60m')
                await RefreshToken.updateOne(
                    {userId:id},
                    {token:newrefreshToken}
                    )
                    res.cookie('accessToken',accessToken,{
                        maxAge: 1000 * 60 * 60 * 24,
                        httpOnly: true
                    })
                    res.cookie('refreshToken',newrefreshToken,{
                        maxAge: 1000 * 60 * 60 * 24,
                        httpOnly: true
                    })
                }
                catch(error){
                    return next(error)
                }  
                
            }
            catch(error){
                return next(error)
            }
        const user = await User.findOne({_id:id})
        const userDto = new userDTO(user)
        return res.status(200).json({user:userDto, auth:true})
    }
}
module.exports = authController