import { parseCarDamage, parseCarStatus, parseLap, parseMotion, parseParticipants, parseSession, parseTelemetry } from "./structure";
import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { deflateRawSync, inflateRawSync } from "zlib";
import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import os from "os";
import { unlink } from "fs/promises";
import multer from "multer";
import path from "path";
const portHTTP = Number(process.env.PORT_HTTP) || 20778;
const portUDP: number = Number(process.env.PORT_UDP) || 20777;
const networkIP = os.networkInterfaces().eth0![0].address || null;
// compression ?

const register_available = true;
const db: mysql.Pool = mysql.createPool({
	host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    multipleStatements: true,
    dateStrings: true,
    decimalNumbers: true,
    // charset: 'utf8mb4_general_ci'
});

const expressApp = express();
const serverHTTP = createServer(expressApp);
const io = new Server(serverHTTP, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		if(file.fieldname === "avatarImg"){
			cb(null, 'avatars/');
		} else {
			cb(null, '/');
		}
	},
	filename: (req, file, cb) => {
		if(file.fieldname === "avatarImg"){
			cb(null, req.params.login + '-' + Date.now() + path.extname(file.originalname));
		} else {
			cb(null, 'inne-' + Date.now() + path.extname(file.originalname));
		}
	}
});
const upload = multer({storage: storage});

const usersLastLapNumbers: Record<string, number> = {}; // <sessionID, lapNumber>
const usersWeatherInfo: { [key: string]: { id: number, airTemp: number, trackTemp: number } } = {}; // key is a sessionID
const singleRecord = ["carId", "trackId", "sessionType"];
const temporarySessionIds: Record<string, number> = {}; // <sessionID, count>
const boundIP: Record<string, string> = {}; // <userIP, userLogin>

// load saved boundIP
try {
	const [r] = await db.query<RowDataPacket[]>("SELECT `login`, `ip` FROM `accounts`");
	if(r.length){
		r.forEach((w) => {
			boundIP[w.ip] = w.login;
		});
	}
} catch(boundIPerr) {
	console.log("Couldn't load informatcion for boundIP from database accounts table.");
	console.dir(boundIPerr, {depth: null, colors: true});
}

// ExpressJS endopoints
expressApp.use(express.json());

expressApp.get("/", (req, res) => {
	res.send({working: true, adres: networkIP, port: portUDP});
	return;
});

expressApp.post("/login", async (req, res) => {
	const userIP = req.headers['x-forwarded-for'];
	const user = req.body.username;
	const hasher = new Bun.CryptoHasher("sha1", process.env.KLUCZ_H);
	hasher.update(req.body.password);
	const tmpHaslo = hasher.digest("hex");
	console.log(tmpHaslo);
	try {
		const [r] = await db.execute<RowDataPacket[]>("SELECT login FROM accounts WHERE login = ? AND passwd = ?", [user, tmpHaslo]);
		if(r.length){
			console.log(`User ${user} succesfully logged in.`);
			const saltToken = Date.now().toString() + user;
			hasher.update(saltToken);
			const token = hasher.digest("hex");
			try {
				await db.execute("UPDATE accounts SET token = ?, ip = ? WHERE login = ?", [token, userIP, user]);
				res.send({
					login: user,
					token: token
				});
				if(typeof(userIP) === "string") boundIP[user] = userIP;
				return;
			} catch(er2) {
				console.log("Couldn't update token for user:", user);
				res.send({error: "Error occured while trying to generate your user session."})
				console.dir(er2, {depth: null, colors: true});
				return;
			}
		} else {
			res.send({error: "Invalid credentials"});
			return;
		}
	} catch(er) {
		console.log("Error in ExpressJS on /login");
		console.dir(er, {depth: null, colors: true});
		res.send({error: "There was an error while processing your request."});
		return;
	}
});

expressApp.post("/activeSession/:token", async (req, res) => {
	const token = req.params.token;
	const userIP = req.headers['x-forwarded-for'];
	if(token.length === 40){
		try {
			const [r] = await db.execute<RowDataPacket[]>("SELECT login, ip, avatar FROM accounts WHERE token = ?", [token]);
			if(r.length){
				if(typeof(userIP) === "string" &&  r[0]['ip'] != userIP){
					await db.execute("UPDATE accounts SET ip = ? WHERE token = ?", [userIP, token]);
					boundIP[userIP] = r[0]['login'];
				}
				res.send({
					login: r[0]['login'],
					avatar: r[0]['avatar'],
				})
				return;
			} else {
				res.send({error: "Invalid or expired session. Log in again."});
				return;
			}
		} catch(er){
			console.log("Error occured while checking an active frontend session");
			console.dir(er, {depth: null, colors: true});
			res.send({error: "Request error"});
		}
	} else {
		res.send({error: "Invalid session"});
		return;
	}
});

