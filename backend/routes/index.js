const express = require('express')
const authController = require('../controller/authControll')
const blogController = require('../controller/blogController')
const commentController = require('../controller/commentController')
const auth = require('../middlewares/auth')
const router = express.Router()

router.post('/register',authController.register)
router.post('/login',authController.login)
router.post('/logout',auth,authController.logout)
router.get('/refresh',authController.refresh)

//Blogs
router.post('/blog',auth,blogController.create)
router.get('/blog/getAll',auth,blogController.getAll)
router.get('/blog/:id',auth,blogController.getById)
router.put('/blog/update',auth,blogController.update)
router.delete('/blog/delete/:id',auth,blogController.delete)

//Comments

router.post('/comment',auth,commentController.create)
router.get('/comment/:id',auth,commentController.getById)

module.exports = router