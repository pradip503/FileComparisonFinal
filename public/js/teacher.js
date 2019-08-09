function loadFullComparisonModal(doc1, doc2, doc1_similarity, doc2_similarity) {


    // $("#mypiechart").show();
    // initChart1(doc1_similarity);
    // initChart2(doc2_similarity);

    $("#editor1").html(`<p style="font-size: 16px;">${doc1}</p>`);
    $("#editor2").html(`<p style="font-size: 16px;" >${doc2}</p>`);
    $('.large.long.modal')
        .modal('show');
}

function lodalGiveFeedBackModel(id) {

    $('.mini.modal')
        .modal({
            onApprove: function () {
                var feedback = $('#feedback').val();

                if (feedback == '') {
                    feedback = 'Your document has been accepted!';
                }

                $.ajax({
                    type: 'get',
                    url: '/acceptDocument',
                    contentType: "application/json",
                    data: {
                        docId: id,
                        feedback: feedback
                    },
                    success: function (data) {
                        if (data == 'true') {
                            toastr.success('Document is accepted!');
                        }
                    },
                    error: function (error) {
                        toastr.error(error);
                    }
                });
            },
            onDeny: function () {
                var feedback = $('#feedback').val();

                if (feedback == '') {
                    feedback = 'Your document has been rejected!';
                }

                $.ajax({
                    type: 'get',
                    url: '/rejectDocument',
                    contentType: "application/json",
                    data: {
                        docId: id,
                        feedback: feedback
                    },
                    success: function (data) {
                        if (data == 'true') {
                            toastr.success('Document is rejected!');
                        }
                    },
                    error: function (error) {
                        toastr.error(error);
                    }
                });
            }

        }).modal('show');
}

// function initChart1(firstDocSimilarity) {
//     var chart = new CanvasJS.Chart("chartContainer1", {
//         animationEnabled: true,
//         title: {
//             text: "Similarity status of first document"
//         },
//         data: [{
//             type: "pie",
//             startAngle: 240,
//             yValueFormatString: '##0.00"%"',
//             indexLabel: "{label} {y}",
//             dataPoints: [{
//                     y: firstDocSimilarity,
//                     label: "Doc1 Similarity",
//                     exploded: true
//                 },
//                 {
//                     y: 100 - firstDocSimilarity,
//                     label: "Doc1 Genuineness"
//                 }
//             ]
//         }]
//     });
//     chart.render();
// }



// // initialze second chart
// function initChart2(secondDocSimilarity) {
//     var chart = new CanvasJS.Chart("chartContainer2", {
//         animationEnabled: true,
//         title: {
//             text: "Similarity status of second document"
//         },
//         data: [{
//             type: "pie",
//             startAngle: 240,
//             yValueFormatString: '##0.00"%"',
//             indexLabel: "{label} {y}",
//             dataPoints: [{
//                     y: secondDocSimilarity,
//                     label: "Doc2 Similarity",
//                     exploded: true
//                 },
//                 {
//                     y: 100 - secondDocSimilarity,
//                     label: "Doc2 Genuineness"
//                 }
//             ]
//         }]
//     });
//     chart.render();
// }


function displayMessage(message) {

    $('#messageContent').text(message);
    $('#messageModal')
        .modal('show');
}



function checkFileValidation() {
    var file = $('#assignment_file').val();
    var extension = file.replace(/^.*[\\\/]/, '').split('.')[1];
    if (extension == 'pdf') {
        return true;
    }
    $('#error_file').html('<span>Please upload a PDF file!!</span>')
    return false;
}