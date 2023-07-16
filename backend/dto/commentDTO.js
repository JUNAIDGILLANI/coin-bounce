class commentDTO{
    constructor(comment){
        this._id = comment._id
        this.content = comment.content
        this.createdAt = comment.createdAt;
        // this.authorName = comment.blog.author
        this.authorUsername = comment.author.username
    }
}
module.exports = commentDTO;