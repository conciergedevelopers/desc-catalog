/*eslint-env node */
try {
    var cloudant = require('cloudant')({
      url: cloudantService.credentials.url,
      plugin: 'retry',
      retryAttempts: 10,
      retryTimeout: 500s
    });\
    exports.cloudant = cloudant;
    var recordsDb = cloudant.use('records');
    exports.recordsDb = recordsDb;
}
catch (e) {
    console.error("Error initializing services for /db: ", e);
}

//populate the db with these policies.
var populateDB = function() {

    var records = require('./starter_docs/records.json');

    for (var p in records){
        recordsDb.insert(records[p], function(err/*, body, header*/) {
            if (err){
                console.log('error in populating the DB clinical records: ' + err );
            }
        });
    }
};
exports.populateDB = populateDB;

//Initiate the database.
var initDB = function() {

    // Bound service check
    if (typeof cloudant == 'undefined')
        return res.send({msg:'Error: Cannot run initDB() w/o Cloudant service'});

    cloudant.db.create('records', function(err/*, body*/) {
	    if (!err) {
	        populateDB();
	        console.log('Successfully created database and populated!');
	    } else {
	        console.log("Database already exists.");
	    }
    });
};
exports.initDB = initDB;
