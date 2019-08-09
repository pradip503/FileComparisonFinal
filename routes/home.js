var express = require('express');
var router = express.Router();

const fs = require('fs');
const pdf = require('pdf-parse');
const superagent = require('superagent');

const db = require('../config/database');

// open login view
router.get('/', (req, res) => {
    res.render('home/login', {
        layout: false
    });
});


// post login
router.post('/login', (req, res) => {

    var username = req.body.username;
    var password = req.body.password;
    var person = req.body.person;

    if (person == 'student') {
        var checkUser = "SELECT * FROM  student WHERE username = ?";
        db.query(checkUser, [username], (error, results) => {
            if (results.length > 0) {
                var studentsData = results[0];
                if (password == studentsData.password) {
                    req.session.username = username;
                    req.session.teacher = false;
                    req.session.student = true;
                    res.redirect('/assignments');
                } else {
                    res.render('home/login', {
                        layout: false,
                        error: 'Username or Password doesnot match!'
                    });
                }
            } else {
                res.render('home/login', {
                    layout: false,
                    error: 'Username or Password doesnot match!'
                });
            }
            if (error) throw error;
        });
    } else {
        var checkTeacher = "SELECT * FROM  teacher WHERE username = ?";
        db.query(checkTeacher, [username], (error, results) => {
            if (results.length > 0) {
                var studentsData = results[0];
                if (password == studentsData.password) {
                    req.session.username = username;
                    req.session.student = false;
                    req.session.teacher = true;
                    res.redirect('/teacher');
                } else {
                    res.render('home/login', {
                        layout: false,
                        error: 'Username or Password doesnot match!'
                    });
                }
            } else {
                res.render('home/login', {
                    layout: false,
                    error: 'Username or Password doesnot match!'
                });
            }
            if (error) throw error;
        });
    }


});

//load assignments view
router.get('/assignments', (req, res) => {

    var assignments = "SELECT * FROM assignment where author=?";

    db.query(assignments, [req.session.username], (error, results) => {

        res.render('home/assignments', {
            assignment: true,
            assignments: results
        });

        if (error) throw error;
    });
});

//loads processing view
router.get('/processing', (req, res) => {

    var loadUnprocessedDocs = "SELECT id,title FROM assignment WHERE processed_status = ?";
    db.query(loadUnprocessedDocs, [0], (error, results) => {

        res.render('home/processing', {
            process: true,
            unprocessed_assignments: results
        });

        if (error) throw error;
    });

});


//loads comaparison view
router.get('/compare', (req, res) => {
    var getProcessedDocuments = "SELECT id,title FROM assignment WHERE processed_status = ?";
    db.query(getProcessedDocuments, [1], (error, results) => {

        res.render('home/comparison', {
            compare: true,
            assignment_titles: results
        });
        if (error) throw error;

    });

});


//route to load upload assignment view
router.get('/upload', (req, res) => {
    res.render('home/assignment_upload', {
        upload: true
    });
});


//Route to upload files
router.post('/uploadAssignment', (req, res) => {

    var title = req.body.title;
    var author = req.session.username;

    if (title == '' || author == '' || title == undefined || author == undefined) {
        res.render('home/assignment_upload', {
            error: 'Please upload all fields !!'
        });
    } else {
        // check if file is uploaded
        if (req.files == null) {
            res.render('home/assignment_upload', {
                error: 'Please upload file!'
            });
        } else {

            let assignmentFile = req.files.assignment_file;

            if (assignmentFile == undefined) {

                res.render('home/assignment_upload', {
                    error: 'Please upload file!'
                });

            } else {

                let assignmentFileName = title + '.pdf';

                assignmentFile.mv('./public/uploads/assignments/' + assignmentFileName, (error) => {
                    if (error) {
                        return error;
                    }

                    //file is successfully uploaded
                    var insertAssignment = "INSERT INTO assignment(title, author) VALUES (?,?)";
                    db.query(insertAssignment, [title, author], (error, results) => {

                        req.flash('success_message', 'Assignment uploaded successfully!');
                        res.redirect('/assignments');

                        var currentAssignmentId = results.insertId;
                        // function that does all task after file is uploaded
                        postProcessing(currentAssignmentId, title);

                        if (error) throw error;
                    });

                });
            }
        }
    };

});

