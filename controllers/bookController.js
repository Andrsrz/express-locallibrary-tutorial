var Book = require('../models/book');
var Author = require('../models/author');
var BookInstance = require('../models/bookinstance');
var Genre = require('../models/genre');

var async = require('async');
const validator = require('express-validator');
const { validationResult } = require('express-validator');

exports.index = (req, res) => {
	async.parallel({
		book_count: (callback) => {
			/* Pass an empty object as match condition to find
			 * all documents of this collection. */
			Book.countDocuments({}, callback);
		},
		book_instance_count: (callback) => {
			BookInstance.countDocuments({}, callback);
		},
		book_instance_available_count: (callback) => {
			BookInstance.countDocuments({status: 'Available'}, callback);
		},
		author_count: (callback) => {
			Author.countDocuments({}, callback);
		},
		genre_count: (callback) => {
			Genre.countDocuments({}, callback);
		}
	}, (err, results) => {
		res.render('index', { title: 'Local Library Home', error: err, data: results });
	});
};

/* Display list of all Books */
exports.book_list = (req, res, next) => {
	Book.find({}, 'title author').populate('author').exec((err, list_books) => {
		if(err)
			return next(err);
		/* Success */
		res.render('book_list', { title: 'Book List', book_list: list_books });
	});
};

/* Display detail page for a specific Book */
exports.book_detail = (req, res, next) => {
	async.parallel({
		book: (callback) => {
			Book.findById(req.params.id)
				.populate('author')
				.populate('genre')
				.exec(callback);
		},
		book_instance: (callback) => {
			BookInstance.find({'book': req.params.id}).exec(callback);
		}
	}, (err, results) => {
		if(err)
			return next(err);

		if(results.book == null){
			let err = new Error('Book not found');
			err.status = 404;
			return next(err);
		}

		/* Success */
		res.render('book_detail', { title: results.book.title,
									book: results.book,
									book_instances: results.book_instance });
	});
};

/* Display Book create form on GET */
exports.book_create_get = (req, res, next) => {
	async.parallel({
		authors: (callback) => {
			Author.find(callback);
		},
		genres: (callback) => {
			Genre.find(callback);
		}
	}, (err, results) => {
		if(err)
			return next(err);

		/* Success */
		res.render('book_form', { title: 'Create Book',
								  authors: results.authors,
								  genres: results.genres });
	});
};

/* Handle Book create on POST */
exports.book_create_post = [
	/* Convert the genre to an Array */
	(req, res, next) => {
		if(!(req.body.genre instanceof Array)){
			if(typeof req.body.genre === 'undefined')
				req.body.genre = [];
			else
				req.body.genre = new Array(req.body.genre);
		}
		next();
	},
	/* Validate and Sanitize (escape) fields */
	validator.body('title').trim().isLength({ min: 1 }).escape(),
	validator.body('author').trim().isLength({ min: 1 }).escape(),
	validator.body('summary').trim().isLength({ min: 1 }).escape(),
	validator.body('isbn').trim().isLength({ min: 1 }).escape(),
	/* Process request after validation */
	(req, res, next) => {
		/* Extract the validation errors from a request */
		const errors = validationResult(req);
		/* Create Book object with escaped and trimmed data */
		let book = new Book({
			title: req.body.title,
			author: req.body.author,
			summary: req.body.summary,
			isbn: req.body.isbn,
			genre: req.body.genre
		});

		if(!errors.isEmpty()){
			/* There are errors. Render form again with sanitized
			 * values/errors messages. */
			/* Get all authors and genres for form */
			async.parallel({
				authors: (callback) => {
					Author.find(callback);
				},
				genres: (callback) => {
					Genre.find(callback);
				}
			}, (err, results) => {
				if(err)
					return next(err);

				/* Success */
				/* Mark our selected genres as checked */
				for(let i = 0; i < results.genres.length; i++){
					if(book.genre.indexOf(results.genres[i]._id) > -1)
						results.genres[i].checked = 'true';
				}

				res.render('book_form', { title: 'Create Book',
										  authors: results.authors,
										  genres: results.genres,
										  book: book,
										  errors: errors.array() });
			});
			return;
		}else{
			/* Data is valid */
			book.save((err) => {
				if(err)
					return next(err);

				/* Success */
				res.redirect(book.url);
			});
		}
	}
];

/* Display Book delete form on GET */
exports.book_delete_get = (req, res) => {
	res.send('NOT IMPLEMENTED: Book delete GET');
};

/* Handle Book delete on POST */
exports.book_delete_post = (req, res) => {
	res.send('NOT IMPLEMENTED: Book delete POST');
};

/* Display Book update form on GET */
exports.book_update_get = (req, res) => {
	res.send('NOT IMPLEMENTED: Book update GET');
};

/* Handle Book update on POST */
exports.book_update_post = (req, res) => {
	res.send('NOT IMPLEMENTED: Book update POST');
};