expressApp.post("/register", async (req, res) => {
	if(!register_available){
		res.send({error: "Registration is currently disabled."});
		return;
	}
	const [checkLogin] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as i FROM accounts WHERE login = ?", [req.body.username]);
	if(checkLogin[0].i > 0){
		res.send({error: "Username already taken!"});
		return;
	}
	const [checkEmail] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as i FROM accounts WHERE email = ?", [req.body.email]);
	if(checkEmail[0].i > 0){
		res.send({error: "Email already in use!"});
		return;
	}
	const hasher = new Bun.CryptoHasher("sha1", process.env.KLUCZ_H);
	hasher.update(req.body.passwd);
	const [r] = await db.execute<ResultSetHeader>("INSERT INTO accounts (login, passwd, email) VALUES (?, ?, ?)", [req.body.username, hasher.digest("hex"), req.body.email]);
	if(r.affectedRows){
		res.send({response: "Account created."});
		// notify on email
		// try {
		// 	await smtp.sendMail({
		// 		from: process.env.EMAIL_ADDRESS,
		// 		to: req.body.email,
		// 		subject: "F1 Telemetry - Your new account!",
		// 		html: "<h1>Your new account has been created!</h1><br>Your username: <b>"+req.body.username+"</b>"
		// 	});
		// } catch(er){
		// 	console.log("Error while trying to send an email message about new account.");
		// 	console.dir(er, {depth: null, colors: true});
		// }
		return;
	} else {
		res.send({error: "Error. Try again."});
		return;
	}
});

expressApp.post("/reset", async (req, res) => {
	if(!req.body.username){
		res.send({error: "Username not specified."});
		return;
	}
	const saltToken = req.body.username + Date.now().toString() + "reset";
	const hasher = new Bun.CryptoHasher("sha1", process.env.KLUCZ_H);
	hasher.update(saltToken);
	const resetCode = hasher.digest("hex");
	const [r] = await db.execute<ResultSetHeader>("UPDATE accounts SET reset = ? WHERE login = ?", [resetCode, req.body.username]);
	if(r.affectedRows){
		console.log(`User ${req.body.username} resets his password. Reset code: ${resetCode}`);
		// send reset code on email address
		const [email] = await db.execute<RowDataPacket[]>("SELECT email FROM accounts WHERE login = ?", [req.body.username]);
		try {
			// await smtp.sendMail({
			// 	from: process.env.EMAIL_ADDRESS,
			// 	to: email[0].email,
			// 	subject: "F1 Telemetry - Password recovery",
			// 	html: "<h1>Requested password recovery!</h1><br>Your reset code: <b>"+resetCode+"</b>"
			// });
			res.send({response: "Reset code has been sent."});
		} catch(er) {
			console.log("Error while trying to send reset code for password recovery for user: ", req.body.username);
			console.log("Reset code is: "+resetCode);
			console.dir(er, {depth: null, colors: true});
			res.send({error: "There was an error while trying to send an email message with your reset code."});
			return;
		}
	} else {
		res.send({error: "There's no account with such username."});
		return;
	}
});

expressApp.post("/resetcheck", async (req, res) => {
	const [r] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as i FROM accounts WHERE reset = ?", [req.body.resetCode]);
	if(r[0].i > 0){
		res.send({response: "OK"});
		return;
	} else {
		res.send({error: "Invalid reset code."});
		return;
	}
});

expressApp.post("/resetfinal", async (req, res) => {
	const hasher = new Bun.CryptoHasher("sha1", process.env.KLUCZ_H);
	hasher.update(req.body.passwd);
	const [r] = await db.execute<ResultSetHeader>("UPDATE accounts SET passwd = ?, reset = '' WHERE reset = ?", [hasher.digest("hex"), req.body.resetCode]);
	if(r.affectedRows){
		res.send({response: "Password succesfully changed."});
		return;
	} else {
		res.send({error: "Invalid reset code."});
		return;
	}
});

expressApp.post("/sessions/:token", async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session"});
		return;
	}
	const [userSessions] = await db.execute<RowDataPacket[]>("SELECT sessionType, trackId, session_id, lastUpdate, carId FROM sessions WHERE user_id = (SELECT id FROM accounts WHERE token = ?) ORDER BY lastUpdate DESC", [req.params.token]);
	if(userSessions.length){
		res.send({data: userSessions});
	} else {
		res.send({data: null});
	}
});

