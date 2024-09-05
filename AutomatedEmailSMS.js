function sendDailyAdhanReminders() {
  Logger.log("sendDailyAdhanReminders: Starting function.");
  var spreadsheetId = config.SPREADSHEET_ID;  // Load spreadsheet ID from config
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  // Get today's date in the correct format
  var today = new Date();
  today.setHours(0, 0, 0, 0); // Clear time part
  Logger.log("sendDailyAdhanReminders: Today's date is " + today);

  // Get the assignee for today from the "Adhan Tracking" sheet
  var adhanSheet = spreadsheet.getSheetByName("Adhan Tracking");
  var adhanData = adhanSheet.getDataRange().getValues();
  var assignee = null;

  Logger.log("sendDailyAdhanReminders: Searching for today's assignee.");
  for (var i = 1; i < adhanData.length; i++) {
    if (adhanData[i][0].getTime() === today.getTime()) {
      assignee = adhanData[i][1];
      break;
    }
  }

  if (!assignee) {
    Logger.log("sendDailyAdhanReminders: No assignee found for today.");
    return;
  }
  Logger.log("sendDailyAdhanReminders: Assignee found: " + assignee);

  // Get the email and phone number for the assignee from the "Contact Info" sheet
  var contactSheet = spreadsheet.getSheetByName("Contact Info");
  var contactData = contactSheet.getDataRange().getValues();
  var email = null;
  var phoneNumber = null;

  Logger.log("sendDailyAdhanReminders: Searching for assignee's email and phone number.");
  for (var j = 1; j < contactData.length; j++) {
    if (contactData[j][0] === assignee) {
      phoneNumber = contactData[j][1]; // Assuming phone number is in column B (index 1)
      email = contactData[j][2]; // Assuming email is in column C (index 2)
      break;
    }
  }

  if (!email || !phoneNumber) {
    Logger.log("sendDailyAdhanReminders: No email or phone number found for the assignee: " + assignee);
    return;
  }
  Logger.log("sendDailyAdhanReminders: Email and phone number found for assignee: " + email + ", " + phoneNumber);

  // Get the prayer times from the "Prayer Times" sheet
  var prayerSheet = spreadsheet.getSheetByName("Prayer Times");
  var prayerData = prayerSheet.getDataRange().getValues();

  Logger.log("sendDailyAdhanReminders: Processing prayer times.");
  var timeColumnIndex = config.TEST_MODE ? 2 : 1; // Use 3rd column (index 2) for testing, 2nd column (index 1) for production

  // Send an email and SMS for each prayer 30 minutes before the specified time (or 1 minute for testing)
  for (var k = 1; k < prayerData.length; k++) {
    var prayerName = prayerData[k][0];

    // Check if the time column is a Date object
    if (!(prayerData[k][timeColumnIndex] instanceof Date)) {
      Logger.log("sendDailyAdhanReminders: Invalid time format for prayer time at row " + (k + 1) + ". Value: " + prayerData[k][timeColumnIndex] + ". Skipping this prayer time.");
      continue;
    }

    var prayerTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), prayerData[k][timeColumnIndex].getHours(), prayerData[k][timeColumnIndex].getMinutes());
    var sendTime = new Date(prayerTime.getTime() - (config.TEST_MODE ? 1 : 30) * 60000); // 1 minute for testing, 30 minutes for production

    Logger.log("sendDailyAdhanReminders: Scheduling email and SMS for " + prayerName + " at " + sendTime);
    // Schedule the email and SMS
    if (sendTime > new Date()) {
      var triggerId = ScriptApp.newTrigger("sendPrayerEmail")
        .timeBased()
        .at(sendTime)
        .create()
        .getUniqueId();
      Logger.log("sendDailyAdhanReminders: Trigger created with ID: " + triggerId);
      // Store parameters in PropertiesService
      PropertiesService.getScriptProperties().setProperty(triggerId, JSON.stringify({
        email: email,
        phoneNumber: phoneNumber,
        prayerName: prayerName,
        prayerTime: formatTime(prayerData[k][timeColumnIndex])
      }));
    } else {
      Logger.log("sendDailyAdhanReminders: Send time for " + prayerName + " is in the past. Skipping this prayer time.");
    }
  }
  Logger.log("sendDailyAdhanReminders: Function completed.");
}

