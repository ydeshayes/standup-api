import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import passwordHash from 'password-hash';

import APIError from '../helpers/APIError';
import config from '../../config/config';
import User from '../models/user.model';

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function login(req, res, next) {
  User.getByUsername(req.body.username)
    .then(user => {
      if (user && req.body.username === user.username && passwordHash.verify(req.body.password, user.password)) {
        const token = jwt.sign({
          username: user.username,
          id: user.id
        }, config.jwtSecret);
        return res.json({
          token,
          username: user.username,
          userId: user.id
        });
      }

      const err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true);
      return next(err);
    })
    .catch(err => next(new APIError('Authentication error', httpStatus.UNAUTHORIZED, true)));
}

/**
 * This is a protected route. Will return random number only if jwt token is provided in header.
 * @param req
 * @param res
 * @returns {*}
 */
function getRandomNumber(req, res) {
  // req.user is assigned by jwt middleware if valid token is provided
  return res.json({
    user: req.user,
    num: Math.random() * 100
  });
}

export default { login, getRandomNumber };