expressApp.post("/sessionDetails/:token", async (req, res) => {
	if(!req.params.token || !req.body.sessionId){
		res.send({error: "Not permitted."});
		return;
	}
	try {
		const [r] = await db.execute<RowDataPacket[]>("SELECT * FROM sessions WHERE session_id = ? AND user_id = (SELECT id FROM accounts WHERE token = ?)", [req.body.sessionId, req.params.token]);
		if(r.length){
			try {
				const [r2] = await db.execute<RowDataPacket[]>("SELECT * FROM frames WHERE session_id = ?", [req.body.sessionId]);
				if(r2.length){
					let tmpObj: Record<number, any> = {};
					r2.forEach((singleFrame) => {
						if(!tmpObj[singleFrame.frame]) tmpObj[singleFrame.frame] = {};
						tmpObj[singleFrame.frame][singleFrame.data_type] = JSON.parse( inflateRawSync( Buffer.from(singleFrame.data, 'base64') ).toString() );
					});
					res.send({
						data: tmpObj,
						track: r[0].trackId,
						type: r[0].sessionType,
						lastUpdate: r[0].lastUpdate,
						car: r[0].carId
					});
					return;
				} else {
					res.send({
						data: null,
						track: r[0].trackId,
						type: r[0].sessionType,
						lastUpdate: r[0].lastUpdate,
						car: r[0].carId
					});
					return;
				}
			} catch(er2) {
				console.log("Error on sessionDetails while trying to obtain frames for sessionID:", req.body.sessionId);
				console.dir(er2, { depth: null, colors: true});
			}
		} else {
			res.send({error: "Not permitted or session has been deleted."});
		}
	} catch(er){
		console.log("sessionDetails sql error");
		console.log(er);
		res.send({error: "Database error occured."});
		return;
	}
});

expressApp.post("/deleteSession/:token/:sessionId", async (req, res) => {
	if(!req.params.token || !req.params.sessionId){
		res.send({error: "Invalid request."});
		return;
	}
	try {
		const [r] = await db.execute<ResultSetHeader>("DELETE FROM sessions WHERE session_id = ? AND user_id = (SELECT id FROM accounts WHERE token = ?)", [req.params.sessionId, req.params.token]);
		if(r.affectedRows){
			try {
				const [r2] = await db.execute<ResultSetHeader>("DELETE FROM frames WHERE session_id = ?", [req.params.sessionId]);
				res.send({response: "OK", recordsDeleted: r2.affectedRows});
				return;
			} catch(er2){
				console.log("Error: Session was deleted from sessions table, but couldnt remove data from frames table.");
				console.dir(er2, { depth: null, colors: true});
				res.send({response: "OK"});
			}
		} else {
			res.send({error: "Not permitted or session was already deleted."});
			return;
		}
	} catch(er) {
		console.log("Error while deleting session:", req.params.sessionId);
		console.dir(er, {depth: null, colors: true});
		res.send({error: "Database error occured."});
		return;
	}
});

expressApp.post("/mainStats/:token", async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session."});
		return;
	}
	let tmp = {
		userSessions: 0,
		allSessions: 0,
		userSetups: 0,
		allSetups: 0,
		lastSession: <RowDataPacket | null>null,
		favCar: null,
		favTrack: null
	};
	const [allSessions] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as i FROM sessions");
	tmp.allSessions = allSessions[0].i;
	const [userSessions] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as i FROM sessions WHERE user_id = (SELECT id FROM accounts WHERE token = ?)", [req.params.token]);
	tmp.userSessions = userSessions[0].i;
	const [allSetups] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as i FROM setups");
	tmp.allSetups = allSetups[0].i;
	const [userSetups] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as i FROM setups WHERE author = (SELECT id FROM accounts WHERE token = ?)", [req.params.token]);
	tmp.userSetups = userSetups[0].i;
	const [fav] = await db.execute<RowDataPacket[]>("SELECT favCar, favTrack FROM accounts WHERE token = ?", [req.params.token]);
	tmp.favCar = fav[0].favCar;
	tmp.favTrack = fav[0].favTrack;
	if(tmp.userSessions){
		const [lastSession] = await db.execute<RowDataPacket[]>("SELECT * FROM sessions WHERE user_id = (SELECT id FROM accounts WHERE token = ?) ORDER BY lastUpdate DESC LIMIT 1", [req.params.token]);
		tmp.lastSession = lastSession[0];
	}
	res.send(tmp);
});

expressApp.post("/mainStatsFrames/:token", async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session."});
		return;
	}
	let tmp = { user: 0, all: 0 };
	if(req.body.haveSessions){
		const [userFrames] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as i FROM frames WHERE session_id IN (SELECT session_id FROM sessions WHERE user_id = (SELECT id FROM accounts WHERE token = ?))", [req.params.token]);
		tmp.user = userFrames[0].i;
	}
	const [allFrames] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as i FROM frames");
	tmp.all = allFrames[0].i;
	res.send(tmp);
});

expressApp.post("/setups/:token", async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session."});
		return;
	}
	try {
		const [r] = await db.execute<RowDataPacket[]>("SELECT setups.*, accounts.login, accounts.avatar FROM setups LEFT JOIN accounts ON setups.author = accounts.id WHERE author = (SELECT id FROM accounts WHERE token = ?) OR public = 1", [req.params.token]);
		if(r.length){
			res.send({data: r, error: null});
		} else {
			res.send({data: null, error: "No setups available to show."})
		}
	} catch(er) {
		console.log("Error while trying to obtain list of available setups.");
		console.dir(er, {depth: null, colors: true});
		res.send({error: "Database error occured."});
	}
});

