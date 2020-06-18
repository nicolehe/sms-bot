var SIDEBAR_TITLE = "Design Your SMS Bot";
var ERROR_MSG =
	"Oops, something went wrong, please wait a few seconds and text again.";

var COMPLETED_FLOW_COLUMN = 1;
var QUESTIONS_ROW = 3;
var START_OF_DATA_ROW = 4;

var PHONE_NUMBER_RANGE_START = "D4:D";
var FIRST_QUESTION_RANGE = "G3";
var FIRST_QUESTION_COLUMN = 7;
var QUESTIONS_LABEL_ROW = 1;
var QUESTIONS_LABEL_NUM_ROWS = 2;
var CLEAR_QUESTIONS_RANGE = "G3:Z3";

var QUESTIONS_BACKGROUND_COLOR = "#dce2fc";
var COMPLETED_FLOW_BACKGROUND_COLOR = "#63DD47";

var WRAP_MESSAGES_BOOL = true;
var SHEET_NAME = null; // change this if you want it to use a specific sheet, otherwise it will pick the first one

/**
 * WEBHOOK CODE
 */

/**
 * Returns text to send via SMS when the Twilio webhook makes a GET request.
 * More info here: https://developers.google.com/apps-script/guides/web
 *
 * @param {object} e - event parameter that can contain information about any request parameters.
 * @return {TextObject} SMSToSend - the text to send via SMS to the person who texted.
 */

function doGet(e) {
	var spreadsheetID = e.parameter.spreadsheetID;
	var message = e.parameter.Body;
	var from = e.parameter.From;
	var messageID = e.parameter.MessageSid;
	var phoneNum = from.substring(1);

	try {
		var sheet = getSheet(spreadsheetID, SHEET_NAME);
		// check if the phone number already texted
		var rowNum = getPhoneNumberRow(sheet, phoneNum);
		var nextQuestion;

		// find out if they have written before and a flow that isnt complete. if so, continue in the column
		// if they don't, start a new row
		if (hasTextedBeforeAndHasIncompleteFlow(sheet, rowNum)) {
			saveResponse(sheet, rowNum, message);
			nextQuestion = getNextQuestion(sheet, rowNum);
		} else {
			startNewRow(sheet, phoneNum, message, messageID);
			nextQuestion = sheet
				.getRange(QUESTIONS_ROW, FIRST_QUESTION_COLUMN)
				.getValue();
		}
		var SMSToSend = ContentService.createTextOutput(nextQuestion).setMimeType(
			ContentService.MimeType.TEXT
		);
		return SMSToSend;
	} catch (err) {
		console.log(err);
		ContentService.createTextOutput(ERROR_MSG).setMimeType(
			ContentService.MimeType.TEXT
		);
	}
}

/**
 * Returns the Sheet class by spreadsheet ID, and sheet name if provided.
 * @param {*} spreadsheetID - spreadsheet ID.
 * @param {*} sheetName - the sheet name.
 */

function getSheet(spreadsheetID, sheetName) {
	try {
		var sheet;
		// if there isn't a sheet name, open the first sheet
		if (sheetName !== null) {
			sheet = SpreadsheetApp.openById(spreadsheetID).getSheetByName(sheetName);
		} else {
			sheet = SpreadsheetApp.openById(spreadsheetID).getSheets()[0];
		}
		return sheet;
	} catch (e) {
		console.log(e);
		return null;
	}
}

/**
 * Returns whether or not a phone number has texted before and hasn't completed the flow
 *
 * @param {string} sheet
 * @param {number} rowNum - the row to check.
 * @returns {boolean}
 */
function hasTextedBeforeAndHasIncompleteFlow(sheet, rowNum) {
	if (
		getNextEmptyColumnByRow(sheet, rowNum) <=
		getNextEmptyColumnByRow(sheet, QUESTIONS_ROW) - 1
	) {
		return true;
	} else return false;
}

/**
 * Saves text from an incoming SMS to the spreadsheet.
 *
 * @param {string} sheet
 * @param {number} rowNum - the row to add the text to.
 * @param {string} message - the text to save.
 */
