import passwordHash from 'password-hash';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
let removeWords =  require('remove-words');

import Report from '../models/report.model';
import User from '../models/user.model';

function getReportWithKeywordAndUserThatCanHelp(report, teamId, mongoUserId) {
  // Extract keyword from today report and problems
  removeWords = removeWords.main || removeWords;// Fix tests
  const keywords = removeWords(`${report.today.join(' ')} ${report.problems || ''}`, true/*Remove duplicates*/);

  // Find in the past report, report that have the same keyword
  return Report.listByKeywords(keywords, teamId, {}).then(reports => {
    // And extract the users id and remove duplicates and the current user from this list
    const usersThatCanHelpId = reports
      .map(r => r.userId)
      .reduce((usersId, userId) => (userId && (userId != mongoUserId) && (usersId.indexOf(userId) === -1)) ? usersId.concat([userId]) : usersId, []);

    return new Report({
      yesterday: report.yesterday,
      today: report.today,
      problems: report.problems,
      keywords,
      teamId: teamId,
      userId: mongoUserId,
      usersThatCanHelpId
    });
  });
}

/**
 * Create new report
 * @property {array} req.body.yesterday - What the user has done yesterday.
 * @property {array} req.body.today - What the user will do today.
 * @property {string} req.body.problems - Any problems.
 * @returns {Report}
 */
function create(req, res, next) {
  const team = req.team;
  const jwtUser = req.user;
  User.get(jwtUser.id).then(user => {
    if(user.teamsId.indexOf(team.id) === -1) {
      const err = new APIError('You must be in the team to post new report', httpStatus.UNAUTHORIZED, true);
      return next(err);
    }

    Report.listByTeamId(team.id, {date: req.body.date || new Date(), userId: user._id}).then(reports => {
      if(reports.length) {
        const err = new APIError(`You already reported for ${reports[0].date}`, httpStatus.BAD_REQUEST, true);
        return next(err);
      }

      getReportWithKeywordAndUserThatCanHelp({...req.body}, team.id, user._id)
        .then(reportToSave => {
          reportToSave.save()
            .then(savedReport => res.json(savedReport))
            .catch(e => next(e));
        })
        .catch(err => next(err));

    });
  });
}

/**
 * Update existing report
 * @property {array} req.body.yesterday - What the user has done yesterday.
 * @property {array} req.body.today - What the user will do today.
 * @property {string} req.body.problems - Any problems.
 * @returns {Report}
 */
function update(req, res, next) {
  const reportToUpdateId = req.body._id;
  const userId = req.user.id;

  Report.get(reportToUpdateId)
    .then(report => {
      if(report.userId !== userId) {
        const err = new APIError(`You must be the author to edit the report`, httpStatus.UNAUTHORIZED, true);
        return next(err);
      }

      report.today =  req.body.today;
      report.yesterday =  req.body.yesterday;
      report.problems =  req.body.problems;

      report.save()
        .then(savedReport => res.json(savedReport))
        .catch(e => next(e));
    });
}

/**
 * Get report list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @property {date} req.query.date - the date of the reports
 * @property {string} req.query.teamId - the team Id
 * @returns {Report[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0, date } = req.query;
  const teamId = req.team._id;
  
  User.get(req.user.id).then(user => {
    if(user.teamsId.indexOf(teamId) === -1) {
      const err = new APIError('You must be in the team to list reports', httpStatus.UNAUTHORIZED, true);
      return next(err);
    }
	
	let parsedDate;
	if(date) {
		parsedDate = parseInt(date, 10);
	}
    
	Report.listByTeamId(teamId, { limit, skip, date: parsedDate })
      .then(reports => res.json(reports))
      .catch(e => next(e));
  });
}

export default { create, update, list };
