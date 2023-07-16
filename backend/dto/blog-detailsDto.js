class blogDetailsDto {
    constructor(blog){
        this._id = blog._id
        this.title=blog.title
        this.content=blog.content
        // this.author=blog.author
        this.photo=blog.photoPath
        this.authorName = blog.author.name
        this.authorUserName = blog.author.username
        this.createdAt = blog.createdAt
    }
}
module.exports = blogDetailsDto;