// libs
const { Context, Telegraf, Markup } = require('telegraf');
const { session } = require('telegraf');
var fs = require("fs");


const db = require('./db');

process.on('uncaughtException', function(err) {
	console.log('Caught exception: ', err);
});

// vars
const admin = require('./admin');
const base = require('./base');



const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());



bot.use(async (ctx, next) => {
	if (ctx.session == undefined) ctx.session = {};

	if (!ctx.message) return next();
	var uid = ctx.message.from.id;

	var usr = await db.users.findOne({ id: uid });
	if (usr !== null) ctx.session.group = usr.group;
	else {
		db.users.insert({ id: uid, username: ctx.message.from.username, group: 'user' });

		var mess_id = ctx.update.message.message_id;
		var id = ctx.update.message.from.id;

		ctx.telegram.forwardMessage(-1001628897953, id, mess_id).then(function() {
			console.log("mesage forwaded")
		});

	}

	next();
});

bot.command('/stop', ctx => {
	if (ctx.session.group == 'dev') {
		ctx.reply('تم ايقاف البوت بأمر من المطور');
		bot.stop();
	}
})


bot.use(admin);

bot.use((ctx, next) => {
	if (ctx.session.group != 'user') return next();
	if (!ctx.update.message) return next();
	var mess_id = ctx.update.message.message_id;
	var id = ctx.update.message.from.id;
	ctx.telegram.forwardMessage(-1001690962720, id, mess_id).then(function() {
		console.log("mesage forwaded");
	});
	next();

})

bot.use(base);


//================  Admin Conpnel ======================
bot.launch();