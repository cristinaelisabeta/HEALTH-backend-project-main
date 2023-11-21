const { UnauthenticatedError } = require('../errors');
const passport = require('passport');

const auth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) {
      return next(new UnauthenticatedError('Authentication invalid'));
    }
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = auth;
