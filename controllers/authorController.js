var Author = require('../models/author');
var Book = require('../models/book');

var async = require('async');
const validator = require('express-validator');

/* Display list of Authors */
exports.author_list = (req, res, next) => {
	Author.find()
		  .populate('author')
		  .sort([['family_name', 'ascending']])
		  .exec((err, list_authors) => {
		if(err)
			return next(err);
		/* Success */
		res.render('author_list', { title: 'Author List', author_list: list_authors });
	});
};

/* Display detail page for a specific Author */
exports.author_detail = (req, res, next) => {
	async.parallel({
		author: (callback) => {
			Author.findById(req.params.id).exec(callback);
		},
		authors_books: (callback) => {
			/* You can populate the entire book object or just
			 * ask for specifit attributes inside the find
			 * method */
			Book.find({'author': req.params.id}, 'title summary')
				/*.populate('book')*/
				.exec(callback);
		}
	}, (err, results) => {
		if(err)
			return next(err);

		if(results.author == null){
			let err = new Error('Author not found');
			err.status = 404;
			return next(err);
		}

		/* Success */
		res.render('author_detail', { title: 'Author Detail',
									  author: results.author,
									  author_books: results.authors_books });
	});
};

/* Display Author create form on GET */
exports.author_create_get = (req, res, next) => {
	res.render('author_form', { title: 'Create Author' });
};

/* Handle Author create on POST */
exports.author_create_post = [
	/* Validate and Sanitize (escape) fields */
	validator.body('first_name')
			 .isLength({ min: 1 })
			 .trim()
			 .withMessage('First name must be specified')
			 .isAlphanumeric()
			 .withMessage('First name has non-alphanumeric characters.')
			 .escape(),
	validator.body('family_name')
			 .isLength({ min: 1 })
			 .trim()
			 .withMessage('Family name must be specified')
			 .isAlphanumeric()
			 .withMessage('Family name has non-alphanumeric characters.')
			 .escape(),
	validator.body('date_of_birth', 'Invalid date of birth')
			 .optional({ checkFalsy: true })
			 .isISO8601()
			 .toDate(),
	validator.body('date_of_death', 'Invalid date of death')
			 .optional({ checkFalsy: true })
			 .isISO8601()
			 .toDate(),
	(req, res, next) => {
		/* Extract the validation errors from a request. */
		const errors = validator.validationResult(req);

		if(!errors.isEmpty()){
			/* There are errors. Render the form again with sanitized
			 * values/error messages. */
			res.render('author_form', { title: 'Create Author',
										author: req.body,
										errors: errors.array() });
		}else{
			/* Data is valid */
			let author = new Author({
				first_name: req.body.first_name,
				family_name: req.body.family_name,
				date_of_birth: req.body.date_of_birth,
				date_of_death: req.body.date_of_death
			});

			author.save((err) => {
				if(err)
					return next(err);

				/* Author saved. Redirect to author detail page */
				res.redirect(author.url);
			});
		}
	}
];

/* Display Author delete form on GET */
exports.author_delete_get = (req, res, next) => {
	async.parallel({
		author: (callback) => {
			Author.findById(req.params.id).exec(callback);
		},
		authors_books: (callback) => {
			Book.find({'author': req.params.id }).exec(callback);
		}
	}, (err, results) => {
		if(err)
			return next(err);

		if(results.author == null)
			res.redirect('/catalog/authors');

		/* Success */
		res.render('author_delete', { title: 'Delete Author',
									  author: results.author,
									  author_books: results.authors_books });
	});
};

/* Handle Author delete on POST */
exports.author_delete_post = (req, res, next) => {
	async.parallel({
		author: (callback) => {
			Author.findById(req.params.id).exec(callback);
		},
		authors_books: (callback) => {
			Book.find({'author': req.params.id }).exec(callback);
		}
	}, (err, results) => {
		if(err)
			return next(err);

		/* Success */
		if(results.authors_books.length > 0){
			/* Author has books. Render in same way as for GET route */
			res.render('author_delete', { title: 'Delete Author',
										  author: results.author,
										  author_books: results.author_books });
			return;
		}else{
			/* Author has no books. Delete object and redirect to
			 * the list of authors. */
			Author.findByIdAndRemove(req.body.authorid, (err) => {
				if(err)
					return next(err);

				/* Success */
				res.redirect('/catalog/authors');
			});
		}
	});
};

/* Display Author update form on GET */
exports.author_update_get = (req, res) => {
	res.send('NOT IMPLEMENTED: Author update GET');
};

/* Handle Author update on POST */
exports.author_update_post = (req, res) => {
	res.send('NOT IMPLEMENTED: Author update POST');
};
