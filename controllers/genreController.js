var Genre = require("../models/genre");
var Book = require("../models/book");
var async = require("async");

const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = function (req, res, next) {
  Genre.findAll({order: [['name', 'ASC']]})
    .then((list_genres) => {
      // Successful, so render.
      res.render("genre_list", {
        title: "Genre List",
        list_genres: list_genres,
      });        
    })
    .catch((err) => {
      return next(err);
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
  async.parallel(
    {
      genre: async function (callback) {
        return await Genre.findByPk(req.params.id);
      },

      genre_books: async function (callback) {
        return await (await Genre.findByPk(req.params.id)).getBooks();  // inner query finds the genre; outer query returns the books of that genre.
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        var err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res, next) {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and santize the name field.
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = Genre.build({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ where: { name: req.body.name }})
        .then((found_genre) => {
          if (found_genre) {
            // Genre exists, redirect to its detail page.
            res.redirect(found_genre.url);
          } else {
            genre.save()
              .then((result) => {
                // Genre saved. Redirect to genre detail page.
                res.redirect(genre.url);
              })
              .catch((err) => {
                return next(err);
              })
          }
        })
        .catch((err) => {
          return next(err);
        });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
  async.parallel(
    {
      genre: async function (callback) {
        return await Genre.findByPk(req.params.id);
      },
      genre_books: async function (callback) {
        return await Book.findAll({ include: { model: Genre, where: { id: req.params.id }}});
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        res.redirect("/catalog/genres");
      }
      // Successful, so render.
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {
  async.parallel(
    {
      genre: async function (callback) {
        return await Genre.findByPk(req.params.id);
      },
      genre_books: async function (callback) {
        return await Book.findAll({ include: { model: Genre, where: { id: req.params.id }}});
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Success
      if (results.genre_books.length > 0) {
        // Genre has books. Render in same way as for GET route.
        res.render("genre_delete", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genre_books,
        });
        return;
      } else {
        // Genre has no books. Delete object and redirect to the list of genres.
        Genre.destroy({where: {id: req.body.id}})
          .then((result) => {
            // Success - go to genres list.
            res.redirect("/catalog/genres");
          })
          .catch((err) => {
            return next(err);
          });
      }
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res, next) {
  Genre.findByPk(req.params.id)
    .then((genre) => {
      if (genre == null) {
        // No results.
        var err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      res.render("genre_form", { title: "Update Genre", genre: genre });
    })
    .catch((err) => {
      return next(err);  
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request .
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data (and the old id!)
    values = {
      name: req.body.name,
      id: req.params.id };
    var genre = Genre.build(values);

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values and error messages.
      res.render("genre_form", {
        title: "Update Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      Genre.update(values, { where: { id: req.params.id }})
        .then((result) => {
          // Successful - redirect to genre detail page.
          res.redirect(genre.url);
        })
        .catch((err) => {
          return next(err);
        });
    }
  },
];
