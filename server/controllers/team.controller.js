import passwordHash from 'password-hash';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

import Team from '../models/team.model';
import User from '../models/user.model';

/**
 * Load team and append to req.
 */
function load(req, res, next, id) {
  Team.get(id)
    .then((team) => {
      req.team = team; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get team
 * @returns {Team}
 */
function get(req, res) {
  return res.json(req.team);
}

/**
 * Create new team
 * @property {string} req.body.teamname - The teamname of team.
 * @property {string} req.body.mobileNumber - The mobileNumber of team.
 * @returns {Team}
 */
function create(req, res, next) {
  const team = new Team({
    name: req.body.name
  });
  const user = req.user;

  team.save()
    .then(savedTeam => {
      User.findById(user.id).then(userToUpdate => {
        if(!userToUpdate.teamsId) {
          userToUpdate.teamsId = [];
        }
        userToUpdate.teamsId.push(savedTeam.id);
        userToUpdate.save();
        return res.json(savedTeam);
      });
    })
    .catch(e => next(e));
}

/**
 * Update existing team
 * @property {string} req.body.teamname - The teamname of team.
 * @property {string} req.body.mobileNumber - The mobileNumber of team.
 * @returns {Team}
 */
function update(req, res, next) {
  const team = req.team;
  team.name = req.body.name;

  team.save()
    .then(savedTeam => res.json(savedTeam))
    .catch(e => next(e));
}

/**
 * Get team list.
 * @property {number} req.query.skip - Number of teams to be skipped.
 * @property {number} req.query.limit - Limit number of teams to be returned.
 * @returns {Team[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  const jwtUser = req.user;
  User.findById(jwtUser.id)
    .then(user => {
      Team.list(user.teamsId, { limit, skip })
        .then(teams => res.json(teams))
        .catch(err => next(err));
    })
    .catch(err => next(err));
}

/**
 * Delete team.
 * @returns {Team}
 */
function remove(req, res, next) {
  const team = req.team;
  team.remove()
    .then(deletedTeam => res.json(deletedTeam))
    .catch(e => next(e));
}

export default { load, get, create, update, list, remove };
