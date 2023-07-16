const Joi = require('joi')
const Blog = require('../models/blog')
const Comment = require('../models/comment')
const blogDTO = require('../dto/blogDTO')
const blogDetailsDTO  =require('../dto/blog-detailsDto')
const fs = require('fs')
const {BACKEND_SERVER_PATH} = require('../config/index')
// const blogDTO = require('../dto/blogDTO')
const mongodbIdPattern = /^[a-fA-F\d]{24}$/
const blogController = {
    async create(req,res,next){
        const createBlogSchema = Joi.object({
            title: Joi.string().required(),
            content: Joi.string().required(),
            photo: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
        })
        const {error} = createBlogSchema.validate(req.body)
        if(error){
            return next(error)
        }

        const {title,content,photo,author} = req.body
        
        const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/,''),'base64')
        const imagePath = `${Date.now()}-${author}.png`
        try{
            fs.writeFileSync(`storage/${imagePath}`,buffer)
        }
        catch(error){
            return next(error)
        }
        let newBlog
        try{
            newBlog = new Blog({
                title,
                content,
                author,
                photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`
            })
            await newBlog.save();
        }catch(error){
            return next(error)
        }
        const blogDto = new blogDTO(newBlog)
        return res.status(201).json({blog:blogDto})
    },
    async getAll(req,res,next){
        let blogs;
        try{
            blogs = await Blog.find({})
            const BlogsDto = []
            for(let i=0; i<blogs.length; i++){
                const newBlog = new blogDTO(blogs[i])
                BlogsDto.push(newBlog)
            }
            return res.status(200).json({blogs:BlogsDto})
        }
        catch(error){
            return next(error)
        }
    },
    async getById(req,res,next){
        const getByIdSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required()
        })

        const {error} = getByIdSchema.validate(req.params)
        if(error){
            return next(error)
        }
        const {id} = req.params
        let blog;
        try{
            blog = await Blog.findOne({_id:id}).populate('author')
        }
        catch(error){
            return next(error)
        }
        const blogDetailsDto = new blogDetailsDTO(blog)
        return res.status(200).json({blog:blogDetailsDto})
    },
    async update(req,res,next){
        const updateBlogSchema = Joi.object({
            title: Joi.string().required(),
            content: Joi.string().required(),
            photo: Joi.string(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            blogId: Joi.string().regex(mongodbIdPattern).required(),
        })
        const {error} = updateBlogSchema.validate(req.body)
        if(error){
            return next(error)
        }
        const {title,content,photo,author,blogId} = req.body
        let blog;
        try{
            blog = await Blog.findOne({_id:blogId})
        }
        catch(error){
            return next(error)
        }
        if(photo){
            let previousPhoto = blog.photoPath
            previousPhoto = previousPhoto.split('/').at(-1)
            fs.unlinkSync(`storage/${previousPhoto}`);
            // return res.status(200).json({msg:previousPhoto}) 
            const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/,''),'base64')
            const imagePath = `${Date.now()}-${author}.png`
            try{
                fs.writeFileSync(`storage/${imagePath}`,buffer)
            }
            catch(error){ 
                return next(error)
            }
            await Blog.updateOne({ _id:blogId},
                {title,content,photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`
            })
        }
        else{
            await Blog.updateOne({_id:blogId},
                {title,content
            })
        }
        return res.status(200).json({messgae:"blog updated!"})
    },
    async delete(req,res,next){
        const deleteBlogSchema = Joi.object({
            id : Joi.string().regex(mongodbIdPattern).required()
        })
        const {error} = deleteBlogSchema.validate(req.params)
        if(error){
            return next(error)
        }
        const {id} = req.params
        let blog
        try{
            blog = await Blog.findOne({_id:id})
            let previousPhoto = blog.photoPath
            previousPhoto = previousPhoto.split('/').at(-1)
            fs.unlinkSync(`storage/${previousPhoto}`);
            await Blog.deleteOne({_id:id})
            await Comment.deleteMany({blog: id})
        }catch(error){
            return next(error)
        }
        return res.status(200).json({msg:"blog deleted"})
    }
}

module.exports = blogController