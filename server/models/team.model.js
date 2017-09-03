import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Team Schema
 */
const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
TeamSchema.method({
});

/**
 * Statics
 */
TeamSchema.statics = {
  /**
   * Get team
   * @param {ObjectId} id - The objectId of team.
   * @returns {Promise<Team, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then(team => {
        if (team) {
          return team;
        }
        const err = new APIError('No such team exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List teams in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of teams to be skipped.
   * @param {number} limit - Limit number of teams to be returned.
   * @returns {Promise<Team[]>}
   */
  list(teamsId = [], { skip = 0, limit = 50 } = {}) {
    return this.find({ _id: { $in: teamsId } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
};

/**
 * @typedef Team
 */
export default mongoose.model('Team', TeamSchema);
