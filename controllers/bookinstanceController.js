var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

var async = require('async');
const validator = require('express-validator');
const { validationResult } = require('express-validator');

/* Display list of all BookInstances */
exports.bookinstance_list = (req, res, next) => {
	BookInstance.find().populate('book').exec((err, list_bookinstances) => {
		if(err)
			return next(err);
		/* Success */
		res.render('bookinstance_list', { title: 'Book Instance List',
										  bookinstance_list: list_bookinstances });
	});
};

/* Display detail page for a specific BookInstance */
exports.bookinstance_detail = (req, res, next) => {
	BookInstance.findById(req.params.id).populate('book')
				.exec((err, bookinstance) => {
		if(err)
			return next(err);

		if(bookinstance == null){
			let err = new Error('Book copy not found');
			err.status = 404;
			return next(err);
		}

		/* Success */
		res.render('bookinstance_detail', { title: 'Copy: ' + bookinstance.book.title,
											bookinstance: bookinstance });
	});
};

/* Display BookInstance create form on GET */
exports.bookinstance_create_get = (req, res, next) => {
	Book.find({}, 'title').exec((err, books) => {
		if(err)
			return next(err);

		/* Success */
		res.render('bookinstance_form', { title: 'Create BookInstance',
										  book_list: books });
	});
};

/* Handle BookInstance create on POST */
exports.bookinstance_create_post = [
	/* Validate and Sanitize (escape) fields */
	validator.body('book', 'Book must be specified').trim().isLength({ min: 1 }),
	validator.body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
	validator.body('status').trim().escape(),
	validator.body('due_back', 'Invalid date')
			 .optional({ checkFalsy: true })
			 .isISO8601()
			 .toDate(),
	/* Process request after validation */
	(req, res, next) => {
		/* Extract the validation errors from a request */
		const errors = validationResult(req);
		/* Create BookInstance with escaped and trimmed data */
		let bookinstance = new BookInstance({
			book: req.body.book,
			imprint: req.body.imprint,
			status: req.body.status,
			due_back: req.body.due_back
		});

		if(!errors.isEmpty()){
			/* There are errors. Render form again with sanitized
			 * values/errors messages. */
			Book.find({}, 'title').exec((err, books) => {
				if(err)
					return next(err);

				/* Success */
				res.render('bookinstance_form', { title: 'Create BookInstance',
												  book_list: books });
			});
			return;
		}else{
			/* Data is valid */
			bookinstance.save((err) => {
				if(err)
					return next(err);

				/* Success */
				res.redirect(bookinstance.url);
			});
		}
	}
];

/* Display BookInstance delete form on GET */
exports.bookinstance_delete_get = (req, res, next) => {
	BookInstance.findById(req.params.id)
				.populate('book')
				.exec((err, bookinstance) => {
		if(err)
			return next(err);

		if(bookinstance == null)
			res.redirect('/catalog/bookinstances');

		/* Success */
		res.render('bookinstance_delete', { title: 'Delete BookInstance',
											bookinstance: bookinstance });
	});
};

/* Handle BookInstance delete on POST */
exports.bookinstance_delete_post = (req, res, next) => {
	BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err) => {
		if(err)
			return next(err);

		/* Success */
		res.redirect('/catalog/bookinstances');
	});
};

/* Display BookInstance update form on GET */
exports.bookinstance_update_get = (req, res, next) => {
	/* Get BookInstance and Books for form */
	async.parallel({
		book: (callback) => {
			Book.find({}, 'title').exec(callback);
		},
		bookinstance: (callback) => {
			BookInstance.findById(req.params.id).populate('book').exec(callback);
		}
	}, (err, results) => {
		if(err)
			return next(err);

		if(results.bookinstance == null){
			let err = new Error('BookInstance not found');
			err.status = 404;
			return next(err);
		}

		/* Success */
		res.render('bookinstance_form', { title: 'Update BookInstance',
										  book_list: results.book,
										  bookinstance: results.bookinstance });
	});
};

/* Handle BookInstance update on POST */
exports.bookinstance_update_post = [
	/* Validate and Sanitize (escape) fields */
	validator.body('book', 'Book must be specified').trim().isLength({ min: 1 }),
	validator.body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
	validator.body('status').trim().escape(),
	validator.body('due_back', 'Invalid date')
			 .optional({ checkFalsy: true })
			 .isISO8601()
			 .toDate(),
	/* Process request after validation */
	(req, res, next) => {
		/* Extract the validation errors from a request */
		const errors = validationResult(req);
		/* Create BookInstance with escaped and trimmed data */
		let bookinstance = new BookInstance({
			book: req.body.book,
			imprint: req.body.imprint,
			status: req.body.status,
			due_back: req.body.due_back,
			_id: req.params.id /* Required or a new ID will be assigned! */
		});

		if(!errors.isEmpty()){
			/* There are errors. Render form again with sanitized
			 * values/errors messages. */
			async.parallel({
				book: (callback) => {
					Book.find({}, 'title').exec(callback);
				},
				bookinstance: (callback) => {
					BookInstance.findById(req.params.id).populate('book').exec(callback);
				}
			}, (err, results) => {
				if(err)
					return next(err);

				/* Success */
				res.render('bookinstance_form', { title: 'Update BookInstance',
												  book_list: results.book,
												  bookinstance: results.bookinstance });
			});
			return;
		}else{
			/* Data is valid */
			BookInstance.findByIdAndUpdate(req.params.id,
										   bookinstance,
										   {},
										   (err, theBookInstance) => {
				if(err)
					return next(err);

				/* Success */
				res.redirect(theBookInstance.url);
			});
		}
	}
];
