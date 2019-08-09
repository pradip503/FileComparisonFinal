// file upload setting

$("#file1-progress").progress({
  percent: 50
});

$("#file2-progress").progress({
  percent: 90
});

$("input:text").click(function () {
  $(this)
    .parent()
    .find("input:file")
    .click();
});

$("input:file", ".ui.action.input").on("change", function (e) {
  var name = e.target.files[0].name;
  $("input:text", $(e.target).parent()).val(name);
});

// close error message on pressing close icon
$(".message .close").on("click", function () {
  $(this)
    .closest(".message")
    .transition("fade");
});

// initialize first chart

function initChart1(firstDocSimilarity) {
  var chart = new CanvasJS.Chart("chartContainer1", {
    animationEnabled: true,
    title: {
      text: "Similarity status of first document"
    },
    data: [{
      type: "pie",
      startAngle: 240,
      yValueFormatString: '##0.00"%"',
      indexLabel: "{label} {y}",
      dataPoints: [{
          y: firstDocSimilarity,
          label: "Doc1 Similarity",
          exploded: true
        },
        {
          y: 100 - firstDocSimilarity,
          label: "Doc1 Genuineness"
        }
      ]
    }]
  });
  chart.render();
}

// initialze second chart
function initChart2(secondDocSimilarity) {
  var chart = new CanvasJS.Chart("chartContainer2", {
    animationEnabled: true,
    title: {
      text: "Similarity status of second document"
    },
    data: [{
      type: "pie",
      startAngle: 240,
      yValueFormatString: '##0.00"%"',
      indexLabel: "{label} {y}",
      dataPoints: [{
          y: secondDocSimilarity,
          label: "Doc2 Similarity",
          exploded: true
        },
        {
          y: 100 - secondDocSimilarity,
          label: "Doc2 Genuineness"
        }
      ]
    }]
  });
  chart.render();
}

// ajax requests
//ajax request to compare documents
function compareDocuments() {
  $("#loader").addClass("active");

  var firstFilenameAndId = document.getElementById("first_file").value.split('.');
  var secondFilenameAndId = document.getElementById("second_file").value.split('.');

  var first_file = firstFilenameAndId[0];
  var second_file = secondFilenameAndId[0];
  var firstFileId = firstFilenameAndId[1];
  var secondFileId = secondFilenameAndId[1];


  if (first_file == -1 || second_file == -1) {
    //remove loader
    $("#loader").removeClass("active");
    alert('Please upload both files!!');

  } else {
    $.ajax({
      type: "POST", //rest Type
      url: "/compareFiles",
      data: {
        first_file,
        second_file,
        firstFileId,
        secondFileId
      },
      success: function (response) {
        // loads pychart for result dv
        $("#resultDiv").show();
        //remove loader
        $("#loader").removeClass("active");

        //converts response into json format
        var responseObject = JSON.parse(response);

        // check if responseObject is Empty
        if (Object.keys(responseObject).length === 0) {
          $("#viewFullComparisonButton").hide();
          $(".hideresults").hide();
          $("#errordiv").show();
          $("#errordiv").html(
            '<h3 class="m-3" style="color: green"> Two files have no similar expressions! </h3>'
          );
        } else {

          $("#errordiv").hide();
          $(".hideresults").show();

          initChart1(responseObject.firstDocSimilarity);
          initChart2(responseObject.secondDocSimilarity);

          document.getElementById("doc1SimilarExpression").innerHTML =
            '<h3 class="text-center m-3" >Number of similar expressions: <strong>' +
            responseObject.commonExpressions.length +
            "</strong></h3>";

          $('#viewFullComparisonButton').html(
            '<hr><center><button class="ui huge button orange mb-2" onclick="loadFullComaparisonModal()"> View Full Comparison </button></center>'
          );
          $("#viewFullComparisonButton").show();

          $("#editor1").html(`<p>${responseObject.doc1}</p>`);
          $("#editor2").html(`<p>${responseObject.doc2}</p>`);
        }


      },
      error: function (error) {

        $("#viewFullComparisonButton").hide();
        $(".hideresults").hide();
        $("#loader").removeClass("active");
        $("#errordiv").html(
          '<h3 class="m-3" style="color: red"> Something went wrong! Please try later!</h3>'
        );
      }
    });
  }
}

// ajax request to accept assignment
function acceptAssignment(id) {
  $("#loader").addClass("active");

  let assignmentId = id;

  $.ajax({
    type: 'GET',
    url: '/acceptDocument',
    contentType: "application/json",
    data: {
      docId: assignmentId
    },
    success: function (data) {
      $("#loader").removeClass("active");
      if (data == 'true') {
        toastr.success('Document is accepted!');
      }
    },
    error: function (error) {
      $("#loader").removeClass("active");
      toastr.error(error);
    }
  });

}


// ajax to reject assignment
function rejectAssignment(id) {
  $("#loader").addClass("active");

  var assignmentId = id;

  $.ajax({
    type: 'GET',
    url: '/rejectDocument',
    contentType: "application/json",
    data: {
      docId: assignmentId
    },
    success: function (data) {
      $("#loader").removeClass("active");
      toastr.warning('Document is rejected!')

    },
    error: function (error) {
      $("#loader").removeClass("active");
      toastr.error(error);
    }
  });

}


// ajax request to delete assignment
function deleteAssignment(id, title) {
  $("#loader").addClass("active");

  $.ajax({
    type: 'POST',
    url: '/deleteAssignment',
    data: {
      assignmentId: id,
      assignmentTitle: title
    },
    success: function (data) {
      $("#loader").removeClass("active");
      if (data.affectedRows > 0) {
        toastr.success('Assignments and results deleted successfully! Refresh page to see the changes!')
      } else {
        toastr.warning('Something went wrong!')
      }

    },
    error: function (error) {
      $("#loader").removeClass("active");
      toastr.error('An error ocurred while delteing!');
    }
  });

}


// loads confirm delete modal
function confirmDelete(id, title) {

  $('.mini.modal')
    .modal({
      onApprove: function () {
        deleteAssignment(id, title);
      }
    })
    .modal('show');
}


// load full comparison modal
function loadFullComaparisonModal() {
  $('.large.long.modal')
    .modal('show');
}


// close modal
function closeModal() {
  $('.large.long.modal')
    .modal('hide');
}