function saveResponse(sheet, rowNum, message) {
	var currentResponseColumn = getNextEmptyColumnByRow(sheet, rowNum);

	// check if they completed flow
	if (
		currentResponseColumn ==
		getNextEmptyColumnByRow(sheet, QUESTIONS_ROW) - 2
	) {
		markAsCompleted(sheet, rowNum);
	}
	var range = sheet.getRange(rowNum, currentResponseColumn);
	range.setWrap(WRAP_MESSAGES_BOOL);
	range.setValue(message);
}

/**
 * Returns the next text to send to the person who texted.
 *
 * @param {string} sheet
 * @param {number} rowNum - the row number of the current request.
 * @returns {string} nextQuestion - the next text to send.
 */
function getNextQuestion(sheet, rowNum) {
	var nextQuestionColumn = getNextEmptyColumnByRow(sheet, rowNum);
	var nextQuestion = sheet
		.getRange(QUESTIONS_ROW, nextQuestionColumn)
		.getValue();
	return nextQuestion;
}

/**
 * Marks the row of the current request to be TRUE in the "Completed Flow?" column.
 *
 * @param {string} sheet
 * @param {number} rowNum - the row number of the current request.
 */
function markAsCompleted(sheet, rowNum) {
	sheet.getRange(rowNum, COMPLETED_FLOW_COLUMN).setValue(true);
	sheet
		.getRange(rowNum, COMPLETED_FLOW_COLUMN)
		.setBackgrounds([[COMPLETED_FLOW_BACKGROUND_COLOR]]);
}

/**
 * Returns the row of the current request by phone number only if
 * they have texted before and they have an incomplete flow.
 *
 * @param {string} sheet
 * @param {string} from - the phone number as a string.
 * @returns {*} the row if found, null if not.
 */
function getPhoneNumberRow(sheet, from) {
	var lastRow = sheet.getLastRow() + 1;
	var phoneNumberRange = PHONE_NUMBER_RANGE_START + lastRow;
	var phoneNumbers = sheet.getRange(phoneNumberRange).getValues();
	for (var row = 0; row < phoneNumbers.length; row++) {
		if (phoneNumbers[row][0] == from) {
			if (hasTextedBeforeAndHasIncompleteFlow(sheet, row + START_OF_DATA_ROW)) {
				return row + START_OF_DATA_ROW;
			} else {
				continue;
			}
		}
	}
	return null;
}

/**
 * Creates a new row in the spreadsheet.
 *
 * @param {string} sheet
 * @param {string} from - the phone number as a string.
 * @param {string} message - the text of the incoming SMS.
 * @param {string} messageID - the message SID from Twilio.
 */
function startNewRow(sheet, from, message, messageID) {
	var timestamp = new Date().toString();
	var isFirstTimer = checkIfFirstTimer(sheet, from);
	sheet.appendRow([false, messageID, timestamp, from, isFirstTimer, message]);
}

/**
 * Returns whether or not the phone number is a first time texter.
 *
 * @param {*} sheet  - the spreadsheet ID.
 * @param {string} from - the phone number as a string.
 * @returns {boolean} true if they are a first timer, false if not.
 */
function checkIfFirstTimer(sheet, from) {
	var lastRow = sheet.getLastRow() + 1;
	var phoneNumberRange = PHONE_NUMBER_RANGE_START + lastRow;
	var range = sheet.getRange(phoneNumberRange);
	var phoneNumbers = range.getValues();
	for (var row = 0; row < phoneNumbers.length; row++) {
		if (phoneNumbers[row][0] == from) {
			return false;
		} else {
			continue;
		}
	}
	return true;
}

/**
 * SIDEBAR CODE
 */

/**
 * Trigger that runs when the spreadsheet is installed by a user.
 * More info here: https://developers.google.com/apps-script/guides/triggers#oninstalle
 * @param {Event} e - the onInstall event.
 */
function onInstall(e) {
	onOpen(e);
}

/**
 * Trigger that runs when the spreadsheet is open by a user.
 * More info here: https://developers.google.com/apps-script/guides/triggers#onopene
 * @param {Event} e - the onOpen event.
 */
function onOpen(e) {
	SpreadsheetApp.getUi()
		.createAddonMenu()
		.addItem("Show sidebar", "showSidebar")
		.addToUi();
}

/**
 * Opens the sidebar.
 */
