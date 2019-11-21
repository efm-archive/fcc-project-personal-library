/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

const Schema = mongoose.Schema;

const bookSchema = new Schema({
  title: { type: String, required: true },
  comments: [String],
  commentcount: { type: Number, default: 0 }
});
const Book = mongoose.model('Book', bookSchema);

module.exports = function(app) {
  mongoose.connect(MONGODB_CONNECTION_STRING, (err, db) => {
    if (err) {
      console.log('Database error: ' + err);
    } else {
      console.log('Successful database connection');
    }
  });

  app
    .route('/api/books')
    .get(function(req, res) {
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]

      // find and return all books
      const books = Book.find({}, (err, books) => {
        // if there is an error
        if (err) {
          res.status(400).send('no books exist');
          return next();
        }
        // set status to 200 and send the books array to the client
        res.status(200).send(books);
      });
    })

    .post(async function(req, res, next) {
      var title = req.body.title;
      //response will contain new book object including atleast _id and title

      if (!title) {
        res.status(400).send('please provide a title');
        return next();
      }

      // create a new book
      const newBook = new Book({
        title: title
      });

      // save the book to the database
      await newBook.save((err, doc) => {
        // return status 200 and the created book
        res.status(200).send(doc);
      });
    })

    .delete(function(req, res, next) {
      //if successful response will be 'complete delete successful'

      // delete all books
      Book.deleteMany({}, (err, books) => {
        // if there is an error
        if (err) {
          res.status(400).send('no books exist');
          return next();
        }
        // set status to 200 and send response message: complete delete successful
        res.status(200).send('complete delete successful');
      });
    });

  app
    .route('/api/books/:id')
    .get(async function(req, res, next) {
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}

      // find the book with the passed in _id
      const book = await Book.findOne({ _id: bookid }, (err, doc) => {
        // console.log('doc :', doc);
        // if no book is found, return an error
        if (err) {
          res.status(400).send('no book exists');
          return next();
        }
      });
      // if we have a book
      if (book) {
        // set the status to 200 and send the book in the required json res format
        res.status(200).send({
          _id: bookid,
          title: book.title,
          comments: [...book.comments]
        });
        return next();
      } else {
        res.status(400).send('no book exists');
        return next();
      }
    })

    .post(async function(req, res, next) {
      var bookid = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get

      // find the book with the passed in _id
      const book = await Book.findOne({ _id: bookid }, (err, doc) => {
        if (err) {
          res.status(400).send('no book exists');
          return next();
        }
      });
      // console.log('book :', book);
      // push the passed in comment onto the comments array of the book
      book.comments.push(comment);
      // update the comment count of the book
      book.commentcount = book.comments.length;
      // save the book to the database
      await book.save().then(() => {
        // console.log('book saved:', book);
      });
      // set the status to 200 and send the book to the client
      res.status(200).send({
        _id: bookid,
        title: book.title,
        comments: [...book.comments],
        commentcount: book.comments.length
      });
    })

    .delete(async function(req, res) {
      var bookid = req.params.id;
      //if successful response will be 'delete successful'

      // find the book with the passed in _id
      await Book.findOne({ _id: bookid }, (err, doc) => {
        if (err) {
          // set status to 400 and send response message: no book exists
          res.status(400).send('no book exists');
          return next();
        }
        doc.deleteOne().then(() => {
          // set status to 200 and send response message: delete successful
          res.status(200).send('delete successful');
          return next();
        });
      });
    });
};
