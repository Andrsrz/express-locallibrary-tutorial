var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GenreSchema = new Schema({
	name: {type: String, required: true, minlength: 3, maxlength: 100}
});

/* Virtual for genre url */
GenreSchema.virtual('url').get(() => {
	return '/catalog/genre/' + this._id;
});

/* Export Model */
module.exports = mongoose.model('Genre', GenreSchema);
