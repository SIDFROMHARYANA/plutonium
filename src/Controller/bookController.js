const bookModel = require('../Models/BooksModel')
const UserModel = require('../Models/UserModel')
const validation = require('../validator/validation')
// const bookModel = require("../Models/BooksModel")

const allBooks = async function (req, res) {
    try {
        //if nothing is given in req.params then return all books with isDeleted : false
        const totalBooks = await bookModel.find({
            isDeleted: false
        })

        //returnBook contains only what we have to send in response
        let returnBook = {
            _id: totalBooks._id,
            title: totalBooks.title,
            excerpt: totalBooks.excerpt,
            userId: totalBooks.userId,
            category: totalBooks.category,
            reviews: totalBooks.reviews,
            releasedAt: totalBooks.releasedAt
        }
        // to filter according to query 
        const { userId, category, subcategory } = req.query

        const query = { isDeleted: false }
 
        //validating the userID and if valid then sending to query object
        // if (userId != null) query.userId = userId
        // if (!userId.match(/^[0-9a-fA-F]{24}$/))
        // res.status(400).send({ status: false, msg: "invalid userId given" })

        //checking for valid query
        const comp =['userId', 'category', 'subcategory']
        if (!Object.keys(req.query).every(elem => comp.includes(elem)))
        return res.status(400).send({ status: false, msg: "wrong query given" });


        if(userId){
            if(!userId.match(/^[0-9a-fA-F]{24}$/)){
               return res.status(400).send({ status: false, msg: "invalid userId given" })
            }
        }

        if (category != null) query.category = category;
        if (subcategory != null) query.subcategory = subcategory;


        //check for no books
        if (totalBooks.length === 0) {
            res.status(404).send({
                status: false,
                message: "No book found"
            })
        } 
        // if nothing is given in query
        else if (Object.keys(query).length === 0) {
            return res.status(200).send({
                status: true,
                data: returnBook
            })
        } else {
            //filtering the book as per the query and getting the data in finalFilter
            const finalFilter = await bookModel.find(query)
            return res.status(200).send({ status: true, data: finalFilter })

        }

    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        })
    }
}


const getByBookId = async function (req, res) {

    try {

        //extract the bookId 
        const bookId = req.params.bookId
        //find the book with the bookId in bookModel
        const book = await bookModel.findById(bookId)

        //if book not found or isDeleted is true then we can say book not found
        if (!book || book.isDeleted === true) {
            return res.status(404).send({
                status: false,
                message: "Book not found"
            })
        } else {
            return res.status(200).send({
                status: true,
                data: book
            })
        }
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        })
    }

}



const createBook = async function (req, res) {
    try {
        const data = req.body
        const { title, excerpt, userId, ISBN, category, subcategory, reviews, deletedAt, isDeleted, releasedAt } = data

        //-----------------------------------------------------------------------------------------
        if (!validation.isValidRequestBody(data)) {
            return res.status(400).send({
                status: false,
                message: "Invalid request parameter, please provide User Details",
            })
        }

        //for unquie validation in bookModel for ISBN and Title
        const checkUnique = await bookModel.findOne({title: title, ISBN:ISBN })
        //----------------------------Title Validation-----------------------------------------------------
        if (!validation.isValid(title))
            return res.status(400).send({ status: false, message: 'Title is required' })
        if (checkUnique.title)
            return res.status(400).send({ status: false, message: 'Title is already present Try different' })

        //---------------------------excerpt validation-------------------------------
        if (!validation.isValid(excerpt))
            return res.status(400).send({ status: false, message: 'Excerpt is required' })

        //-------------------userId validation-------------------------------------------
        if (!validation.isValid(userId))
            return res.status(400).send({ status: false, message: 'UserId is required' })

        if (!userId.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).send({ status: false, msg: "invalid userId given" })

        if (!await UserModel.findById(userId))
            return res.status(400).send({ status: false, msg: "Invalid User Id !" })

        //------------------------ISBN validation-------------------------------------------
        if (!validation.isValid(ISBN))
            return res.status(400).send({ status: false, message: 'ISBN is required' })

        if (!validation.isValidISBN(ISBN))
            return res.status(400).send({ status: false, message: 'Invalid ISBN !' })

        if (checkUnique.ISBN)
            return res.status(400).send({ status: false, message: 'ISBN is already present' })

        //--------------------------------Category Validation------------------------------------------------
        if (!validation.isValid(category))
            return res.status(400).send({ status: false, message: 'Category is required' })

        //--------------------------------SubCategory Validation------------------------------------------------
        if (!validation.isValid(subcategory))
            return res.status(400).send({ status: false, message: 'Subcategory is required' })

        //----------------------------------releasedAt Validation-------------------------------------------
        if (!validation.isValid(releasedAt))
            return res.status(400).send({ status: false, message: 'ReleaseAt is required' })

        //-----------------------------------BOOK Creation------------------------------------
        const bookCreate = await bookModel.create(data)
        return res.status(201).send({ status: true, message: 'Successfully book created', data: bookCreate })
    
    } catch (err) {
       return res.status(500).send({ status: false, message: err.message })
    }
}

