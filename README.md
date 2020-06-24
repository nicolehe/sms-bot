# sms-bot.info

![sms bot gif](http://nicole.pizza/img/sms-bot-gif-fast.gif)

🤖 [sms-bot.info](https://sms-bot.info) is a how-to guide to making an SMS bot with Google Sheets and Twilio. You write the messages your bot will send in a Google sheet, which is also where people's responses are saved.

The project is built using [Google Apps Script](https://developers.google.com/apps-script). It creates:

1. [an SMS webhook for Twilio](https://www.twilio.com/docs/usage/webhooks/sms-webhooks)
2. [a Google spreadsheet sidebar add-on](https://developers.google.com/apps-script/guides/dialogs)

It's meant to be used with [this template spreadsheet](https://template.sms-bot.info/).

## Getting Started

The document at [sms-bot.info](https://sms-bot.info) gives detailed instructions on how to set up the project - it's written such that the user doesn't have to write code (though they do have to copy and paste some code). It's recommended that you follow the document even if you are a developer, though instead of copying and pasting the code you may want to clone this repo and use Google's [clasp](https://github.com/google/clasp/) to develop locally.

### Prerequisites

To use `clasp` to develop locally, first download it:

```
npm install -g @google/clasp
```

And then enable the Google Apps Script API: https://script.google.com/home/usersettings

Make a copy of [this template spreadsheet](https://template.sms-bot.info/).

### Installing

Clone this repo and `cd into the folder:

```
git clone git@github.com:nicolehe/sms-bot.git
cd sms-bot
```

Login to `clasp`:

```
clasp login
```

Then create a project called "sms-bot" (or whatever you want):

```
clasp create sms-bot
```

Select "sheets" when it asks which script.

Push this code into your new Apps Script project, then open it in your browser.

```
clasp push
clasp open
```

## Web app deployment

To get your web app URL, it's recommended that you deploy from the browser the first time at least. Follow ([the relevant instructions in sms-bot.info](https://docs.google.com/document/d/1VzUsLofQVlP68wWKzUAmFO701I14hZpBZLIml1aWs7E/edit#heading=h.x7g7tmb7vkxi))

After that you can deploy with `clasp` from your command line - make sure you use the deployment ID.

```
clasp deploy -i <id>
```

## Testing your add-on

You do still have to manually run the add-on as a test from the project page if you change any of the sidebar code. Follow [the relevant instructions in sms-bot.info](https://docs.google.com/document/d/1VzUsLofQVlP68wWKzUAmFO701I14hZpBZLIml1aWs7E/edit#heading=h.8k9s04pxtbfv).

## Notes

- Because this code was written to make it as easy as possible for people to copy and paste, [Sidebar.html](Sidebar.html) contains the HTML, CSS and JavaScript all in one file. You may prefer separating them and inserting them into the HTML.
- There seems to be a bug with the V8 engine ([see this note](https://docs.google.com/document/d/1VzUsLofQVlP68wWKzUAmFO701I14hZpBZLIml1aWs7E/edit#bookmark=id.dnxbutwo4rsg)), so even though Apps Script does support ES6/TypeScript these days, the user has to deactivate V8 in order to share the add-on, which is why this code is all written in ES5.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

- Irene Alvarado, Kelsie Van Deman, Amit Pitaru for help and guidance
- Hana Tanimura for design
