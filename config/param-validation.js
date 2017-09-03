import Joi from 'joi';

export default {
  // POST /api/users
  createUser: {
    body: {
      username: Joi.string().required(),
      password: Joi.string().required(),
      mobileNumber: Joi.string().regex(/^[1-9][0-9]{9}$/).required()
    }
  },

  // UPDATE /api/users/:userId
  updateUser: {
    body: {
      username: Joi.string().required(),
      mobileNumber: Joi.string().regex(/^[1-9][0-9]{9}$/).required()
    },
    params: {
      userId: Joi.string().hex().required()
    }
  },

  // POST /api/auth/login
  login: {
    body: {
      username: Joi.string().required(),
      password: Joi.string().required()
    }
  },

  // POST /api/team/:teamId/report
  createReport: {
    body: {
      yesterday: Joi.array().required(),
      today: Joi.array().required(),
      problems: Joi.string(),
      date: Joi.string()
    }
  },

  // PUT /api/team/:teamId/report
  updateReport: {
    body: {
      yesterday: Joi.array().required(),
      today: Joi.array().required(),
      problems: Joi.string(),
      date: Joi.string()
    }
  },

  // POST /api/team
  createTeam: {
    body: {
      name: Joi.string().required()
    }
  },

  // POST /api/team/:teamId/addUser
  addUserToTeam: {
    body: {
      userId: Joi.string().required()
    }
  }
};