// process documents
router.get('/processDocument/:title/:id', (req, res) => {

    var documentName = req.params.title;
    var id = req.params.id;

    const documentPath = './public/uploads/assignments/' + documentName + '.pdf';

    var firstFileContent = readPDFFileContent(documentPath);

    firstFileContent
        .then(data => {
            var processedContent = data.text.trim().toLowerCase().replace(/\s/g, ' ');

            var writingFilePath = './public/uploads/processed_assignments/' + documentName;
            fs.writeFile(writingFilePath, processedContent, (err) => {
                if (err) {
                    req.flash('error_message', 'Unable to write processed file!');
                    res.redirect('/processing');
                };

                // update processed_status
                var updateProcessedStatus = "UPDATE assignment SET processed_status = ? WHERE id = ?";
                db.query(updateProcessedStatus, [1, id], (error, results) => {

                    req.flash('success_message', 'File is successfully processed and ready to compare!!');
                    res.redirect('/');

                    if (error) {
                        req.flash('error_message', 'File is processed and written but processed status is not updated!');
                        res.redirect('/processing');
                    }
                });

            });
        });

});

//routes that checks similarity between documents
router.post('/compareFiles', (req, res) => {

    if (req.body.first_file == -1 || req.body.second_file == -1 || req.body.first_file == undefined || req.body.second_file == undefined) {

        req.flash('error_message', 'Please upload both files to compare!!');
        res.redirect('/compare')

    } else {
        const firstFileName = req.body.first_file;
        const secondFileName = req.body.second_file;

        const firstFileId = req.body.firstFileId;
        const secondFileId = req.body.secondFileId;

        const path1 = './public/uploads/processed_assignments/' + firstFileName;
        const path2 = './public/uploads/processed_assignments/' + secondFileName;


        //read contents of text file
        readFirstFileContent(path1, path2, firstFileId, secondFileId, res);

    }
});


// Read txt file content
function readFirstFileContent(path1, path2, firstFileId, secondFileId, res) {
    fs.readFile(path1, 'utf8', function (err, data1) {
        var sendingObject = new Object();
        sendingObject.first_text = data1;

        //read second file
        fs.readFile(path2, 'utf8', function (err, data2) {
            sendingObject.second_text = data2;
            sendingObject.firstFileId = firstFileId;
            sendingObject.secondFileId = secondFileId;
            //hit api
            superagent
                .post('http://127.0.0.1:5000/compareDocs')
                .send(sendingObject) // sends a JSON post body
                .set('accept', 'application/json')
                .end((err, results) => {
                    // Calling the end function will send the request
                    if (err) throw err;
                    res.send(results.text);
                });

            if (err) throw err;
        });

        if (err) throw err;
    });
}



//route to accept document
router.get('/acceptDocument', (req, res) => {

    if (req.query.docId == '' || req.query.docId == undefined) {
        console.log('bad');
        res.render('home/comparison', {
            error: 'Id cannot be empty!'
        });
    } else {
        var updateStatus = "UPDATE assignment SET status = ?, message = ? WHERE id = ?";
        db.query(updateStatus, ['accepted', req.query.feedback, req.query.docId], (error, results) => {
            if (results.affectedRows == 1) {
                res.send('true');
            }
            if (error) throw error;
        });

    }
});


//route to reject document
router.get('/rejectDocument', (req, res) => {

    if (req.query.docId == '' || req.query.docId == undefined) {
        res.render('home/comparison', {
            error: 'Id cannot be empty!'
        });
    } else {
        var updateStatus = "UPDATE assignment SET status = ?, message=? WHERE id = ?";
        db.query(updateStatus, ['rejected', req.query.feedback, req.query.docId], (error, results) => {
            if (results.affectedRows == 1) {
                res.send('true');
            }
            if (error) throw error;
        });
    }
});

// download assignment on clicking download
router.get('/downloadAssignment/:filename', (req, res) => {
    var filename = req.params.filename + '.pdf';
    res.download('./public/uploads/assignments/' + filename, (error) => {
        if (error) throw error;
    });
});