expressApp.post("/setup/:token/:setupId", async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session"});
		return;
	}
	try {
		const [r] = await db.execute<RowDataPacket[]>("SELECT * FROM setups WHERE id = ? AND (public = 1 OR author = (SELECT id FROM accounts WHERE token = ?))", [req.params.setupId, req.params.token]);
		if(r.length){
			res.send({data: r[0]});
			return;
		} else {
			res.send({error: "You don't have access to that car setup."});
			return;
		}
	} catch(er) {
		console.log("Error while trying to obtain setup", req.params.setupId, "details.");
		console.dir(er, {depth: null, colors: true});
		res.send({error: "Database error occured."})
		return;
	}
});

expressApp.post("/deleteSetup/:token/:setupId", async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session."});
		return;
	}
	try {
		const [r] = await db.execute<ResultSetHeader>("DELETE FROM setups WHERE id = ? AND author = (SELECT id FROM accounts WHERE token = ?)", [req.params.setupId, req.params.token]);
		if(r.affectedRows){
			res.send({response: "Deleted"});
			return;
		} else {
			res.send({error: "You don't have permission to delete that setup."});
			return;
		}
	} catch(er) {
		console.log("Error while trying to delete setup id:", req.params.setupId);
		console.dir(er, {depth: null, colors: true});
		res.send({error: "Database error occured."});
		return;
	}
});

expressApp.post("/updateSetup/:token/:setupId", async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session."});
		return;
	}
	try {
		const [r] = await db.execute<ResultSetHeader>("UPDATE setups SET type = ?, track = ?, car = ?, weather = ?, wingF = ?, wingR = ?, diffOn = ?, diffOff = ?, camberF = ?, camberR = ?, toeF = ?, toeR = ?, susF = ?, susR = ?, barF = ?, barR = ?, heightF = ?, heightR = ?, brakeP = ?, brakeB = ?, tireFR = ?, tireFL = ?, tireRR = ?, tireRL = ?, public = ?, fuel = ? WHERE id = ? AND author = (SELECT id FROM accounts WHERE token = ?)", [req.body.type, req.body.track, req.body.car, req.body.weather, req.body.wingF, req.body.wingR, req.body.diffOn, req.body.diffOff, req.body.camberF, req.body.camberR, req.body.toeF, req.body.toeR, req.body.susF, req.body.susR, req.body.barF, req.body.barR, req.body.heightF, req.body.heightR, req.body.brakeP, req.body.brakeB, req.body.tireFR, req.body.tireFL, req.body.tireRR, req.body.tireRL, req.body.public, req.body.fuel, req.params.setupId, req.params.token]);
		if(r.affectedRows) {
			res.send({response: "Setup succesfully updated."});
			return;
		} else {
			res.send({error: "You don't permission to change this setup."});
			return;
		}
	} catch(er) {
		console.log("Error while trying to update setup", req.params.setupId);
		console.dir(er, {depth: null, colors: true});
		res.send({error: "Database error occured."});
		return;
	}
});

expressApp.post("/createSetup/:token", async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session."});
		return;
	}
	try {
		const [r] = await db.execute<ResultSetHeader>("INSERT INTO setups (`author`, `type`, `track`, `car`, `weather`, `wingF`, `wingR`, `diffOn`, `diffOff`, `camberF`, `camberR`, `toeF`, `toeR`, `susF`, `susR`, `barF`, `barR`, `heightF`, `heightR`, `brakeP`, `brakeB`, `tireFR`, `tireFL`, `tireRR`, `tireRL`, `public`, `fuel`) VALUES ((SELECT `id` FROM accounts WHERE `token` = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [req.params.token, req.body.type, req.body.track, req.body.car, req.body.weather, req.body.wingF, req.body.wingR, req.body.diffOn, req.body.diffOff, req.body.camberF, req.body.camberR, req.body.toeF, req.body.toeR, req.body.susF, req.body.susR, req.body.barF, req.body.barR, req.body.heightF, req.body.heightR, req.body.brakeP, req.body.brakeB, req.body.tireFR, req.body.tireFL, req.body.tireRR, req.body.tireRL, req.body.public, req.body.fuel]);
		if(r.affectedRows) {
			res.send({response: "Setup succesfully created."});
			return;
		} else {
			res.send({error: "Uhhh, setup not created..."});
			return;
		}
	} catch(er) {
		console.log("Error while trying to insert new setup");
		console.dir(er, {depth: null, colors: true});
		res.send({error: "Database error occured."});
		return;
	}
});

