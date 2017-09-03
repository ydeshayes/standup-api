import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import chai, { expect } from 'chai';

import app from '../../index';
import config from '../../config/config';
import Team from '../models/team.model';
import User from '../models/user.model';
import Report from '../models/report.model';
import { addDays, removeDays } from '../helpers/date';


chai.config.includeStack = true;

const user = {
  username: 'KK123',
  mobileNumber: '1234567890',
  password: 'test'
};

const otherUser = {
  username: 'KK1234',
  mobileNumber: '1244567890',
  password: 'test'
};

const validUserCredentials = {
  username: 'KK123',
  password: 'test'
};

const validOtherUserCredentials = {
  username: 'KK1234',
  password: 'test'
};

describe('## Report APIs', () => {
  let jwtToken;
  let otherUserJwtToken;
  let userId;
  let otherUserId;
  let teamId;
  let reportId;

  before(function(done) {
    Report.remove({}, () =>
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
                  const team = { name: 'testTeam' };
                  request(app)
                    .post('/api/teams')
                    .set('Authorization', `Bearer ${jwtToken}`)
                    .send(team)
                    .expect(httpStatus.OK)
                    .then((res) => {
                      teamId = res.body._id;
                      request(app)
                        .post('/api/users')
                        .send(otherUser)
                        .expect(httpStatus.OK)
                        .then((res) => {
                          request(app)
                            .post('/api/auth/login')
                            .send(validOtherUserCredentials)
                            .expect(httpStatus.OK)
                            .then((res) => {
                              otherUserJwtToken = res.body.token;
                              otherUserId = res.body.userId;
                              request(app)
                                .post(`/api/teams/${teamId}/addUser`)
                                .send({userId: otherUserId})
                                .set('Authorization', `Bearer ${jwtToken}`)
                                .expect(httpStatus.OK)
                                .then(res => {
                                  done();
                                });
                            });
                        })
                    });
                });
            });
      })));
   });

  describe('# POST /api/teams/:teamId/reports', () => {
    it('should create a new report', (done) => {
      const report = {
        yesterday: ['this is a testYesterday'] ,
        today: ['this is a testToday'],
        problems: 'this is a testPb'
      };
      request(app)
        .post(`/api/teams/${teamId}/reports`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(report)
        .expect(httpStatus.OK)
        .then((res) => {
          reportId = res.body._id;
          expect(res.body.userId).to.equal(userId);
          expect(res.body.usersThatCanHelpId.length).to.equal(0);
          expect(res.body.yesterday.length).to.equal(1);
          expect(res.body.yesterday[0]).to.equal('this is a testYesterday');
          expect(res.body.today.length).to.equal(1);
          expect(res.body.today[0]).to.equal('this is a testToday');
          expect(res.body.problems).to.equal('this is a testPb');
          expect(res.body.keywords.length).to.equal(2);
          expect(res.body.keywords[0]).to.equal('testtoday');
          expect(res.body.keywords[1]).to.equal('testpb');
          done();
        })
        .catch(done);
    });

    it('should not create a new report because we already have a report for today', (done) => {
      const report = {
        yesterday: ['this is a testYesterday'] ,
        today: ['this is a testToday'],
        problems: 'this is a testPb'
      };
      request(app)
        .post(`/api/teams/${teamId}/reports`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(report)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          done();
        })
        .catch(done);
    });

    it('should create a new report and add a user that can help', (done) => {
      const report = {
        yesterday: ['I will do a testYesterday'] ,
        today: ['I will do a testToday']
      };
      request(app)
        .post(`/api/teams/${teamId}/reports`)
        .set('Authorization', `Bearer ${otherUserJwtToken}`)
        .send(report)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.userId).to.equal(otherUserId);
          expect(res.body.usersThatCanHelpId.length).to.equal(1);
          expect(res.body.usersThatCanHelpId[0]).to.equal(userId);
          expect(res.body.yesterday.length).to.equal(1);
          expect(res.body.yesterday[0]).to.equal('I will do a testYesterday');
          expect(res.body.today.length).to.equal(1);
          expect(res.body.today[0]).to.equal('I will do a testToday');
          expect(res.body.keywords.length).to.equal(1);
          expect(res.body.keywords[0]).to.equal('testtoday');
          done();
        })
        .catch(done);
    });

    it('should return bad request', (done) => {
      const unvalidReport = {
        yesterday: ['testYesterday']
      };
      request(app)
        .post(`/api/teams/${teamId}/reports`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(unvalidReport)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          done();
        })
        .catch(done);
    });

    it('should return unauthorized', (done) => {
      const report = {
        yesterday: ['testYesterday'] ,
        today: ['testToday'],
        problems: 'testPb'
      };
      request(app)
        .post(`/api/teams/${teamId}/reports`)
        .set('Authorization', `Bearer grrgrgrgrg`)
        .send(report)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          done();
        })
        .catch(done);
    });
  });

  describe('# PUT /api/teams/:teamId/reports', () => {
    it('should update report', (done) => {
      const report = {
        _id: reportId,
        yesterday: ['updated this is a testYesterday'] ,
        today: ['updated this is a testToday'],
        problems: 'updated this is a testPb'
      };
      request(app)
        .put(`/api/teams/${teamId}/reports`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(report)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.userId).to.equal(userId);
          expect(res.body.usersThatCanHelpId.length).to.equal(0);
          expect(res.body.yesterday.length).to.equal(1);
          expect(res.body.yesterday[0]).to.equal('updated this is a testYesterday');
          expect(res.body.today.length).to.equal(1);
          expect(res.body.today[0]).to.equal('updated this is a testToday');
          expect(res.body.problems).to.equal('updated this is a testPb');
          expect(res.body.keywords.length).to.equal(2);
          expect(res.body.keywords[0]).to.equal('testtoday');
          expect(res.body.keywords[1]).to.equal('testpb');
          done();
        })
        .catch(done);
    });

    it('should not update report because the user is not the author', (done) => {
      const report = {
        _id: reportId,
        yesterday: ['updated this is a testYesterday'] ,
        today: ['updated this is a testToday'],
        problems: 'updated this is a testPb'
      };
      request(app)
        .put(`/api/teams/${teamId}/reports`)
        .set('Authorization', `Bearer ${otherUserJwtToken}`)
        .send(report)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          done();
        })
        .catch(done);
    });

    it('should return bad request', (done) => {
      const unvalidReport = {
        yesterday: ['testYesterday']
      };
      request(app)
        .put(`/api/teams/${teamId}/reports`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(unvalidReport)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          done();
        })
        .catch(done);
    });

    it('should return unauthorized', (done) => {
      const report = {
        yesterday: ['testYesterday'] ,
        today: ['testToday'],
        problems: 'testPb'
      };
      request(app)
        .put(`/api/teams/${teamId}/reports`)
        .set('Authorization', `Bearer grrgrgrgrg`)
        .send(report)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/teams/:teamId/reports', () => {
    it('should return unauthorized', (done) => {
      request(app)
        .get(`/api/teams/${teamId}/reports`)
        .set('Authorization', `Bearer grrgrgrgrg`)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          done();
        })
        .catch(done);
    });

    it('should get all the report team', (done) => {
      request(app)
        .get(`/api/teams/${teamId}/reports`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.length).to.equal(2);
          expect(res.body[0].teamId).to.equal(teamId);
          done();
        })
        .catch(done);
    });

    it('should get all the report team of today', (done) => {
		console.log(`/api/teams/${teamId}/reports?date=${Date.now()}`);
      request(app)
        .get(`/api/teams/${teamId}/reports?date=${Date.now()}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.length).to.equal(2);
          expect(res.body[0].teamId).to.equal(teamId);
          done();
        })
        .catch(done);
    });

    it('should get all the report team for tomorrow (none)', (done) => {
      request(app)
        .get(`/api/teams/${teamId}/reports?date=${addDays(new Date(), 2).getTime()}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.length).to.equal(0);
          done();
        })
        .catch(done);
    });
  })
});
