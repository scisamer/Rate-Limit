const { Context, session, Telegraf, Markup } = require('telegraf');
const fs = require("fs");
const crypto = require('crypto');
const db = require('./db');
const ar = require('./arabic');

const a2e = s => s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))

var data = [

];
updateData();


async function base(ctx, next) {
	//ctx.reply('ok');

	if (!ctx.message) return next();
	var text = ctx.message.text;
	var uid = ctx.message.from.id;
	var isadm = ctx.session.group == 'admin' || ctx.session.group == 'dev';

	// base command
	if (text == "/start") {
		var buns = data.map(key => key.name);
		ctx.reply(`قبولات العام الدراسي`, Markup
			.keyboard(buns)
			.oneTime()
			.resize()
		);

	}
	else if (text == '/help') {
		ctx.reply(`
		اضغط هنا للاطلاع على التعليمات داخل الـــبوت
		https://t.me/sndcen
		`)
	}
	else if (data.find(key => key.name == text)) {
		ctx.session.year = text;
		ctx.reply(`اختر الفرع`, Markup
			.keyboard([
				[ar.bo, ar.ad, ar.ap],
				[ar.s_all]
			])
			.oneTime()
			.resize()
		);

	}
	// else if (text == ar.bo || text == ar.ap || text == ar.ad || text == ar.s_all) {
	// 	ctx.session.dep = text;
	// 	ctx.reply(`هل تريد فلترة الكليات حسب نوع الجنس؟`, Markup
	// 		.keyboard([
	// 			[ar.m, ar.a, ar.f],
	// 			[ar.o]
	// 		])
	// 		.oneTime()
	// 		.resize()
	// 	);

	// }
	// else if (text == ar.m || text == ar.f || text == ar.a || text == ar.o) {
	else if (text == ar.bo || text == ar.ap || text == ar.ad || text == ar.s_all) {
		ctx.session.dep = text;
		ctx.session.command = 'rate'

		ctx.reply(`ارسل المعدل  (ادخل ارقام فقط)`);
	}

	//what the command?

	else if (ctx.session.command == 'rate') {

		text = a2e(text + "");

		if (!isNaN(text)) {

			text = +(text);

			if (text >= 50 && text <= 110) var filter = { rate: text };

			else return ctx.reply(`عذراً، لقد ادخل قيمة غير صالحة`);

			// sex
			// if (ctx.session.sex == ar.m) filter.sex = 'ذكر';
			// else if (ctx.session.sex == ar.f) filter.sex = 'انثى';
			// else if (ctx.session.sex == ar.a) filter.sex = 'مختلط';
			filter.sex = undefined;

			//set depment
			if (ctx.session.dep == ar.bo) filter.dep = 'احيائي';
			else if (ctx.session.dep == ar.ap) filter.dep = 'تطبيقي';
			else if (ctx.session.dep == ar.ad) filter.dep = 'ادبي';
			else if (ctx.session.dep == ar.s_all) filter.dep = undefined;
			else return ctx.reply(`اضغط  /start  للبدأ من جديد`);

			if (ctx.session.year === undefined) return ctx.reply(`اضغط  /start  للبدأ من جديد`);

			var ob = data.find(key => key.name == ctx.session.year);

			var results = require(ob.file);

			//console.log(filter);

			var res = results.filter(key => {
				var check;
				if (filter.rate !== undefined) check = (key.rate <= filter.rate);
				else check = (key.total <= filter.total);


				if (filter.sex) check = check && key.sex == filter.sex;
				if (filter.dep) check = check && key.sect == filter.dep;

				return check;
			});

			res.sort((a, b) => b.rate - a.rate);

			if (res.length == 0) return ctx.reply(`لا يوجد نتائج`);


			//var filename = './temp/' + crypto.randomBytes(4).readUInt32LE(0) + '.html';

			// fs.writeFileSync(filename, createTable(res), 'UTF-8');

			var p = `<h1>${ob.name}</h1><br><span>قائمة الكليات القريبة من المعدل <span style='font-weight: bold;'>${filter.rate}</span> في جميع المحافظات</span><br><br>`;


			ctx.reply('انقر على الملف لفتحه');
			await ctx.replyWithDocument({
				source: (Buffer.from(createTable(res, p, ob.name), 'utf8')),
				caption: `الكليات القريبة من معدلك`,
				filename: `rate_${filter.rate || filter.total}.html`
			});

			// fs.unlinkSync(filename);



		} else ctx.reply(`الرجاء ادخل قيمة رقمية وليس احرف`);
	}

	else if (text == '/update' && ctx.session.group == 'dev') {
		updateData();
		ctx.reply('تم تحديث الملفات');

	}

	else {
		var mess_id = ctx.update.message.message_id;
		var id = ctx.update.message.from.id;

		ctx.telegram.forwardMessage(-1001628897953, id, mess_id).then(function() {
			console.log("mesage forwaded");
		});
	}


	return next();
}


function createTable(lst, p, title) {

	var tr = '';
	for (var i in lst) {
		var key = lst[i];
		var total = '';

		tr += '<tr>';
		tr += `
		<td>${key.co}</td>
		`
		if (key.total) {
			tr += `
		<td>${key.total}</td>`;
			total = '<th>الحد الادنى</th>';
		}


		tr +=
			`
		<td>${key.rate}</td>
		<td>${key.diff}</td>
		<td>${key.sect}</td>
		<td>${key.sex}</td>
		</tr>`
	}

	var html = `<html dir="rtl" lang="ar">
	<head>
	<meta charset="UTF-8">
	<title>${title}</title>
	<style>
html {
  font-family: sans-serif;
  padding: 20px;
}
a {
	color: black;
}

table {
  border-collapse: collapse;
  border: 2px solid rgb(171 170 233);
  letter-spacing: 1px;
  font-size: 1rem;
  text-align: rigth;
}

td, th {
  border: 1px solid rgb(171 170 233);
  padding: 10px 20px;
  font-weight: bold;
}

th {
  background-color: rgb(235,235,235);
}

td {
  text-align: right;
}


tr:nth-child(even) td {
  background-color: rgb(250,250,250);
}

tr:nth-child(odd) td {
  background-color: rgb(245,245,245);
}

caption {
  padding: 10px;
}
  
</style>
 </head>
 <body>
 ${p}
 <table style="width:100%">
  <tr style="text-align: center;">
    <th>اسم الكليـــــة</th> 
    ${total}
    <th>المعدل</th>
	<th>المفاضلة</th>
    <th>الفرع</th>
	<th>الجنس</th>
  </tr>${tr}
 
</table>
<br>
<span style="
    background-color: #ffebe6;
">
بوت القبول المركز هي خدمة مجانية ومميزة مقدمة الى طلاب العراق لتسهيل عملية البحث عن الكلية
</span>
<br><br>
<span style="
    background-color: #ccffdd;
">
    <a href="https://t.me/centrlabot">اضغط هنا</a> لفتح الـــبوت
</span>
<br><br>
<div style="
    background-color: #cde1e1;
    
    direction: ltr;
">
<span style="">Email: samerchsci@gmail.com</span><br>
    
    <span style="">©2021 samer jassim. All Rights Reserved.</span>
	</div>
</body></html>`;

	return html;

}

async function updateData() {
	return data = await db.years.find({});
}
module.exports = base;