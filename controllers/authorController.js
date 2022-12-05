var Author = require("../models/author");
var async = require("async");
var Book = require("../models/book");

const { body, validationResult } = require("express-validator");

// Display list of all Authors.
exports.author_list = function (req, res, next) {
  Author.findAll({order: [['family_name', 'ASC']]})
    .then((list_authors) => {
      // Successful, so render.
      res.render("author_list", {
        title: "Author List",
        author_list: list_authors,
      });        
    })
    .catch((err) => {
      return next(err);
    });
};

// Display detail page for a specific Author.
exports.author_detail = function (req, res, next) {
  async.parallel(
    {
      author: async function (callback) {
        return await Author.findByPk(req.params.id);
      },
      authors_books: async function (callback) {
        return await (await Author.findByPk(req.params.id)).getBooks();  // inner query finds the author; outer query returns the books of that author.
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      } // Error in API usage.
      if (results.author == null) {
        // No results.
        var err = new Error("Author not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("author_detail", {
        title: "Author Detail",
        author: results.author,
        author_books: results.authors_books,
      });
    }
  );
};

// Display Author create form on GET.
exports.author_create_get = function (req, res, next) {
  res.render("author_form", { title: "Create Author" });
};

// Handle Author create on POST.
exports.author_create_post = [
  // Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create Author object with escaped and trimmed data
    var author = Author.build({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render("author_form", {
        title: "Create Author",
        author: author,
        errors: errors.array(),
      });
      return;
    } else { 
      // Data from form is valid.
      // Save author.
      author.save()
        .then((result) => {
          // Successful - redirect to new author record.
          res.redirect(author.url);
        })
        .catch((err) => {
          return next(err);
        });
    }
  },
];

// Display Author delete form on GET.
exports.author_delete_get = function (req, res, next) {
  async.parallel(
    {
      author: async function (callback) {
        return await Author.findByPk(req.params.id);
      },
      authors_books: async function (callback) {
        return await Book.findAll({ where: { authorId: req.params.id }});
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        // No results.
        res.redirect("/catalog/authors");
      }
      // Successful, so render.
      res.render("author_delete", {
        title: "Delete Author",
        author: results.author,
        author_books: results.authors_books,
      });
    }
  );
};

// Handle Author delete on POST.
exports.author_delete_post = function (req, res, next) {
  async.parallel(
    {
      author: async function (callback) {
        return await Author.findByPk(req.body.authorid);
      },
      authors_books: async function (callback) {
        return await Book.findAll({ where: { authorId: req.body.authorid }});
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Success.
      if (results.authors_books.length > 0) {
        // Author has books. Render in same way as for GET route.
        res.render("author_delete", {
          title: "Delete Author",
          author: results.author,
          author_books: results.authors_books,
        });
        return;
      } else {
        // Author has no books. Delete object and redirect to the list of authors.
        Author.destroy({where: {id: req.body.authorid}})
          .then((result) => {
            // Success - go to author list.
            res.redirect("/catalog/authors");
          })
          .catch((err) => {
            return next(err);
          });
      }
    }
  );
};

// Display Author update form on GET.
exports.author_update_get = function (req, res, next) {
  Author.findByPk(req.params.id)
    .then((author) => {
      if (author == null) {
        // No results.
        var err = new Error("Author not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      res.render("author_form", { title: "Update Author", author: author });
    })
    .catch((err) => {
      return next(err);
    });
};

// Handle Author update on POST.
exports.author_update_post = [
  // Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create Author object with escaped and trimmed data (and the old id!)
    values = {
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      id: req.params.id };
    var author = Author.build(values);

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values and error messages.
      res.render("author_form", {
        title: "Update Author",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      Author.update(values, { where: { id: req.params.id }})
        .then((result) => {
            // Successful - redirect to genre detail page.
            res.redirect(author.url);
          })
        .catch((err) => {
          return next(err);
        });
    }
  },
];
