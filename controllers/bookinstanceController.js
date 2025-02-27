var BookInstance = require("../models/bookinstance");
var Book = require("../models/book");
var async = require("async");

const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.findAll({include: Book})
    .then((list_bookinstances) => {
      // Successful, so render.
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      });        
    })
    .catch((err) => {
      return next(err);
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findByPk(req.params.id, {include: Book})
    .then((bookinstance) => {
      if (bookinstance == null) {
        // No results.
        var err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("bookinstance_detail", {
        title: "Book:",
        bookinstance: bookinstance,
      });
    })
    .catch((err) => {
      return next(err);
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
  Book.findAll()
    .then((books) => {
      // Successful, so render.
      res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: books,
      });
    })
    .catch((err) => {
      return next(err);
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    var bookinstance = BookInstance.build({
      bookId: parseInt(req.body.book),
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.findAll()
        .then((books) => {
          // Successful, so render.
          res.render("bookinstance_form", {
            title: "Create BookInstance",
            book_list: books,
            selected_book: bookinstance.bookId,
            errors: errors.array(),
            bookinstance: bookinstance,
          })
        })
        .catch((err) => {
          return next(err);
        });
      return;
    } else {
      // Data from form is valid
      bookinstance.save()
        .then((result) => {
          // Successful - redirect to new record.
          res.redirect(bookinstance.url);
        })
        .catch((err) => {
          return next(err);
        });
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {
  BookInstance.findByPk(req.params.id, {include: Book})
    .then((bookinstance) => {
      if (bookinstance == null) {
        // No results.
        res.redirect("/catalog/bookinstances");
      }
      // Successful, so render.
      res.render("bookinstance_delete", {
        title: "Delete BookInstance",
        bookinstance: bookinstance,
      });
    })
    .catch((err) => {
        return next(err);
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {
  // Assume valid BookInstance id in field.
  BookInstance.destroy({where: {id: req.body.id}})
    .then((result) => {
      // Success, so redirect to list of BookInstance items.
      res.redirect("/catalog/bookinstances");
    })
    .catch((err) => {
      return next(err);
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
  // Get book, authors and genres for form.
  async.parallel(
    {
      bookinstance: async function (callback) {
        return await BookInstance.findByPk(req.params.id, {include: Book});
      },
      books: async function (callback) {
        return await Book.findAll();
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.bookinstance == null) {
        // No results.
        var err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      res.render("bookinstance_form", {
        title: "Update  BookInstance",
        book_list: results.books,
        selected_book: results.bookinstance.bookId,
        bookinstance: results.bookinstance,
      });
    }
  );
};

// Handle BookInstance update on POST.
exports.bookinstance_update_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped/trimmed data and current id.
    values = {
      bookId: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      id: req.params.id };
    var bookinstance = BookInstance.build(values);

    if (!errors.isEmpty()) {
      // There are errors so render the form again, passing sanitized values and errors.
      Book.findAll()
        .then((books) => {
          // Successful, so render.
          res.render("bookinstance_form", {
            title: "Update BookInstance",
            book_list: books,
            selected_book: bookinstance.bookId,
            errors: errors.array(),
            bookinstance: bookinstance,
          })
        })
        .catch((err) => {
          return next(err);
        });
      return;
    } else {
      // Data from form is valid.
      BookInstance.update(values, { where: { id: req.params.id }})
        .then((result) => {
          // Successful - redirect to detail page.
          res.redirect(bookinstance.url);
        })
        .catch((err) => {
          return next(err);
        }
      );
    }
  },
];
