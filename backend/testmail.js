require('dotenv').config();
const nodemailer = require("nodemailer");
const smtp = nodemailer.createTransport({
	host: 'rzak.pl',
	port: 25,
	auth: {
		user: 'no-reply@rzak.pl',
		pass: process.env.EMAIL_PASS
	},
	dkim:{
		domainName: "rzak.pl",
		keySelector: "6660249100.internal",
		privateKey: process.env.DKIM
	}
});
smtp.sendMail({
	from: 'no-reply@rzak.pl',
	to: 'rzakeu@gmail.com',
	subject: 'F1 Telemetry - Wiadomość testowa',
	html: "<h1>Pomyślnie dostarczona wiadomość!</h1>"
}).then((r) => {
	console.log(r);
}).catch((er) => {
	console.log("Wystapil blad!");
	console.log(er);
});