const Joi = require('joi')
const Comment = require('../models/comment')
const commentDTO = require('../dto/commentDTO')
const mongodbIdPattern = /^[a-fA-F\d]{24}$/
const commentController = {
    async create(req,res,next){
        const createCommentSchema = Joi.object({
            content: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            blog: Joi.string().regex(mongodbIdPattern).required()
        })
        const {error} = createCommentSchema.validate(req.body) 
        if(error){
            return next(error)
        }
        const {content,author,blog} = req.body
        const newComment = new Comment({
            content,
            author,
            blog
        })
        const comment = await newComment.save()
        return res.status(201).json({comment:comment})

    },
    async getById(req,res,next){
        const getByIdSchema = Joi.object({
            id:Joi.string().regex(mongodbIdPattern).required()
        })
        const {error} = getByIdSchema.validate(req.params)
        if(error){
            return next(error)
        }
        const {id} = req.params
        let comments;
        try{
            comments = await Comment.find({blog:id}).populate('author')
        }catch(error){
            return next(error)
        }
        const commentsDto = []
        for(let i=0; i<comments.length; i++){
            const comment = new commentDTO(comments[i])
            commentsDto.push(comment)
        }
        return res.status(200).json({comment:commentsDto})
    }
}
module.exports = commentController