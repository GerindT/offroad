const Campground = require("../models/campground"),
      Comment    = require("../models/comment");

// all middleware goes here
const middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.session.redirectTo = req.originalUrl;
  req.flash("error", "Së pari duhet të hyni ne llogarin tuaj"); // add a one-time message before redirect
  res.redirect("/login");
};

middlewareObj.checkCampgroundOwenership = function(req, res, next) {
  if (req.isAuthenticated()) {
    Campground.findById(req.params.id, (err, foundCampground) => {
      if (err || !foundCampground) {
        req.flash("error", "Vendi nuk u gjet");
        res.redirect("back");
      } else {
        // does the user own the campground
        if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) { next(); }
        else {
          req.flash("error", "Ju nuk keni leje për ta bërë atë");
          res.redirect("back");
        }
      }
    });
  }
  else {
    req.flash("error", "Së pari duhet të hyni ne llogarin tuaj");
    res.redirect("/login");
  }
};

middlewareObj.checkCommentOwenership = function(req, res, next) {
  if (req.isAuthenticated()) {
    Comment.findById(req.params.comment_id, (err, foundComment) => {
      if (err || !foundComment) {
        req.flash("error", "Komenti nuk u gjet");
        res.redirect("back");
        
      } else {
        // does the user own the comment
        if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) { next(); }
        else {
          req.flash("error", "Ju nuk keni leje për ta bërë atë");
          res.redirect("back");
        }
      }
    });
  }
  else {
    req.flash("error", "Së pari duhet të hyni ne llogarin tuaj");
    res.redirect("/login");
  }
};
  
module.exports = middlewareObj;