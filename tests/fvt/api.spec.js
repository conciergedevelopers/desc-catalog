(function() {

    'use strict';

    var utils = require('./utils.js');
    var assert = require('chai').assert;
    var async = require('async');

    /* 
       sometimes due to timeout the database is left with data added by the FVT test cases, in other words the
       FVT does not leave database in the same state it started with. In this case some of the testcases may find
       more row than it expects. I am using async to handle these sutuations  - Umesh P
    */ 

    describe('API', function() {
        this.timeout(10000);
        it('list all records', function(done) {
            utils.makeRestCall({method: 'GET'}, '/records', null, function(err, resp, body) {
                //console.log(JSON.stringify(body, null, 4));
                assert(resp.statusCode === 200, 'Unexpected status code: ' + resp.statusCode);
                assert(body.total_rows === 9, "Incorrect total rows: ", body.total_rows);
                done();
            });
        });

        it('add a record', function(done) {
            var postbody = {name: 'Test Record', desc: 'Sample desc', baseCost: 5000, perAddTraveler: 5, cancelFee: 150, minDays: 3, perAddDay: 5, levelCare: 3, amount: 10000};
            utils.makeRestCall({method: 'POST', body: postbody}, '/records', null, function(err, resp, body) {
                //console.log(JSON.stringify(body, null, 4));
                assert(resp.statusCode === 200, 'Unexpected status code: ' + resp.statusCode);
                assert(body.msg === "Successfully created record", "Incorrect message received: ", body.msg);
                done();
            });
        });

        it('Compute Fabonacci', function(done) {
            utils.makeRestCall({method: 'GET'}, '/fib', null, function(err, resp, body) {
                //console.log(JSON.stringify(body, null, 4));
                assert(resp.statusCode === 200, 'Unexpected status code: ' + resp.statusCode);
                assert(body.msg === "Done with fibonacci of 20: 10946", "Incorrect message received: ", body.msg);
                done();
            });
        });

        it('get record using id', function(done) {
            utils.getrecords('Test Record', function(err, data) {
                if(err) {
                    assert.fail("Failed to get records using name");
                    done();
                } else {
                    if(data.length === 0) {
                        return done();
                    }
                    async.every(data, function(record, callback) {
                        utils.makeRestCall({method: 'GET'}, '/records/' + record._id, null, function(err, resp, body) {
                            //console.log(JSON.stringify(body, null, 4));
                            if(resp.statusCode === 200) {
                                return callback(true);
                            } else {
                                return callback(false);
                            }
                        });
                    }, function(result) {
                        if(result === false) {
                            assert("failed while getting the records");
                        }
                        done();
                    });
                }
            });
        });

        it('update Record using id', function(done) {
            utils.get('Test Record', function(err, data) {
                if(err) {
                    assert.fail("Failed to get records using name");
                    done();
                } else {
                    if(data.length === 0) {
                        return done();
                    }
                    async.every(data, function(record, callback) {
                        record.additional = "Something new";
                        utils.makeRestCall({method: 'PUT', body: item}, '/records/' + record._id, null, function(err, resp, body) {
                            //console.log(JSON.stringify(body, null, 4));
                            if( (resp.statusCode === 200) && (body.additional === 'Something new') ) {
                                return callback(true);
                            } else {
                                return callback(false);
                            }
                        });
                    }, function(result) {
                        if(result === false) {
                            assert("failed to update a record");
                        }
                        done();
                    });
                }
            });
        });

        it('delete record using id', function(done) {
            utils.getItems('Test Record', function(err, data) {
                if(err) {
                    assert.fail("Failed to get records using name");
                    done();
                } else {
                    if(data.length === 0) {
                        return done();
                    }
                    async.every(data, function(record, callback) {
                        utils.makeRestCall({method: 'DELETE'}, '/records/' + record._id, null, function(err, resp, body) {
                            //console.log(JSON.stringify(body, null, 4));
                            if( (resp.statusCode === 200) && (body.msg === "Successfully deleted record") ) {
                                return callback(true);
                            } else {
                                return callback(false);
                            }
                        });
                    }, function(result) {
                        if(result === false) {
                            assert("failed to delete a record");
                        }
                        done();
                    });
                }
            });
        });

    });
}());
