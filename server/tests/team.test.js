import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import chai, { expect } from 'chai';

import app from '../../index';
import config from '../../config/config';
import Team from '../models/team.model';
import User from '../models/user.model';


chai.config.includeStack = true;

const user = {
  username: 'KK123',
  mobileNumber: '1234567890',
  password: 'test'
};

const validUserCredentials = {
  username: 'KK123',
  password: 'test'
};

describe('## Team APIs', () => {
  let jwtToken;
  let userId;
  let teamId;

  before(function(done) {
    Team.remove({}, () =>
      User.remove({}, () => {
        request(app)
          .post('/api/users')
          .send(user)
          .expect(httpStatus.OK)
          .then((res) => {
            request(app)
              .post('/api/auth/login')
              .send(validUserCredentials)
              .expect(httpStatus.OK)
              .then((res) => {
                jwtToken = res.body.token;
                userId = res.body.userId;
                done();
              })
              .catch(done);
          })
          .catch(done);
      }));
   });

  describe('# POST /api/teams', () => {
    it('should create a new team', (done) => {
      const team = { name: 'testTeam' };
      request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(team)
        .expect(httpStatus.OK)
        .then((res) => {
          teamId = res.body._id;
          expect(res.body.name).to.equal('testTeam');
          request(app)
            .get(`/api/users/${userId}`)
            .expect(httpStatus.OK)
            .then((res) => {
              expect(res.body.teamsId[0]).to.equal(teamId);
              done();
            })
            .catch(done);
        })
        .catch(done);
    });

    it('should return bad request', (done) => {
      const unvalidTeam = { unvalidField: 'value' };
      request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(unvalidTeam)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          done();
        })
        .catch(done);
    });

    it('should return unauthorized', (done) => {
      const team = { name: 'testTeam' };
      request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer grrgrgrgrg`)
        .send(team)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/teams', () => {
    it('should return unauthorized', (done) => {
      request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer grrgrgrgrg`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          done();
        })
        .catch(done);
    });

    it('should get all the users team', (done) => {
      request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.length).to.equal(1);
          expect(res.body[0]._id).to.equal(teamId);
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/teams/:teamId/addUser', () => {
    let newUserId;

    before(function(done) {
      request(app)
        .post('/api/users')
        .send(user)
        .expect(httpStatus.OK)
        .then((res) => {
          newUserId = res.body._id;
          done();
        });
    });

    it('should return unauthorized', (done) => {
      request(app)
        .post(`/api/teams/${teamId}/addUser`)
        .send({userId: newUserId})
        .set('Authorization', `Bearer grrgrgrgrg`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          done();
        })
        .catch(done);
    });

    it('should add a user to the team', (done) => {
      request(app)
        .post(`/api/teams/${teamId}/addUser`)
        .send({userId: newUserId})
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(httpStatus.OK)
        .then(res => {
          request(app)
            .get(`/api/users/${newUserId}`)
            .expect(httpStatus.OK)
            .then(res => {
              expect(res.body.teamsId[0]).to.equal(teamId);
              done();
            })
            .catch(done);
        })
        .catch(done);
    });
  })
});