expressApp.post("/profilLookup", async (req, res) => {
	if(!req.body.username){
		res.send({error: "Username not provided."});
		return;
	}
	// basic profile info
	const [r] = await db.execute<RowDataPacket[]>("SELECT avatar, registered, description, favCar, favTrack FROM accounts WHERE login = ?", [req.body.username]);
	if(r.length){
		let tmpInfo = { avatar: r[0].avatar, registered: r[0].registered, description: r[0].description, favCar: r[0].favCar, favTrack: r[0].favTrack, userSessions: 0, lastSession: <RowDataPacket | null>null };
		try {
			const [userSessions] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as i FROM sessions WHERE user_id = (SELECT id FROM accounts WHERE login = ?)", [req.body.username]);
			tmpInfo.userSessions = userSessions[0].i;
			if(userSessions[0].i > 0){
				const [lastSession] = await db.execute<RowDataPacket[]>("SELECT * FROM sessions WHERE user_id = (SELECT id FROM accounts WHERE login = ?) ORDER BY lastUpdate DESC LIMIT 1", [req.body.username]);
				tmpInfo.lastSession = lastSession[0];
			}
		} catch(er2){
			console.log("Error while trying to obtain information for profilLookup:", req.body.username);
			console.dir(er2, {depth: null, colors: true});
		} finally {
			res.send(tmpInfo);
		}
	} else {
		res.send({error: "There's no profile with such username."});
		return;
	}
});

expressApp.post("/changePassword/:token", async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session."});
		return;
	}
	const hasher = new Bun.CryptoHasher("sha1", process.env.KLUCZ_H);
	hasher.update(req.body.currentPasswd);
	const oldPasswdHash = hasher.digest("hex");
	hasher.update(req.body.newPasswd);
	const newPasswdHash = hasher.digest("hex");
	try {
		const [r] = await db.execute<ResultSetHeader>("UPDATE accounts SET passwd = ? WHERE token = ? AND passwd = ?", [newPasswdHash, req.params.token, oldPasswdHash]);
		if(r.affectedRows){
			res.send({response: "Password changed!"});
			return;
		} else {
			res.send({error: "Invalid current password."});
			return;
		}
	} catch(er) {
		console.log("Error while trying to change user password");
		console.dir(er, {depth: null, colors: true});
		res.send({error: "Database error occured."});
		return;
	}
});

expressApp.post("/changeDescription/:token", async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session."});
		return;
	}
	if(req.body.description && req.body.description.length > 400){
		res.send({error: "Description is too long. Stay in 400 chars maximum!"});
		return;
	}
	try {
		const [r] = await db.execute<ResultSetHeader>('UPDATE accounts SET `description` = ? WHERE `token` = ?', [req.body.description, req.params.token]);
		if(r.affectedRows > 0){
			res.send({response: "Description changed."});
			return;
		} else {
			res.send({error: "Invalid user session."});
			return;
		}
	} catch(er){
		console.log("Error while trying to change user description.");
		console.dir(er, {depth: null, colors: true});
		res.send({error: "Database error occured."});
		return;
	}
});

expressApp.post("/changeAvatar/:token", upload.single('avatarImg'), async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session."});
		return;
	}
	if(!req.file){
		res.send({error: "Couldn't upload new image."});
		return;
	}
	// find current avatar and delete it later if its not a default one
	const [r] = await db.execute<RowDataPacket[]>("SELECT avatar FROM accounts WHERE token = ?", [req.params.token]);
	if(!r.length){
		res.send({error: "Invalid user session."});
		return;
	}
	// update the path in database
	const newImagePath = "/images/" + req.file.destination + req.file.filename;
	const [r2] = await db.execute<ResultSetHeader>("UPDATE accounts SET avatar = ? WHERE token = ?", [newImagePath, req.params.token]);
	if(r2.affectedRows){
		res.send({response: newImagePath});
		// new image set up succesfully, remove now previous one
		// if(r[0].avatar != '/images/avatars/defaultAvatar.png'){
		// 	await unlink(r[0].avatar);
		// }
		return;
	} else {
		res.send({error: "There was an issue updating your avatar."});
		return;
	}
});

expressApp.post("/deleteAvatar/:token", async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session."});
		return;
	}
	try {
		const [r] = await db.execute<RowDataPacket[]>("SELECT avatar FROM accounts WHERE token = ?", [req.params.token]);
		if(!r.length){
			res.send({error: "Invalid user session."});
			return;
		}
		if(r[0].avatar != '/images/avatars/defaultAvatar.png'){
			const [r2] = await db.execute<ResultSetHeader>("UPDATE accounts SET avatar = '/images/avatars/defaultAvatar.png' WHERE token = ?", [req.params.token]);
			if(r2.affectedRows){
				res.send({response: '/images/avatars/defaultAvatar.png'});
				await unlink(r[0].avatar);
				return;
			} else {
				res.send({error: "There was an issue trying to delete your avatar."});
				return;
			}
		}
	} catch(er) {
		console.log("Error while trying to remove user avatar.");
		console.dir(er, {depth: null, colors: true});
		res.send({error: "Database error occured."});
		return;
	}
});

expressApp.post("/changeFavourites/:token", async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session."});
		return;
	}
	try {
		const [r] = await db.execute<ResultSetHeader>("UPDATE accounts SET favCar = ?, favTrack = ? WHERE token = ?", [req.body.favCar, req.body.favTrack, req.params.token]);
		if(r.affectedRows){
			res.send({response: "Favourites updated."});
			return;
		} else {
			res.send({error: "Invalid user session."});
			return;
		}
	} catch(er) {
		console.log("Error while trying to change user favourites");
		console.dir(er, {depth: null, colors: true});
		res.send({error: "Database error occured."});
		return;
	}
});