function showSidebar() {
	var ui = HtmlService.createTemplateFromFile("Sidebar")
		.evaluate()
		.setTitle(SIDEBAR_TITLE)
		.setSandboxMode(HtmlService.SandboxMode.IFRAME);
	SpreadsheetApp.getUi().showSidebar(ui);

	var documentProperties = PropertiesService.getDocumentProperties();
	var spreadsheetID = SpreadsheetApp.getActiveSpreadsheet().getId();
	documentProperties.setProperties({
		spreadsheet_id: spreadsheetID,
	});
}

/**
 * Returns a property from DocumentProperties.
 *
 * @param {string} property - the name of the property.
 */
function getProperty(property) {
	var documentProperties = PropertiesService.getDocumentProperties();
	return documentProperties.getProperty(property);
}

/**
 * Clears the cells in the questions range.
 */
function clearQuestions() {
	var sheet = SpreadsheetApp.getActiveSpreadsheet();
	PropertiesService.getDocumentProperties().setProperty("questions_num", 0);
	var range = sheet.getRange(CLEAR_QUESTIONS_RANGE);
	range.clear();
}

/**
 * Adds the questions from the sidebar to the sheet.
 * @param {Array} questions - the array of questions from SidebarJavaScript.html.
 */
function addQuestionsFromSidebarToSheet(questions) {
	var sheet = SpreadsheetApp.getActiveSheet();
	var oldQuestionsNum = parseInt(getProperty("questions_num"));

	clearQuestions();

	if (oldQuestionsNum) {
		var oldHeaderRange = sheet.getRange(
			QUESTIONS_LABEL_ROW,
			FIRST_QUESTION_COLUMN,
			QUESTIONS_LABEL_NUM_ROWS,
			oldQuestionsNum
		);
		oldHeaderRange.breakApart();
	}

	// only use non empty questions
	var filteredQuestions = questions.filter(function (q) {
		return q.length > 0;
	});
	for (var i = 0; i < filteredQuestions.length; i++) {
		// add to sheet
		var currentColumn = FIRST_QUESTION_COLUMN + i;
		var nextEmptyCell = sheet.getRange(QUESTIONS_ROW, currentColumn);
		nextEmptyCell.setValue(filteredQuestions[i]);
		nextEmptyCell.setWrap(true);
		nextEmptyCell.setVerticalAlignment("top");
		nextEmptyCell.setFontFamily("Source Sans Pro");
		nextEmptyCell.setBackground(QUESTIONS_BACKGROUND_COLOR);

		if (i == filteredQuestions.length - 1) {
			// merge the questions label cells to match the number of question cells

			sheet
				.getRange(
					QUESTIONS_LABEL_ROW,
					FIRST_QUESTION_COLUMN,
					QUESTIONS_LABEL_NUM_ROWS,
					filteredQuestions.length
				)
				.merge();
			// if there are fewer questions than before, reset the unmerged cell's backgrounds to white
			if (oldQuestionsNum > filteredQuestions.length) {
				var unmergedRange = sheet.getRange(
					QUESTIONS_LABEL_ROW,
					FIRST_QUESTION_COLUMN + filteredQuestions.length,
					QUESTIONS_LABEL_NUM_ROWS,
					oldQuestionsNum - filteredQuestions.length
				);
				unmergedRange.setBackground("white");
			}
		}

		// save num of questions
		PropertiesService.getDocumentProperties().setProperties({
			questions_num: filteredQuestions.length,
		});
	}
}

/**
 * Returns the next empty column in a given row.
 *
 * @param {string} sheet
 * @param {string} rowNum - row number of the current request.
 */
function getNextEmptyColumnByRow(sheet, rowNum) {
	if (rowNum == null) return;

	var v = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0],
		l = v.length,
		r = void 0;
	while (l > 0) {
		if (v[l] && v[l].toString().length > 0) {
			r = l + 2;
			break;
		} else {
			l--;
		}
	}
	return r || 1;
}

/**
 * Returns questions that already exist in the spreadsheet, if any.
 */
function findExistingQuestions() {
	var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
	var questionsNum = parseInt(getProperty("questions_num"));

	if (questionsNum == 0) {
		return null;
	} else {
		var questionsRange = sheet.getRange(
			QUESTIONS_ROW,
			FIRST_QUESTION_COLUMN,
			1,
			questionsNum
		);
		var questions = questionsRange.getValues()[0];
		return questions;
	}
}
