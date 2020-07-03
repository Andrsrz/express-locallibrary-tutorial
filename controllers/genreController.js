var Genre = require('../models/genre');
var Book = require('../models/book');

var async = require('async');
const validator = require('express-validator');

/* Display list of all Genres */
exports.genre_list = (req, res, next) => {
	Genre.find().populate('genre').sort([['name', 'ascending']])
		 .exec((err, list_genres) => {
		if(err)
			return next(err);
		/* Success */
		res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
	});
};

/* Display detail page for a specific Genre */
exports.genre_detail = (req, res, next) => {
	async.parallel({
		genre: (callback) => {
			Genre.findById(req.params.id).exec(callback);
		},
		genre_books: (callback) => {
			Book.find({'genre': req.params.id }).exec(callback);
		}
	}, (err, results) => {
		if(err)
			return next(err);

		if(results.genre == null){
			let err = new Error('Genre not found');
			err.status = 404;
			return next(err);
		}

		/* Success */
		res.render('genre_detail', { title: 'Genre Detail',
									 genre: results.genre,
									 genre_books: results.genre_books });
	});
}

/* Display Genre create form on GET */
exports.genre_create_get = (req, res, next) => {
	res.render('genre_form', { title: 'Create Genre' });
};

/* Handle Genre create on POST */
exports.genre_create_post = [
	/* Validate that the name field is not empty. */
	/* Sanitize (escape) the name field. */
	validator.body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),
	/* Process request after validation and sanitization. */
	(req, res, next) => {
		/* Extract the validation errors from a request. */
		const errors = validator.validationResult(req);

		/* Create a genre object with escaped and trimmed data. */
		var genre = new Genre({ name: req.body.name });

		if(!errors.isEmpty()){
			/* There are errors. Render the form again with sanitized
			 * values/error messages. */
			res.render('genre_form', { title: 'Create Genre',
									   genre: genre,
									   errors: errors.array()});
			return;
		}else{
			/* Check if Genre with same name already exists. */
			Genre.findOne({ 'name': req.body.name })
				.exec((err, found_genre) => {
					if(err)
						return next(err);

					if(found_genre){
						/* Genre exists, redirect to its detail page. */
						res.redirect(found_genre.url);
					}else{
						genre.save((err) => {
							if(err)
								return next(err);
							/* Genre saved. Redirect to genre detail page. */
							res.redirect(genre.url);
						});
					}
				});
		}
	}
];

/* Display Genre delete form on GET */
exports.genre_delete_get = (req, res, next) => {
	async.parallel({
		genre: (callback) => {
			Genre.findById(req.params.id).exec(callback);
		},
		genres_books: (callback) => {
			Book.find({'genre': req.params.id}).exec(callback);
		}
	}, (err, results) => {
		if(err)
			return next(err);

		if(results.genre == null)
			res.redirect('/catalog/genres');

		/* Success */
		res.render('genre_delete', { title: 'Delete Genre',
									 genre: results.genre,
									 genres_books: results.genres_books });
	});
};

/* Handle Genre delete on POST */
exports.genre_delete_post = (req, res, next) => {
	async.parallel({
		genre: (callback) => {
			Genre.findById(req.params.id).exec(callback);
		},
		genres_books: (callback) => {
			Book.find({'genre': req.params.id}).exec(callback);
		}
	}, (err, results) => {
		if(err)
			return next(err);

		/* Success */
		if(results.genres_books.length > 0){
			/* Genre has books. Render in samw way as for GET route */
			res.render('genre_delete', { title: 'Delete Genre',
										 genre: results.genre,
										 genres_books: results.genres_books });
			return;
		}else{
			/* Genre has no books. Delete object and redirect to
			 * the list of genres */
			Genre.findOneAndRemove(req.body.genreid, (err) => {
				if(err)
					return next(err);

				/* Success */
				res.redirect('/catalog/genres');
			});
		}
	});
};

/* Display Genre update form on GET */
exports.genre_update_get = (req, res, next) => {
	/* Get genre for form */
	Genre.findById(req.params.id).exec((err, genre) => {
		if(err)
			return next(err);

		if(genre == null){
			let err = new Error('Genre not found');
			err.status = 404;
			return next(err);
		}

		/* Success */
		res.render('genre_form', { title: 'Update Genre',
								   genre: genre });
	});
};

/* Handle Genre update on POST */
exports.genre_update_post = [
	/* Validate that the name field is not empty. */
	/* Sanitize (escape) the name field. */
	validator.body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),
	/* Process request after validation and sanitization. */
	(req, res, next) => {
		/* Extract the validation errors from a request. */
		const errors = validator.validationResult(req);

		/* Create a genre object with escaped and trimmed data. */
		var genre = new Genre({
			name: req.body.name,
			_id: req.params.id /* Required or a new ID will be assigned! */
		});

		if(!errors.isEmpty()){
			/* There are errors. Render the form again with sanitized
			 * values/error messages. */
			res.render('genre_form', { title: 'Create Genre',
									   genre: genre,
									   errors: errors.array()});
			return;
		}else{
			/* Check if Genre with same name already exists. */
			Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, theGenre) => {
				if(err)
					return next(err);

				/* Success */
				res.redirect(theGenre.url);
			});
		}
	}
];
