import passwordHash from 'password-hash';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

import User from '../models/user.model';

/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  User.get(id)
    .then((user) => {
      req.user = user; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get user
 * @returns {User}
 */
function get(req, res) {
  return res.json(req.user);
}

/**
 * Create new user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {User}
 */
function create(req, res, next) {
  const user = new User({
    username: req.body.username,
    mobileNumber: req.body.mobileNumber,
    password: passwordHash.generate(req.body.password),
    teamsId: []
  });

  user.save()
    .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}

/**
 * Update existing user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {User}
 */
function update(req, res, next) {
  const user = req.user;
  user.username = req.body.username;
  user.mobileNumber = req.body.mobileNumber;

  user.save()
    .then(savedUser => res.json(savedUser))
    .catch(e => next(e));
}

/**
 * Add user to a team
 * @property {string} req.body.userId - The user you want to add
 * @returns {User}
 */
function addToTeam(req, res, next) {
  const jwtUser = req.user;
  const teamId = req.team.id;
  const userId = req.body.userId;
  User.get(jwtUser.id)
    .then(user => {
      if(user.teamsId.indexOf(teamId) === -1) {
        const err = new APIError('You must be in the team to add new members', httpStatus.UNAUTHORIZED, true);
        return next(err);
      }

      User.findById(userId).then(userToUpdate => {
        if(!userToUpdate.teamsId) {
          userToUpdate.teamsId = [];
        }

        if(userToUpdate.teamsId.indexOf(teamId) !== -1) {
          const err = new APIError('The user is already a member of this team', httpStatus.BAD_REQUEST, true);
          return next(err);
        }

        userToUpdate.teamsId.push(teamId);
        userToUpdate.save()
          .then(savedUser => res.json(savedUser))
          .catch(err => next(err));
      });
    })
    .catch(err => next(err));
}

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {User[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  User.list({ limit, skip })
    .then(users => res.json(users))
    .catch(e => next(e));
}

/**
 * Delete user.
 * @returns {User}
 */
function remove(req, res, next) {
  const user = req.user;
  user.remove()
    .then(deletedUser => res.json(deletedUser))
    .catch(e => next(e));
}

export default { load, get, create, update, list, remove, addToTeam };
