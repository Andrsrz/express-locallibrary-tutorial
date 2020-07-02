var Book = require('../models/book');
var Author = require('../models/author');
var BookInstance = require('../models/bookinstance');
var Genre = require('../models/genre');

var async = require('async');

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
exports.book_create_get = (req, res) => {
	res.send('NOT IMPLEMENTED: Book create GET');
};

/* Handle Book create on POST */
exports.book_create_post = (req, res) => {
	res.send('NOT IMPLEMENTED: Book create POST');
};

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