//==============================delete by BookId=============================================

const deleteByBook = async function(req, res){
    
try{
    //bookId    
    const bookId = req.params.bookId

    //if bookId is not present
    if(!bookId)
    return res.status(400).send({status:false, message:'BookId is required'})

    //for invalid bookId 
    if (!bookId.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: false, msg: "invalid bookId given" })

    //for checking bookId and isDeleted false and set isDeleted to true
   if(await bookModel.findOneAndUpdate({_id:bookId, isDeleted:false},{$set:{isDeleted:true, deletedAt: Date.now()}},{ new:true})){

    return res.status(200).send({status:true, message:'successfully Deleted'})
   }
    //if isDeleted is true and no book found
    return res.status(400).send({status:false, message:'book not found or already deleted'})
    
    

}catch(err){
    res.status(500).send({status:false, message:err.message})
}

}


//============updateBook=======

const updateBook = async function (req, res) {

    try {
        //get the bookId
        const bookId = req.params.bookId
        //find the book with bookId
        const book = await bookModel.findById(bookId)

        //check for book not presetn and isDelete true - book not available
        if (!book || book.isDeleted == true) {
            return res.status(404).send({
                status: false,
                message: "Book not found in db or it is deleted"
            })
        }

        //updating 
        //checking for requestBody
        const requestBody = req.body

        //destructure the requestbody
        const { title, excerpt, ISBN, releasedAt } = requestBody


        if (!validation.isValidRequestBody(requestBody)) {
            return res.send(400).send({
                status: false,
                message: "Please provide the Upadate details"
            })
        }


        //checking for update details - title
        if (title) {
            //ckeck for uniqueness of title
            if (book.title) {
                return res.status(400).send({
                    status: false,
                    message: "Title already exists please provide the unique title"
                })
            } else if (validation.isValid(title)) {
                book.title = title.trim()
            } else {
                return res.status(400).send({
                    status: false,
                    message: "Title required"
                })
            }
        }
        //checking for update details - excerpt
        if (excerpt) {

            if (validation.isValid(excerpt)) {
                book.excerpt = excerpt.trim()
            } else {
                return res.status(400).send({
                    status: false,
                    message: "excerpt required"
                })
            }
        }

        //checking for update details - ISBN
        //check for unique ISBN
        if (ISBN) {
            if (book.ISBN) {
                return res.status(400).send({
                    status: false,
                    message: "ISBN already exists please provide the unique ISBN"
                })
            }
            else if (validation.isValidISBN(ISBN)) {
                book.ISBN = ISBN
            } else {
                return res.status(400).send({
                    status: false,
                    message: "ISBN required"
                })
            }
        }

        //checking for upade details - releasedAt
        book.releasedAt = releasedAt

        //updating the book
        const updatedBook = await bookModel.findOneAndUpdate({ _id: bookId }, book, { new: true })
        return res
            .status(200)
            .send({ status: true, message: "successfully updated", data: updatedBook })

    } catch (error) {
        return res.status(500).send({ message: error.message })
    }
}









module.exports.updateBook = updateBook
module.exports.createBook = createBook
module.exports.allBooks = allBooks
module.exports.getByBookId = getByBookId
module.exports.deleteByBook = deleteByBook