function sendPrayerEmail(e) {
  Logger.log("sendPrayerEmail: Starting function.");
  var triggerId = e.triggerUid;
  var properties = PropertiesService.getScriptProperties().getProperty(triggerId);
  if (properties) {
    Logger.log("sendPrayerEmail: Properties found for trigger ID: " + triggerId);
    var params = JSON.parse(properties);
    var email = params.email;
    var phoneNumber = params.phoneNumber;
    var prayerName = params.prayerName;
    var prayerTime = params.prayerTime;
    var ccEmails = config.CC_EMAILS; // Use config for CC emails
    var ccNumbers = config.CC_NUMBERS; // Use config for CC numbers

    // Empty arrays in test mode
    if (config.TEST_MODE) {
      ccEmails = [];
      ccNumbers = [];
    }

    var fromEmail = config.FROM_EMAIL;
    var subject = prayerName + " @ " + prayerTime;
    var recipientEmail = config.TEST_MODE ? config.TEST_PHONE : email;
    var recipientPhoneNumber = config.TEST_MODE ? config.TEST_PHONE : phoneNumber;
    recipientPhoneNumber = formatPhoneNumber(recipientPhoneNumber);

    // Continue sending the email and SMS as before
    Logger.log("sendPrayerEmail: Sending email to " + recipientEmail + " with subject: " + subject);

    try {
      GmailApp.sendEmail(recipientEmail, subject, "", {
        cc: ccEmails.join(","),
        from: fromEmail,
        name: "DAR Reminders"
      });
      Logger.log("sendPrayerEmail: Email sent successfully.");
      // Send SMS using Twilio
      var message = "DAR Reminders: " + prayerName + " @ " + prayerTime;
      var twilioUrl = "https://api.twilio.com/2010-04-01/Accounts/" + config.TWILIO_ACCOUNT_SID + "/Messages.json";
      var payload = {
        To: recipientPhoneNumber,
        From: config.TWILIO_FROM_PHONE,
        Body: message
      };
      var options = {
        method: "post",
        payload: payload,
        headers: {
          Authorization: "Basic " + Utilities.base64Encode(config.TWILIO_ACCOUNT_SID + ":" + config.TWILIO_AUTH_TOKEN)
        }
      };
      UrlFetchApp.fetch(twilioUrl, options);
      Logger.log("sendPrayerEmail: SMS sent successfully to " + recipientPhoneNumber);
      // Send SMS to ccNumbers
      for (var i = 0; i < ccNumbers.length; i++) {
        payload.To = formatPhoneNumber(ccNumbers[i]);
        UrlFetchApp.fetch(twilioUrl, options);
        Logger.log("sendPrayerEmail: SMS sent successfully to ccNumber: " + ccNumbers[i]);
      }
    } catch (error) {
      throw new Error("sendPrayerEmail: Error sending email or SMS: " + error.message);
    } finally {
      // Clean up the stored property after sending the email and SMS
      PropertiesService.getScriptProperties().deleteProperty(triggerId);
      Logger.log("sendPrayerEmail: Properties deleted for trigger ID: " + triggerId);
      // Delete the trigger itself
      var triggers = ScriptApp.getProjectTriggers();
      for (var i = 0; i < triggers.length; i++) {
        if (triggers[i].getUniqueId() === triggerId) {
          ScriptApp.deleteTrigger(triggers[i]);
          Logger.log("sendPrayerEmail: Trigger deleted with ID: " + triggerId);
          break;
        }
      }
    }
  } else {
    Logger.log("sendPrayerEmail: No properties found for trigger ID: " + triggerId);
  }
  Logger.log("sendPrayerEmail: Function completed.");
}

function formatTime(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "h:mma").replace(":00", "");
}

// format phone number for Twilio
function formatPhoneNumber(phoneNumber) {
  // Convert the phone number to a string if it is numeric
  var phoneNumberStr = phoneNumber.toString();

  // Ensure the phone number is in E.164 format
  var formattedNumber = phoneNumberStr.replace(/[^\d]/g, '');
  if (formattedNumber.length === 10) {
    formattedNumber = '+1' + formattedNumber; // Assuming US phone numbers
  } else if (formattedNumber.length > 10 && formattedNumber.charAt(0) !== '+') {
    formattedNumber = '+' + formattedNumber;
  }
  return formattedNumber;
}