import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';

import APIError from '../helpers/APIError';
import { removeDays } from '../helpers/date';

/**
 * report Schema
 */
const ReportSchema = new mongoose.Schema({
  today: {
    type: Array,
    required: true
  },
  yesterday: {
    type: Array,
    required: true
  },
  problems: {
    type: String
  },
  teamId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  keywords: {
    type: Array
  },
  usersThatCanHelpId: {
    type: Array
  },
  date: {
    type: Date,
    default: Date.now()
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

/**
 * Methods
 */
ReportSchema.method({
});

/**
 * Statics
 */
ReportSchema.statics = {
  /**
   * Get report
   * @param {ObjectId} id - The objectId of report.
   * @returns {Promise<report, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then(report => {
        if (report) {
          return report;
        }
        const err = new APIError('No such report exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List report by user Id
   * @param {String} reportname - The userId of reports.
   * @returns {Promise<report, APIError>}
   */
   listByUserId(userId, { skip = 0, limit = 50 }) {
    return this.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec()
      .then(reports => {
        if (reports) {
          return reports;
        }
        const err = new APIError('No reports with this user ID', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List report by user Id
   * @param {String} teamId - The teamId of reports.
   * @returns {Promise<report, APIError>}
   */
  listByTeamId(teamId, { skip = 0, limit = 50, date, userId}) {
    const query = { teamId };

    if(date) {
      query.date = { $gt: removeDays(date, 1), $lte: date };
    }

    if(userId) {
      query.userId = userId;
    }

    return this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec()
      .then(reports => {
        if (reports) {
          return reports;
        }
        const err = new APIError('No reports with this team ID', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List report by keywords
   * @param {String} keywords - The keywords of reports.
   * @returns {Promise<report, APIError>}
   */
  listByKeywords(keywords, teamId, { skip = 0, limit = 665 }) {
    return this.find({ teamId, keywords: { $in: keywords } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()
      .then(reports => {
        if (reports) {
          return reports;
        }
        const err = new APIError('No reports with this keywords', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List reports in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of reports to be skipped.
   * @param {number} limit - Limit number of reports to be returned.
   * @returns {Promise<report[]>}
   */
  list({ skip = 0, limit = 50 }) {
    return this.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
};

/**
 * @typedef report
 */
export default mongoose.model('report', ReportSchema);
