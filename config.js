var config = Object.freeze({
    TEST_MODE: false, // Set to true for testing, false for production
    TWILIO_ACCOUNT_SID: '',
    TWILIO_AUTH_TOKEN: '',
    TWILIO_FROM_PHONE: '', // your twilio account phone number
    TEST_PHONE: '', // phone number used to test incoming SMS
    SPREADSHEET_ID: '', // google sheet document ID
    CC_EMAILS: [''], // additional fixed emails to senda automated emails
    CC_NUMBERS: [''], // additional fixed numbers to send automated SMS
    FROM_EMAIL: '', // the email address to send automated emails from; must exist as an alias in your google account
)};

