const express    = require("express"),
      router     = express.Router(),
      User       = require("../models/user"),
      Campground = require("../models/campground"),
      middleware = require("../middleware");
      
// User profile
router.get("/:id", middleware.isLoggedIn, (req, res) => {
  User.findById(req.params.id, (err, foundUser) => {
    if (err || !foundUser) {
      req.flash("error", "Dicka shkoi keq...");
      res.redirect("/campgrounds");
    } else {
      Campground.find().where("author.id").equals(foundUser._id).exec((err, campgrounds) => {
        if (err) {
          req.flash("error", "Dicka shkoi keq...");
          res.redirect("/campgrounds");
        } else { res.render("users/show", { user: foundUser, campgrounds }); }
      });
    }
  });
});

// show edit form
router.get("/:id/edit", middleware.isLoggedIn, (req, res) => {
  User.findById(req.params.id, (err, foundUser) => {
    if (err || !foundUser) { return res.redirect("back"); }
    if (foundUser._id.equals(req.user._id)) {
      res.render("users/edit", { user: foundUser }); 
    } else {
      req.flash("error", "Ju nuk keni leje për ta bërë atë");
      res.redirect("back");
    } 
  });
});

// update profile
router.put("/:id", middleware.isLoggedIn, (req, res) => {
  User.findByIdAndUpdate(req.params.id, req.body.user, (err, updatedUser) => {
    if (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        // Duplicate email
        req.flash("error", "Ai email tashmë është regjistruar.");
        return res.redirect("/users" + req.params.id);
      } 
      // Some other error
      req.flash("error", "Dicka shkoi keq...");
      return res.redirect("/users" + req.params.id);
    }
    if (updatedUser._id.equals(req.user._id)) {
      res.redirect("/users/" + req.params.id);
    } else {
      req.flash("error", "Ju nuk keni leje për ta bërë atë");
      res.redirect("/campgrounds");
    }
  });
});

module.exports = router;