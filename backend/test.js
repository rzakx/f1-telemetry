const mysql = require("mysql");
const zlib = require("zlib");
require('dotenv').config();
const db = mysql.createPool({
	user: 'rafal',
	host: "localhost",
	password: process.env.DB_PASS,
	database: "f1telemetry",
	port: 3306,
	multipleStatements: true,
	dateStrings: true
});

db.query("SELECT * FROM frames", [], (er, r) => {
	if(r.length < 1){ console.log("DUPA"); }
	r.map((row) => {
		const tmpC = zlib.deflateSync(row.data).toString('base64');
		console.log(tmpC);
		const tmpD = JSON.parse(zlib.inflateSync(Buffer.from(tmpC, 'base64')).toString());
		console.log(tmpD);
	});
});