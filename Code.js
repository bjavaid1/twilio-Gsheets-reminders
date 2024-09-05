function copyDataBasedOnDate() {
  var spreadsheetId = '1Qet4MThQl_EYFLd2NAiMTQUJT2wBHrmBuhGEFgJmM_o';  // DAR Adhan Tracking
  var sheetName = 'Adhan Tracking';

  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  var today = new Date();
  var dateColumn = 1;  // date field is in column A
  var assigneeCol = 2;  // assignee is in Column B
  var altCol = 3; // alternative is in Column C
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  for (var i = 0; i < values.length; i++) {
    var rowDate = new Date(values[i][dateColumn - 1]);
    
    // If the date matches today
    if (rowDate.toDateString() === today.toDateString()) {
      var assigneeCell = sheet.getRange(i + 1, assigneeCol);  // Get the cell in column B for the current row
      var cellValue = assigneeCell.getValue();
      assigneeCell.setValue(cellValue);  // Set the value to itself to "copy as values"

      // do the same for "alternative"
      var altCell = sheet.getRange(i + 1, altCol);  // Get the cell in column B for the current row
      var cellValue = altCell.getValue();
      altCell.setValue(cellValue);  // Set the value to itself to "copy as values"
    }
  }
}

// copies prayer times from column D (next schedule) to column B (actual schedule) for Fajr, Dhuhr, Asr, and Isha prayers
function updatePrayerTimes() {
  try {
    Logger.log("Starting updatePrayerTimes function.");

    var spreadsheetId = '1Qet4MThQl_EYFLd2NAiMTQUJT2wBHrmBuhGEFgJmM_o'; // DAR Adhan Tracking
    var sheetName = 'Prayer Times';
    var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);

    if (!sheet) {
      Logger.log("Sheet not found: " + sheetName);
      return;
    }

    // Define the rows and columns
    var prayerRows = [2, 3, 4, 6];
    var actualScheduleColumn = 2; // Column B
    var nextScheduleColumn = 4; // Column D

    // Loop through the defined prayer rows
    for (var i = 0; i < prayerRows.length; i++) {
      var row = prayerRows[i];
      var prayerName = sheet.getRange(row, 1).getValue(); // Column A

      Logger.log("Updating prayer time for: " + prayerName + " (Row: " + row + ")");

      // Get the next schedule time from column D
      var nextScheduleTime = sheet.getRange(row, nextScheduleColumn).getValue();

      if (nextScheduleTime instanceof Date) {
        // Copy the next schedule time to column B
        sheet.getRange(row, actualScheduleColumn).setValue(nextScheduleTime);
        Logger.log("Copied next schedule time (" + nextScheduleTime + ") to actual schedule for: " + prayerName);
      } else {
        Logger.log("Invalid time format for next schedule at row " + row + ": " + nextScheduleTime);
      }
    }

    Logger.log("updatePrayerTimes function completed successfully.");
  } catch (error) {
    Logger.log("Error in updatePrayerTimes function: " + error.message);
  }
}


/**
 * Returns today's sunset time for a given latitude, longitude, and timezone.
 * If latitude, longitude, or timezone is not provided, defaults to Detroit, Michigan.
 * @param {number} latitude The latitude of the location (default: 42.3314).
 * @param {number} longitude The longitude of the location (default: -83.0458).
 * @param {string} timezone The IANA timezone identifier (default: "America/Detroit").
 * @return {Date} The sunset time in local time as a Date object.
 * @customfunction
 */
function GET_SUNSET_TIME(latitude, longitude, timezone) {
  // Set default values for latitude, longitude, and timezone if not provided
  latitude = latitude || 42.3314; // Detroit, Michigan latitude
  longitude = longitude || -83.0458; // Detroit, Michigan longitude
  timezone = timezone || "America/Detroit"; // Detroit, Michigan timezone
  
  // Fetch the sunset time from the Sunrise-Sunset API
  var response = UrlFetchApp.fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`);
  var data = JSON.parse(response.getContentText());
  
  // Extract the sunset time in UTC
  var sunsetTimeUTC = new Date(data.results.sunset);
  
  // Convert the sunset time to the local time of the specified timezone
  var localSunsetTime = new Date(sunsetTimeUTC.toLocaleString('en-US', { timeZone: timezone }));
  Logger.log("Sunset Time: " + localSunsetTime)

  return localSunsetTime;
}



