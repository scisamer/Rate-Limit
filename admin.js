const { Context, session, Markup } = require('telegraf');
var fs = require("fs");
const request = require('request');

const db = require('./db');

async function admin(ctx, next) {
	if (!ctx.message) return next();
	var text = ctx.message.text;
	var uid = ctx.message.from.id;



	///get user admin
	var isadm = ctx.session.group == 'admin' || ctx.session.group == 'dev';

	if (isadm) {


		//command set
		if (text == '/addfile') {
			ctx.session.command = 'filetext';
			ctx.reply('ارسل الملف مع كتابة التوضيح');
		}

		// end command set
		else if (ctx.session.command == 'filetext') {

			if (ctx.update.message.document === undefined) return ctx.reply('يرجى ارسال ملف');
			if (ctx.update.message.caption === undefined) return ctx.reply('يجب كتابة النص التي يظهر على الملف');

			var file_name = ctx.update.message.document['file_name'];
			var file_type = ctx.update.message.document.mime_type;
			var file_id = ctx.update.message.document.file_id;

			if (file_type != 'application/json') return ctx.reply('نوع الملف غير مدعوم');

			var caption = ctx.update.message.caption;

			var url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${file_id}`;

			ctx.session.data = {};

			request(url, (err, respone, body) => {

				var jsonbody = JSON.parse(body);
				var file_path = jsonbody.result.file_path;

				var fileurl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file_path}`;

				request(fileurl, async (err, respone, body) => {

					fs.writeFileSync(`./rate_limits/${file_name}`, body, 'UTF-8');

					await db.years.insert({ name: caption, file: `./rate_limits/${file_name}` });


					ctx.session.command = null;

					ctx.reply(`
					تمت الاضافة
					ارسل /update للتحديث
					`);
				})


			});


		}


		else if (text == '/getusers') {
			var users = await db.users.find({});
			res = users.map(k => `@` + k.username)
			.filter(k => k != '@undefined');
			ctx.reply(res.join('\n'));
		}

		else if (text == '/snall') {
			ctx.session.command = 'sn';
			ctx.reply('ارسال رسالتك الآن');
		}

		//command apply

		else if (ctx.session.command == 'sn') {
			ctx.session.command = null;

			var users = await db.users.find({});
			var blocked = 0;

			for (var i in users) {
				await ctx.telegram.sendMessage(users[i].id, text).catch(err => {
					console.log(`user bloked`);
					blocked++;
				});
				
			}



			ctx.reply('تم ارسال رسالتك بنجاح ' + users.length-blocked);
			console.log(`blocked: ${blocked}| total ${users.length}`);
		}

		else next();

		// command apply
	} else next();


}




module.exports = admin;