var Book = require("../models/book");
var Author = require("../models/author");
var Genre = require("../models/genre");
var BookInstance = require("../models/bookinstance");

const { body, validationResult } = require("express-validator");

var async = require("async");

exports.index = function (req, res) {
  async.parallel(
    {
      book_count: async function (callback) {
        return await Book.count();
      },
      book_instance_count: async function (callback) {
        return await BookInstance.count();
      },
      book_instance_available_count: async function (callback) {
        return await BookInstance.count({ where: { status: "Available" }});
      },
      author_count: async function (callback) {
        return await Author.count();
      },
      genre_count: async function (callback) {
        return await Genre.count();
      },
    },
    function (err, results) {
      res.render("index", {
        title: "Local Library Home",
        error: err,
        data: results,
      });
    }
  );
};

// Display list of all books.
exports.book_list = function (req, res, next) {
  Book.findAll({order: [['title', 'ASC']], include: Author})
    .then((list_books) => {
      // Successful, so render.
      res.render("book_list", {
        title: "Book List",
        book_list: list_books,
      });        
    })
    .catch((err) => {
      return next(err);
    });
};

// Display detail page for a specific book.
exports.book_detail = function (req, res, next) {
  async.parallel(
    {
      book: async function (callback) {
        return await Book.findByPk(req.params.id, {include: [Author, Genre]});
      },
      book_instance: async function (callback) {
        return await (await Book.findByPk(req.params.id)).getBookInstances();  // inner query finds the book; outer query returns the book instances of that book.
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        // No results.
        var err = new Error("Book not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("book_detail", {
        title: results.book.title,
        book: results.book,
        book_instances: results.book_instance,
      });
    }
  );
};

// Display book create form on GET.
exports.book_create_get = function (req, res, next) {
  // Get all authors and genres, which we can use for adding to our book.
  async.parallel(
    {
      authors: async function (callback) {
        return await Author.findAll();
      },
      genres: async function (callback) {
        return await Genre.findAll();
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      res.render("book_form", {
        title: "Create Book",
        authors: results.authors,
        genres: results.genres,
      });
    }
  );
};

// Handle book create on POST.
exports.book_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped and trimmed data.
    var book = Book.build({
      title: req.body.title,
      authorId: parseInt(req.body.author),
      summary: req.body.summary,
      isbn: req.body.isbn
    });
    selectedGenres = req.body.genre.map((genreId) => parseInt(genreId));

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      async.parallel(
        {
          authors: async function (callback) {
            return await Author.findAll();
          },
          genres: async function (callback) {
            return await Genre.findAll();
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }

          // Mark our selected genres as checked.
          for (let i = 0; i < results.genres.length; i++) {
            if (selectedGenres.indexOf(results.genres[i].id) > -1) {
              results.genres[i].checked = "true";
            }
          }
          res.render("book_form", {
            title: "Create Book",
            authors: results.authors,
            genres: results.genres,
            book: book,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Save book.
      book.save()
        .then((result) => {
          if (selectedGenres.length > 0) return book.addGenres(selectedGenres);
          return result;
        })
        .then((result) => {
          // Successful - redirect to new book record.
          res.redirect(book.url);
        })
        .catch((err) => {
          return next(err);
        });
    }
  },
];

// Display book delete form on GET.
exports.book_delete_get = function (req, res, next) {
  async.parallel(
    {
      book: async function (callback) {
        return await Book.findByPk(req.params.id, {include: [Author, Genre]});
      },
      book_bookinstances: async function (callback) {
        return await BookInstance.findAll({ where: { bookId: req.params.id }});
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        // No results.
        res.redirect("/catalog/books");
      }
      // Successful, so render.
      res.render("book_delete", {
        title: "Delete Book",
        book: results.book,
        book_instances: results.book_bookinstances,
      });
    }
  );
};

// Handle book delete on POST.
exports.book_delete_post = function (req, res, next) {
  // Assume the post has valid id (ie no validation/sanitization).

  async.parallel(
    {
      book: async function (callback) {
        return await Book.findByPk(req.body.id, {include: [Author, Genre]});
      },
      book_bookinstances: async function (callback) {
        return await BookInstance.findAll({ where: { bookId: req.body.id }});
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Success
      if (results.book_bookinstances.length > 0) {
        // Book has book_instances. Render in same way as for GET route.
        res.render("book_delete", {
          title: "Delete Book",
          book: results.book,
          book_instances: results.book_bookinstances,
        });
        return;
      } else {
        // Book has no BookInstance objects. Delete object and redirect to the list of books.
        Book.destroy({where: {id: req.body.id}})
          .then((result) => {
            // Success - got to books list.
            res.redirect("/catalog/books");
          })
          .catch((err) => {
            return next(err);
          });
      }
    }
  );
};

// Display book update form on GET.
exports.book_update_get = function (req, res, next) {
  // Get book, authors and genres for form.
  async.parallel(
    {
      book: async function (callback) {
        return await Book.findByPk(req.params.id, {include: [Author, Genre]});
      },
      authors: async function (callback) {
        return await Author.findAll();
      },
      genres: async function (callback) {
        return await Genre.findAll();
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        // No results.
        var err = new Error("Book not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      // Mark our selected genres as checked.
      for (
        var all_g_iter = 0;
        all_g_iter < results.genres.length;
        all_g_iter++
      ) {
        for (
          var book_g_iter = 0;
          book_g_iter < results.book.Genres.length;
          book_g_iter++
        ) {
          if (
            results.genres[all_g_iter].id.toString() ===
            results.book.Genres[book_g_iter].id.toString()
          ) {
            results.genres[all_g_iter].checked = "true";
          }
        }
      }
      res.render("book_form", {
        title: "Update Book",
        authors: results.authors,
        genres: results.genres,
        book: results.book,
      });
    }
  );
};

// Handle book update on POST.
exports.book_update_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped/trimmed data and old id.
    values = {
      title: req.body.title,
      authorId: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      id: req.params.id };
    var book = Book.build(values);
    selectedGenres = typeof req.body.genre === "undefined" ? [] : req.body.genre;

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form
      async.parallel(
        {
          authors: async function (callback) {
            return await Author.findAll();
          },
          genres: async function (callback) {
            return await Genre.findAll();
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }

          // Mark our selected genres as checked.
          for (let i = 0; i < results.genres.length; i++) {
            if (selectedGenres.indexOf(results.genres[i].id) > -1) {
              results.genres[i].checked = "true";
            }
          }
          res.render("book_form", {
            title: "Update Book",
            authors: results.authors,
            genres: results.genres,
            book: book,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Update the record.
      Book.update(values, { where: { id: req.params.id }})
        .then((result) => {
          return book.setGenres(selectedGenres);
        })
        .then((result) => {
          // Successful - redirect to book detail page.
          res.redirect(book.url);
        })
        .catch((err) => {
          return next(err);
        });
    }
  },
];
