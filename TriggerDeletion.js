function deleteSendPrayerEmailTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendPrayerEmail') {
      ScriptApp.deleteTrigger(triggers[i]);
      Logger.log("Deleted trigger with ID: " + triggers[i].getUniqueId());
    }
  }
  Logger.log("All sendPrayerEmail triggers have been deleted.");
}