expressApp.post("/deleteAccount/:token", async (req, res) => {
	if(!req.params.token || req.params.token.length != 40){
		res.send({error: "Invalid user session."});
		return;
	}
	try {
		const [userId] = await db.execute<RowDataPacket[]>("SELECT id FROM accounts WHERE login = ? AND token = ?", [req.body.login, req.params.token]);
		if(!userId.length){
			res.send({error: "Invalid user session."});
			return;
		}
		const [r] = await db.execute<ResultSetHeader>("DELETE FROM accounts WHERE id = ?", [userId[0].id]);
		if(r.affectedRows){
			res.send({response: "OK"});
			try {
				await db.execute("DELETE FROM setups WHERE author = ?", [userId[0].id]);
				const [userSessions] = await db.execute<RowDataPacket[]>("SELECT session_id FROM sessions WHERE user_id = ?", [userId[0].id]);
				if(userSessions.length){
					await db.execute("DELETE FROM frames WHERE session_id IN ?", [userSessions.map(x => x.session_id)]);
					await db.execute("DELETE FROM sessions WHERE user_id = ?", [userId[0].id]);
				}
			} catch(er2) {
				console.log("Error while trying to remove sessions, setups and frames, after deleting USER account")
			}
			return;
		} else {
			res.send({error: "Invalid user session."});
			return;
		}
	} catch(er) {
		console.log("Error while trying to remove user ACCOUNT!");
		console.dir(er, {depth: null, colors: true});
		res.send({error: "Database error occured. Please reach contact with Administrator."});
		return;
	}
});



const storeSessionData = async (
		sessionID: bigint,
		frameID: number,
		dataType: "motion" | "carDamage" | "carStatus" | "telemetry" | "carId" | "trackId" | "lapData" | "weather" | "sessionType",
		data: any,
		userIP: string
	) => {

		// single values to store like car, track or session id are being sent the whole time session is in progress
		// but first 10 values are completely enough to obtain all needed information
		if(singleRecord.includes(dataType)){
			if(temporarySessionIds[sessionID.toString()]) temporarySessionIds[sessionID.toString()] += 1;
			else temporarySessionIds[sessionID.toString()] = 1;

			if(temporarySessionIds[sessionID.toString()] > 10) return;

			try {
				await db.execute(`INSERT INTO sessions (session_id, ip, ${dataType}, user_id) VALUES (?, ?, ?, (SELECT id FROM accounts WHERE ip = ?)) ON DUPLICATE KEY UPDATE ${dataType} = ?`, [sessionID, userIP, data, userIP, data]);
			} catch(er){
				console.log("Couldn't save single record value to database...");
				console.dir(er, { depth: null, colors: true });
			}
		} else {
			try {
				await db.execute("INSERT INTO frames (session_id, frame, data_type, data) VALUES (?, ?, ?, ?)", [sessionID, frameID, dataType, deflateRawSync(JSON.stringify(data)).toString('base64')]);
			} catch(er2){
				console.log("Couldn't save frame packet to database...");
				console.dir(er2, { depth: null, colors: true });
			}
		}


}

