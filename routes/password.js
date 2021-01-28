const express    = require("express"),
      router     = express.Router(),
      User       = require("../models/user"),
      async      = require("async"),
      nodemailer = require("nodemailer"),
      crypto     = require("crypto");
      
// forgot password
router.get("/password_reset", (req, res) => res.render("password_reset"));

// send confirmation emails
router.post("/password_reset", (req, res, next) => {
  // use waterfall to increase readability of the following callbacks
  async.waterfall([
    function(done) {
      // generate random token
      crypto.randomBytes(20, (err, buf) => {
        let token = buf.toString("hex");
        done(err, token);
      });
    },
    function(token, done) {
      // find who made the request and assign the token to them
      User.findOne({ email: req.body.email }, (err, user) => {
        if (err) throw err;
        if (!user) {
          req.flash("error", "Kjo llogari OffRoad nuk ekziston.");
          return res.redirect("/password_reset");
        }
        
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // ms, 1hour
        
        user.save(err => done(err, token, user));
      });
    },
    function(token, user, done) {
      // indicate email account and the content of the confirmation letter
      let smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: "gerindt@gmail.com",
          pass: process.env.PASSWORD
        }
      });
      let mailOptions = {
        from: "gerindt@gmail.com",
        to: user.email,
        subject: "Reset your OffRoad Password",
        text: "Pershendetje " + user.firstName + ",\n\n" +
              "Ne kemi marrë një kërkesë për të rivendosur fjalëkalimin tuaj. Nëse nuk e keni bërë kërkesën, thjesht injoroni këtë email. Përndryshe, mund ta rivendosni fjalëkalimin tuaj duke përdorur këtë link:\n\n" +
              "https://" + req.headers.host + "/reset/" + token + "\n\n" +
              "Faleminderit.\n"+
              "Skuadra e OffRoad\n"
      };
      // send the email
      smtpTransport.sendMail(mailOptions, err => {
        if (err) throw err;
        console.log("mail sent");
        req.flash("success", "Një email është dërguar në " + user.email + " wme udhëzime të mëtejshme.");
        done(err, "done");
      });
    }
  ], err => {
    if (err) return next(err);
    res.redirect("/password_reset");
  });
});

// reset password ($gt -> selects those documents where the value is greater than)
router.get("/reset/:token", (req, res) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
    if (err) throw err;
    if (!user) {
      req.flash("error", "Token per rivendosjen e fjalëkalimit është i pavlefshem ose ka skaduar.");
      res.redirect("/password_reset");
    } else { res.render("reset", { token: req.params.token }) }
  });
});

// update password
router.post("/reset/:token", (req, res) => {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
        if (err) throw err;
        if (!user) {
          req.flash("error", "Token per rivendosjen e fjalëkalimit është i pavlefshem ose ka skaduar.");
          return res.redirect("/password_reset");
        }
        // check password and confirm password
        if (req.body.password === req.body.confirm) {
          // reset password using setPassword of passport-local-mongoose
          user.setPassword(req.body.password, err => {
            if (err) throw err;
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            
            user.save(err => {
              if (err) throw err;
              req.logIn(user, err => {
                done(err, user);
              });
            });
          });
        } else {
          req.flash("error", "Fjalëkalimet nuk përputhen");
          return res.redirect("back");
        } 
      });
    },
    function(user, done) {
      let smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: "gerindt@gmail.com",
          pass: process.env.PASSWORD
        }
      });
      let mailOptions = {
        from: "gerindt@gmail.com",
        to: user.email,
        subject: "Fjalëkalimi juaj OffRoad është ndryshuar",
        text: "Pershendetje " + user.firstName + ",\n\n" +
              "Ky është një konfirmim që fjalëkalimi për llogarinë tuaj "+ user.email +" sapo është ndryshuar.\n\n" +
              "Më te mirat,\n"+
              "Skuadra e OffRoad\n"
      };
      smtpTransport.sendMail(mailOptions, err => {
        if (err) throw err;
        req.flash("success", "Fjalekalimi juaj eshte ndryshuar.");
        done(err);
      });
    },
  ], err => {
    if (err) throw err;
    res.redirect("/campgrounds");
  });
});

module.exports = router;
