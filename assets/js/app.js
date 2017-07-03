/*jslint esversion: 6, browser: true*/
/*global window, console, $, jQuery, firebase, alert*/

// Create a variable to reference the database.
let db = firebase.database();

// Set elements as jQuery objects
const $tableBody = $('tbody');
const $trainName = $('#train-name');
const $trainDest = $('#train-dest');
const $trainHr = $('#train-hr');
const $trainMin = $('#train-min');
const $trainAm = $('#train-am');
const $trainPm = $('#train-pm');
const $freqHrs = $('#freq-hrs');
const $freqMins = $('#freq-mins');
const $trainAddBtn = $('#train-add-btn');
const $trainSaveBtn = $('#train-save-btn');
const $trainCancelBtn = $('#train-cancel-btn');

const editImg = "assets/img/edit.svg";
const delImg = "assets/img/trash.svg";

// Declare variables to hold input values
let trainName = "";
let trainDest = "";
let trainHr = 0;
let trainMin = 0;
let trainPer = 0;
let freqHrs = 0;
let freqMins = 0;

// Declare variables for input field defaults
let trainHrDef = "6";
let trainMinDef = "0";
let freqHrsDef = "1";
let freqMinsDef = "0";

// Declare variable to hold whether or not Save button is hidden
let isSaveBtn = false;

// Submit button click event to get and push user input to firebase database
$trainAddBtn.on('click', function (e) {
  e.preventDefault();
  // Call function to return user input as an object and merge with timestamp
  let trainObj = Object.assign(getFormInput(), {
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
  // Push user input for train into database
  db.ref().push(trainObj);
  // Call function to reset form passing display styles for buttons
  resetForm('inline-block', 'none');
});

$trainSaveBtn.on('click', function (e) {
  e.preventDefault();
  // Retrieve key from data attribute
  let key = $(this).attr('data-key');
  // Call function to return user input as an object
  let trainObj = getFormInput();
  // Update user input for edited train into database
  db.ref().child(key).update(trainObj);
  // Call function to reset form passing display styles for buttons
  resetForm('inline-block', 'none');
});

// Cancel button click event to clear and reset form
$trainCancelBtn.on('click', function () {
  // Call function to reset form passing display styles for buttons
  resetForm('inline-block', 'none');
});

// Delete button click event to remove node from firebase and remove element from table
$tableBody.on('click', '.delete', function () {
  // Below function call is made if Save button is NOT hidden
  if (isSaveBtn) {
    // Call function to reset form passing display styles for buttons
    resetForm('inline-block', 'none');
  }
  // Call function to get table row ID that equals node key
  let key = nodeKey($(this));
  // // Query firebase database using key value and remove node
  db.ref().child(key).remove();
  $(`#${key}`).remove();
});

// Edit button click event to load node data back into form for editing
$tableBody.on('click', '.edit', function () {
  // Call function to reset form passing display styles for buttons
  resetForm('none', 'inline-block');
  // Call function to get table row ID that equals node key
  let key = nodeKey($(this));
  // Store key as data attribute on Save button
  $trainSaveBtn.attr('data-key', key);
  // Query firebase database using key value and population form with results
  db.ref().child(key).once('value').then(function (snapshot) {
    let data = snapshot.val();
    $trainName.val(data.trainName);
    $trainDest.val(data.trainDest);
    $trainHr.val(data.trainHr);
    $trainMin.val(data.trainMin);
    $trainAm.prop('checked', data.trainPer === 1 ? true: false);
    $trainPm.prop('checked', data.trainPer === 2 ? true: false);
    $freqHrs.val(data.freqHrs);
    $freqMins.val(data.freqMins);
  });
});

// Event to retrieve firebase train data to populate table
db.ref().orderByChild('timestamp').on('child_added', function (snapshot) {
  // Call create function
  buildHtml(snapshot, 'create');
// Error handler
}, function (errorObj) {
  console.log("Error handled: " + errorObj.code);
});

// Event to update firebase train node and table data
db.ref().on('child_changed', function (snapshot) {
  // Call update function
  buildHtml(snapshot, 'update');
// Error handler
}, function (errorObj) {
  console.log("Error handled: " + errorObj.code);
});

// Function to get values from the input fields and return as an object
let getFormInput = function () {
  // This needs to be assigned in the click event or the default value will get stored
  let $trainPer = $('[name="train-per"]:checked');
  trainName = $trainName.val().trim();
  trainDest = $trainDest.val().trim();
  trainHr = parseInt($trainHr.val());
  trainMin = parseInt($trainMin.val());
  trainPer = parseInt($trainPer.val());
  freqHrs = parseInt($freqHrs.val());
  freqMins = parseInt($freqMins.val());
  
  let trainObj = {
    trainName: trainName,
    trainDest: trainDest,
    trainHr: trainHr,
    trainMin: trainMin,
    trainPer: trainPer,
    freqHrs: freqHrs,
    freqMins: freqMins,
  };
  return trainObj;
};

// Function to build and append table row or table data with firebase train data
let buildHtml = function (snapshot, type) {
  let key = snapshot.key;
  let data = snapshot.val();
  let html;
  // Build out table data
  let tableData = 
     `<td>${data.trainName}</td>
      <td>${data.trainDest}</td>
      <td>${data.freqHrs} hrs ${data.freqMins} mins</td>
      <td>6:00 PM</td>
      <td>0 hr 30 min</td>
      <td>
        <img class="edit" src="${editImg}" alt="">
        <img class="delete" src="${delImg}" alt="">
      </td>`;
  // If train data is new, add new table row
  if (type === 'create') {
    html = 
     `<tr id="${key}">
        ${tableData}
      </tr>`;
    $tableBody.append(html);
  // Else update existing train data in table
  } else {
    html = tableData;
    $tableBody.find(`#${key}`)
      .empty()
      .append(html);
  }
};

// Function to return key assigned to table row element
let nodeKey = function (obj) {
  return obj.parents('tr').attr('id');
};

// Function to clear or set to default the form's input fields
let resetForm = function (add, save) {
  // Reset input fields
  $trainName.val("");
  $trainDest.val("");
  $trainHr.val(trainHrDef);
  $trainMin.val(trainMinDef);
  $trainAm.prop('checked', true);
  $trainPm.prop('checked', false);
  $freqHrs.val(freqHrsDef);
  $freqMins.val(freqMinsDef);
  
  // Reset form buttons
  $trainAddBtn.css('display', add);
  $trainSaveBtn
    .css('display', save)
    .attr('data-key', '');
  
  // If Add button display is none, Save button state is true
  isSaveBtn = (add === 'none' ? true : false);
};