const socketUDP = await Bun.udpSocket({
    port: portUDP,
    socket: {
        data(socket, msg, port, addr) {
            switch(msg.length) {

                // motion packet
                case 1464:
                    let recvMotion = parseMotion(msg);
                    let motionData = {
                        positionX:	recvMotion.carMotionData[recvMotion.header.m_playerCarIndex].m_worldPositionX,
                        positionY:	recvMotion.carMotionData[recvMotion.header.m_playerCarIndex].m_worldPositionY,
                        positionZ:	recvMotion.carMotionData[recvMotion.header.m_playerCarIndex].m_worldPositionZ,
                        gLateral:	recvMotion.carMotionData[recvMotion.header.m_playerCarIndex].m_gForceLateral,
                        gLong:		recvMotion.carMotionData[recvMotion.header.m_playerCarIndex].m_gForceLongitudinal,
                        gVert:		recvMotion.carMotionData[recvMotion.header.m_playerCarIndex].m_gForceVertical
                    }
                    boundIP[addr] && io.emit(boundIP[addr], {motionData: motionData})
                    storeSessionData(
                        recvMotion.header.m_sessionUID,
                        recvMotion.header.m_frameIdentifier,
                        "motion",
                        motionData,
                        addr
                    );
                    break;
                
                // car damage
                case 948:
                    let recvCarDmg = parseCarDamage(msg);
                    let carDmgData = {
                        tireWearRL:		recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_tyresWear[0],
						tireWearRR:		recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_tyresWear[1],
						tireWearFL:		recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_tyresWear[2],
						tireWearFR:		recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_tyresWear[3],
						tireDamageRL:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_tyresDamage[0],
						tireDamageRR:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_tyresDamage[1],
						tireDamageFL:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_tyresDamage[2],
						tireDamageFR:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_tyresDamage[3],
						wingDamageFL:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_frontLeftWingDamage,
						wingDamageFR:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_frontRightWingDamage,
						wingDamageRear:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_rearWingDamage,
						floorDamage:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_floorDamage,
						diffuserDamage:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_diffuserDamage,
						sidepodDamage:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_sidepodDamage,
						drsFault:		recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_drsFault,
						ersFault:		recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_ersFault,
						gearboxDamage:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_gearBoxDamage,
						engineDamage:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_engineDamage,
						engineWearMGUH:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_engineMGUHWear,
						engineWearES:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_engineESWear,
						engineWearCE:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_engineCEWear,
						engineWearICE:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_engineICEWear,
						engineWearMGUK:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_engineMGUKWear,
						engineWearTC:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_engineTCWear,
						engineBlown:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_engineBlown,
						engineSeized:	recvCarDmg.carDamageData[recvCarDmg.header.m_playerCarIndex].m_engineSeized
                    };
					boundIP[addr] && io.emit(boundIP[addr], {carDamage: carDmgData})
					storeSessionData(
						recvCarDmg.header.m_sessionUID,
						recvCarDmg.header.m_frameIdentifier,
						"carDamage",
						carDmgData,
						addr
					);
					break;

				// car status
				case 1058:
					let recvCarStatus = parseCarStatus(msg);
					let carStatusData = {
						tractionControl:	recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_tractionControl,
						abs:				recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_antiLockBrakes,
						brakeBias:			recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_frontBrakeBias,
						pitLimiter:			recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_pitLimiterStatus,
						fuelMode:			recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_fuelMix,
						fuelLoaded:			recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_fuelInTank,
						fuelMax:			recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_fuelCapacity,
						fuelLapsLeft:		recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_fuelRemainingLaps,
						maxRPM:				recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_maxRPM,
						idleRPM:			recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_idleRPM,
						drsAvailable:		recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_drsAllowed,
						drsDistance:		recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_drsActivationDistance,
						tiresType:			recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_actualTyreCompound,
						tiresVisualType:	recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_visualTyreCompound,
						tiresAges:			recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_tyresAgeLaps,
						flag:				recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_vehicleFiaFlags,
						ersStorage:			recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_ersStoreEnergy,
						ersMode:			recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_ersDeployMode,
						ersHarvestedMGUK:	recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_ersHarvestedThisLapMGUK,
						ersHarvestedMGUH:	recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_ersHarvestedThisLapMGUH,
						ersDeployed:		recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_ersDeployedThisLap,
						networkPause:		recvCarStatus.carStatusData[recvCarStatus.header.m_playerCarIndex].m_networkPaused
					};
					boundIP[addr] && io.emit(boundIP[addr], {carStatus: carStatusData})
					storeSessionData(
						recvCarStatus.header.m_sessionUID,
						recvCarStatus.header.m_frameIdentifier,
						"carStatus",
						carStatusData,
						addr
					);
					break;

				// car telemetry
				case 1347:
					let recvTelemetry = parseTelemetry(msg);
					let telemetryData = {
						drsActive:			recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_drs,
						speed:				recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_speed,
						throttle:			recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_throttle,
						steer:				recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_steer,
						brake:				recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_brake,
						clutch:				recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_clutch,
						gear:				recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_gear,
						engienRPM:			recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_engineRPM,
						brakeTempRL:		recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_brakesTemperature[0],
						brakeTempRR:		recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_brakesTemperature[1],
						brakeTempFL:		recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_brakesTemperature[2],
						brakeTempFR:		recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_brakesTemperature[3],
						tireTempOuterRL:	recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_tyresSurfaceTemperature[0],
						tireTempOuterRR:	recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_tyresSurfaceTemperature[1],
						tireTempOuterFL:	recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_tyresSurfaceTemperature[2],
						tireTempOuterFR:	recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_tyresSurfaceTemperature[3],
						tireTempInnerRL:	recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_tyresInnerTemperature[0],
						tireTempInnerRR:	recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_tyresInnerTemperature[1],
						tireTempInnerFL:	recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_tyresInnerTemperature[2],
						tireTempInnerFR:	recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_tyresInnerTemperature[3],
						engineTemp:			recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_engineTemperature,
						tirePressureRL:		recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_tyresPressure[0],
						tirePressureRR:		recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_tyresPressure[1],
						tirePressureFL:		recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_tyresPressure[2],
						tirePressureFR:		recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_tyresPressure[3],
						tireSurfaceRL:		recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_surfaceType[0],
						tireSurfaceRR:		recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_surfaceType[1],
						tireSurfaceFL:		recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_surfaceType[2],
						tireSurfaceFR:		recvTelemetry.carTelemetryData[recvTelemetry.header.m_playerCarIndex].m_surfaceType[3],
						gearSuggested:		recvTelemetry.m_suggestedGear
					};
					boundIP[addr] && io.emit(boundIP[addr], {telemetry: telemetryData})
					storeSessionData(
						recvTelemetry.header.m_sessionUID,
						recvTelemetry.header.m_frameIdentifier,
						"telemetry",
						telemetryData,
						addr
					);
					break;

				// participants
				case 1257:
					let recvParticipants = parseParticipants(msg);
					// only used to obtain id of user's team / car
					storeSessionData(
						recvParticipants.header.m_sessionUID,
						recvParticipants.header.m_frameIdentifier,
						"carId",
						recvParticipants.participants[recvParticipants.header.m_playerCarIndex].m_teamId,
						addr
					);
					// boundIP & socket.io emit - maybe in the future, when it would be needed
					break;

				// lap data
				case 972:
					let recvLap = parseLap(msg);
					let lapData = {
						lastLapTime:		recvLap.lapData[recvLap.header.m_playerCarIndex].m_lastLapTimeInMS,
						currentLapTime:		recvLap.lapData[recvLap.header.m_playerCarIndex].m_currentLapTimeInMS,
						currentLapS1:		recvLap.lapData[recvLap.header.m_playerCarIndex].m_sector1TimeInMS,
						currentLapS2:		recvLap.lapData[recvLap.header.m_playerCarIndex].m_sector2TimeInMS,
						currentPosition:	recvLap.lapData[recvLap.header.m_playerCarIndex].m_carPosition,
						lastLapNumber:		usersLastLapNumbers[recvLap.header.m_sessionUID.toString()] ? usersLastLapNumbers[recvLap.header.m_sessionUID.toString()] : 0,
						currentLapNumber:	recvLap.lapData[recvLap.header.m_playerCarIndex].m_currentLapNum,
						currentLapInvalid:	recvLap.lapData[recvLap.header.m_playerCarIndex].m_currentLapInvalid,
						lapDistance:		recvLap.lapData[recvLap.header.m_playerCarIndex].m_lapDistance
					};
					usersLastLapNumbers[recvLap.header.m_sessionUID.toString()] = lapData.currentLapNumber;
					boundIP[addr] && io.emit(boundIP[addr], {lapData: lapData})
					storeSessionData(
						recvLap.header.m_sessionUID,
						recvLap.header.m_frameIdentifier,
						"lapData",
						lapData,
						addr
					);
					break;
				
				// session data - info about weather and track
				case 632:
					let recvSession = parseSession(msg);
					let shouldSaveWeather = false;
					
					if(!usersWeatherInfo[recvSession.header.m_sessionUID.toString()]){
						usersWeatherInfo[recvSession.header.m_sessionUID.toString()] = {
							'id': recvSession.m_weather,
							'trackTemp': recvSession.m_trackTemperature,
							'airTemp': recvSession.m_airTemperature
						};
						shouldSaveWeather = true;
					} else {
						if(usersWeatherInfo[recvSession.header.m_sessionUID.toString()].id != recvSession.m_weather){
							usersWeatherInfo[recvSession.header.m_sessionUID.toString()].id = recvSession.m_weather;
							shouldSaveWeather = true;
						}
						if(usersWeatherInfo[recvSession.header.m_sessionUID.toString()].trackTemp != recvSession.m_trackTemperature){
							usersWeatherInfo[recvSession.header.m_sessionUID.toString()].trackTemp = recvSession.m_trackTemperature;
							shouldSaveWeather = true;
						}
						if(usersWeatherInfo[recvSession.header.m_sessionUID.toString()].airTemp != recvSession.m_airTemperature){
							usersWeatherInfo[recvSession.header.m_sessionUID.toString()].airTemp = recvSession.m_airTemperature;
							shouldSaveWeather = true;
						}
					}

					if(shouldSaveWeather){
						storeSessionData(
							recvSession.header.m_sessionUID,
							recvSession.header.m_frameIdentifier,
							"weather",
							usersWeatherInfo[recvSession.header.m_sessionUID.toString()],
							addr
						);
					}
					storeSessionData(
						recvSession.header.m_sessionUID,
						recvSession.header.m_frameIdentifier,
						"trackId",
						recvSession.m_trackId,
						addr
					);
					storeSessionData(
						recvSession.header.m_sessionUID,
						recvSession.header.m_frameIdentifier,
						"sessionType",
						recvSession.m_sessionType,
						addr
					);
					break;
				
				// Car configuration setup - not needed yet
				case 1102:
					break;

				// Lobby info - not needed yet
				case 1191:
					break;
				
				// Classification / When session ends - not needed yet
				// could be useful to know which sessions wont change - could be optimized in database
				case 1015:
					break;
				
				// Miscelanious events: Fastest Lap, Invalidaded Lap, Teammate in Pitstop and other popups
				case 40:
					break;

				// Session history - not needed
				case 1155:
					break;
						
				default:
					break;
            }
        }
    }
});

serverHTTP.listen(portHTTP, () => {
	console.log(`ExpressJS and socket.io has started on http://localhost:${portHTTP}`);
});