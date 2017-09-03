import express from 'express';
import validate from 'express-validation';
import expressJwt from 'express-jwt';

import config from '../../config/config';
import paramValidation from '../../config/param-validation';
import reportCtrl from '../controllers/report.controller';
import teamCtrl from '../controllers/team.controller';
import userCtrl from '../controllers/user.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/:teamId/reports')
  /** POST /api/teams/:teamId/reports -Create report */
  .post(expressJwt({ secret: config.jwtSecret }), validate(paramValidation.createReport), reportCtrl.create)
  .put(expressJwt({ secret: config.jwtSecret }), validate(paramValidation.updateReport), reportCtrl.update)
  .get(expressJwt({ secret: config.jwtSecret }), reportCtrl.list)

  router.route('/')
    /** POST /api/teams - Create team */
    .post(expressJwt({ secret: config.jwtSecret }), validate(paramValidation.createTeam), teamCtrl.create)
    .get(expressJwt({ secret: config.jwtSecret }), teamCtrl.list)

  router.route('/:teamId/addUser')
    /** POST /api/teams/:teamId/addUser - Add a user to team */
    .post(expressJwt({ secret: config.jwtSecret }), validate(paramValidation.addUserToTeam), userCtrl.addToTeam)

/** Load user when API with userId route parameter is hit */
router.param('teamId', teamCtrl.load);

export default router;