// delete assignment
router.post('/deleteAssignment', (req, res) => {

    var assignmentId = req.body.assignmentId;
    var assignmentTitle = req.body.assignmentTitle;

    // remove file
    fs.unlink('./public/uploads/assignments/' + assignmentTitle + '.pdf', (error) => {
        if (error) throw error;
        // remove assingment info from db
        var deleteAssignment = "DELETE FROM assignment WHERE id = ?";
        db.query(deleteAssignment, [assignmentId], (error, results) => {
            if (error) throw error;

            var deleteAllAssignment = "DELETE FROM result WHERE user_id = ?";
            db.query(deleteAllAssignment, [assignmentId], (error, deleteAllResults) => {
                res.send(results);
                if (error) throw error;
            });
        });
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


// post processing after uploading the file
function postProcessing(currentAssignmentId, currenttitle) {
    var selectAllTitles = "SELECT author,title FROM  assignment WHERE processed_status=?";
    db.query(selectAllTitles, [1], (error, results) => {

        var allAssignmentsTitles = [];
        var allAssignmentsAuthors = [];
        results.forEach(eachData => {
            allAssignmentsAuthors.push(eachData.author);
            allAssignmentsTitles.push(eachData.title);
        });

        var assignmentsLength = allAssignmentsTitles.length;

        // process the current file
        const currentAssignmentPath = './public/uploads/assignments/' + currenttitle + '.pdf';
        var currentFileContent = readPDFFileContent(currentAssignmentPath);
        // promise to get data
        currentFileContent.then(currentfiledata => {
            var processedCurrentContent = currentfiledata.text.trim().toLowerCase().replace(/\s/g, ' ');

            //Stop words removal
            // var processedContent = remove_stopwords(processedCurrentContent);
            //Porter Stemmer Algorithm

            // writing file to processed assignment
            var currentFilewritingPath = './public/uploads/processed_assignments/' + currenttitle;
            fs.writeFile(currentFilewritingPath, processedCurrentContent, (err) => {
                if (err) {
                    console.log('Unable to write processed file!');
                };

            });

            // update processed_status
            var updateProcessedStatus = "UPDATE assignment SET processed_status = ? WHERE title = ?";
            db.query(updateProcessedStatus, [1, currenttitle], (error, results) => {

                if (error) {
                    console.log('error');
                }
            });

            // creating object to send to api
            var apiSendingObject = new Object();
            apiSendingObject.first_text = processedCurrentContent;

            // console.log(allAssignmentsTitles.length);
            var checkassignment = (i) => {
                return new Promise((resolve, reject) => {

                    let otherFilePath = './public/uploads/processed_assignments/' + allAssignmentsTitles[i];
                    fs.readFile(otherFilePath, 'utf8', function (err, otherFileData) {
                        apiSendingObject.second_text = otherFileData;


                        // hit api request
                        superagent
                            .post('http://127.0.0.1:5000/compareDocs')
                            .send(apiSendingObject) // sends a JSON post body
                            .set('accept', 'application/json')
                            .end((err, results) => {
                                // Calling the end function will send the request
                                var responseObj = JSON.parse(results.text);
                                // console.log(responseObj);

                                if (responseObj.hasOwnProperty('commonExpressions')) {
                                    var insertResult = "INSERT INTO result(user_id,username,title,doc1_similarity,doc1_difference,doc2_similarity,doc2_difference,similar_expressions,doc1,doc2) VALUES(?,?,?,?,?,?,?,?,?,?)";

                                    db.query(insertResult, [currentAssignmentId, allAssignmentsAuthors[i], allAssignmentsTitles[i], responseObj.firstDocSimilarity, 100 - responseObj.firstDocSimilarity, responseObj.secondDocSimilarity, 100 - responseObj.secondDocSimilarity, responseObj.commonExpressions.length, responseObj.doc1, responseObj.doc2], (error, resultInsertedStatus) => {
                                        if (error) {
                                            reject(new Error("Match found but error occured!"));
                                        };
                                        resolve("Matched found");

                                    });
                                } else {
                                    console.log('has no similar expressions!');
                                    reject(new Error("NO matches found"));
                                };

                            });

                    });
                });
            }

            for (var i = 0; i < assignmentsLength; i++) {
                checkassignment(i).then(function (result) {
                    console.log(result);
                }).catch((err) => {
                    console.log(err);
                })
            }

        });
        if (error) throw error;
    });
}


//read file using pdf-parser for sending content to backend
function readPDFFileContent(path) {

    let dataBuffer = fs.readFileSync(path);
    return pdf(dataBuffer);
}


module.exports = router;