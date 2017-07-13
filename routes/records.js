/*eslint-env node */
var http = require('http');
var USE_FASTCACHE = false;

try {
    var db = require('./db');
    db.initDB();
}
catch (e) {
  console.error("Error initializing services for /records: ", e);
}

/*
 * To enable the load generator and 'improved' cache mechanism below:
 * 1. remove the 'res.json({"success": 0, "fail": 0, "time": 0});' line
 * 2. uncomment the remaining method body
 */
exports.loadTest = function(req, res) {

    USE_FASTCACHE = true;
    var testCount = req.query.count;
    testCount = testCount ? parseInt(testCount) : 100;

    var successCount = 0, failCount = 0;
    var startTime = Date.now();

    var callback = function(response) {
        if (response.statusCode === 200) {
            successCount++;
        } else {
            failCount++;
        }

        if (successCount + failCount === testCount) {
            var endTime = Date.now();
            res.json({"success": successCount, "fail": failCount, "time": endTime - startTime});
        }
    };

    var recordId1 = "1f9e7891bffb03605e3a9b43f996f6ea";
    var recordId2 = "9dce21273d13dc1dcb1b47370359e753";
    for (var i = 0; i < testCount; i++) {
        http.get({
            host: req.get('host'),
            path: "/records/" + (i % 2 ? recordId1 : recordId2)
	}, callback);
    }
*/
};


//Create and populate or delete the database.
exports.dbOptions = function(req, res) {

    // Bound service check
    if (typeof db.cloudant == 'undefined')
        return res.send({msg:'Error: Cannot run dbOptions() without bound services'});

    var option = req.params.option.toLowerCase();
    if (option === 'create') {
        db.cloudant.db.create('records', function(err/*, body*/) {
            if (!err) {
                db.populateDB();
                res.send({msg:'Successfully created database and populated!'});
            } else {
                res.send({msg:err});
            }
        });
    } else if (option === 'delete') {
        db.cloudant.db.destroy('records', function(err/*, body*/) {
	        if (!err) {
	            res.send({msg:'Successfully deleted db records!'});
	        } else {
	        	res.send({msg:'Error deleting db records: ' + err});
        	}
        });
    } else {
    	res.send({msg: 'your option was not understood. Please use "create" or "delete"'});
	}
};

//Create a policy to add to the database.
exports.create = function(req, res) {

    // Bound service check
    if (typeof db.recordsDb == 'undefined')
        return res.send({msg:'Error: Cannot run create() w/o records DB'});

    db.recordsDb.insert(req.body, function(err/*, body, headers*/) {
        if (!err) {
            res.send({msg: 'Successfully created clinical record'});
        } else {
            res.send({msg: 'Error on insert, maybe the clinical record already exists: ' + err});
        }
    });
};

//find a policy by ID.
exports.find = function(req, res) {

    // Bound service check
    if (typeof db.recordsDb == 'undefined')
        return res.send({msg:'Error: Cannot run find() w/o records DB'});

    var id = req.params.id;
    if (USE_FASTCACHE) {
    	var idAsNumber = parseInt(id.substring(id.length - 2), 16);
    	if (!idAsNumber || idAsNumber % 3 === 2) {
        	res.status(500).send({msg: 'server error'});
    	} else {
    		res.status(200).send({msg: 'all good'});
    	}
        return;
    }
    db.recordsDb.get(id, { revs_info: false }, function(err, body) {
        if (!err) {
            res.send(body);
        } else {
            res.send({msg:'Error: could not find clinical record: ' + id});
        }
    });
};

//list all the database contents.
exports.list = function(req, res) {

    // Bound service check
    if (typeof db.recordsDb == 'undefined')
        return res.send({msg:'Error: Cannot run list() w/o records DB'});

    db.recordsDb.list({include_docs: true}, function(err, body/*, headers*/) {
	    if (!err) {
	        res.send(body);
	        return;
	    }
	   	res.send({msg:'Error listing records: ' + err});
    });
};

//update a policy using an ID.
exports.update = function(req, res) {

    // Bound service check
    if (typeof db.recordsDb == 'undefined')
        return res.send({msg:'Error: Cannot run update() w/o records DB'});

    var id = req.params.id;
    var data = req.body;
    db.recordsDb.get(id, {revs_info:true}, function(err, body) {
        if (!err) {
            data._rev = body._rev;
            db.recordsDb.insert(data, id, function(err/*, body, headers*/) {
	            if (!err) {
	                res.send({msg:'Successfully updated clinical record: ' + JSON.stringify(data)});
	            } else {
	            	res.send({msg:'Error inserting for update: ' + err});
	        	}
            });
        }
        else {
        	res.send({msg:'Error getting record for update: ' + err});
    	}
    });
};

//remove an record from the database using an ID.
exports.remove =  function(req, res) {

    // Bound service check
    if (typeof db.recordsDb == 'undefined')
        return res.send({msg:'Error: Cannot run remove() w/o records DB'});

    var id = req.params.id;
    db.recordsDb.get(id, { revs_info: true }, function(err, body) {
        if (!err) {
            console.log('Deleting clinical record: ' + id);
            db.recordsDb.destroy(id, body._rev, function(err/*, body*/) {
                if (!err) {
                    res.send({msg:'Successfully deleted clinical record'});
                } else {
                    res.send({msg:'Error in delete: ' + err});
                }
            });
        } else {
            res.send({msg:'Error getting records id: ' + err});
        }
    });
};

//calculate the fibonacci of 20.
var fib = function(n) {
    if (n < 2) {
        return 1;
    }
    return fib(n - 2) + fib(n - 1);
};
exports.fib = function(req, res) {
    res.send({msg:'Done with fibonacci of 20: ' + fib(20)});
};


exports.getFastCache = function() {
    return USE_FASTCACHE;
};
