import { parsePacketCarDamageData, parsePacketCarMotionExtra, parsePacketCarSetupData, parsePacketCarStatusData, parsePacketCarTelemetryData, parsePacketClassificationData, parsePacketLapData, parsePacketLobbyInfoData, parsePacketMotionData, parsePacketParticipantsData, parsePacketSessionData, parsePacketSessionHistoryData, parsePacketTimeTrialData, parsePacketTyreSetsData } from "./structure25";
// import mysql, { QueryResult, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import cassandra from "cassandra-driver";
import { deflateRawSync, inflateRawSync } from "zlib";
import { Server } from "socket.io";
import { createServer } from "http";
import express, { RequestHandler } from "express";
import os from "os";
import { unlink } from "fs/promises";
import multer from "multer";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import { randomBytes } from "crypto";
const portHTTP = Number(process.env.PORT_HTTP) || 20778;
const portUDP: number = Number(process.env.PORT_UDP) || 20777;
const networkIP = os.networkInterfaces().eth0![0].address || null;
// compression ?

const register_available = true;
// const db: mysql.Pool = mysql.createPool({
// 	host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME,
//     waitForConnections: true,
//     connectionLimit: 20,
//     queueLimit: 0,
//     multipleStatements: true,
//     dateStrings: true,
//     decimalNumbers: true,
//     // charset: 'utf8mb4_general_ci'
// });
const db = new cassandra.Client({
	contactPoints: ['127.0.0.1'],
	localDataCenter: 'datacenter1',
	keyspace: 'f1telemetry',
	credentials: {
		username: process.env.DB_USER!,
		password: process.env.DB_PASS!
	},
	pooling: {
		warmup: true,
		maxRequestsPerConnection: 3072,
		coreConnectionsPerHost: {
			[cassandra.types.distance.local]: 10,
		}
	}
});
await db.connect();

const expressApp = express();
const serverHTTP = createServer(expressApp);
const io = new Server(serverHTTP, {
	cors: {
		origin: "https://formula.zakrzewski.dev",
		credentials: true,
		methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"]
	}
});

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		if(file.fieldname === "avatarImg"){
			cb(null, 'avatars/');
		} else if(file.fieldname === "bannerImg") {
			cb(null, 'banners/');
		} else {
			cb(null, '/');
		}
	},
	filename: (req, file, cb) => {
		if(file.fieldname === "avatarImg"){
			cb(null, req.auth_user_id + '-' + Date.now() + path.extname(file.originalname));
		} else if(file.fieldname === "bannerImg") {
			cb(null, req.auth_user_id + '-' + Date.now() + path.extname(file.originalname));
		} else {
			cb(null, 'other-' + Date.now() + path.extname(file.originalname));
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
	const r = await db.execute("SELECT login, ip FROM accounts");
	if(r.rowLength){
		r.rows.forEach((w) => {
			boundIP[w.ip] = w.login;
		});
		console.log("boundIP: ", boundIP);
	}
} catch(boundIPerr) {
	console.log("Couldn't load informatcion for boundIP from database accounts table.");
	console.dir(boundIPerr, {depth: null, colors: true});
}

declare module "express-serve-static-core" {
	interface Request {
		auth_access_token?: string;
		auth_user_id?: cassandra.types.Uuid;
	}
}

const requireAuth: RequestHandler = async (req, res, next) => {
	const accessToken = req.cookies.access_token || req.headers.authorization?.split(" ")[1];
	if(!accessToken) {
		res.status(401).json({error: "Missing access token."});
		return;
	}
	const r = await db.execute("SELECT * FROM access_by_at WHERE access_token = ?", [accessToken], { prepare: true });
	if(!r.rowLength){
		res.status(401).json({error: "Invalid access token."});
		return;
	}
	if(new Date(r.first().access_token_expiry) < new Date()){
		res.status(401).json({error: "Access token expired."});
		return;
	} else {
		req.auth_user_id = r.first().user_id;
		req.auth_access_token = r.first().access_token;
		next();
	}
};

// ExpressJS endopoints
expressApp.use(cors({
	origin: ["https://formula.zakrzewski.dev"],
	credentials: true,
	methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
}));
expressApp.use(cookieParser());
expressApp.use(express.json());

expressApp.get("/", (req, res) => {
	res.send({working: true, adres: networkIP, port: portUDP});
	return;
});

expressApp.post("/logout", requireAuth, async (req, res) => {
	let obtainRT;
	if(req.cookies.refresh_token){
		// use RT
		obtainRT = req.cookies.refresh_token;
	} else {
		// find RT
		const findrt = await db.execute("SELECT refresh_token FROM access_by_at WHERE user_id = ? AND access_token = ?", [req.auth_user_id, req.auth_access_token], { prepare: true });
		if(findrt.rowLength){
			obtainRT = findrt.first().refresh_token;
		}
	}
	if(!obtainRT) {
		// session was invalid anyways
		console.log("Couldnt obtain refresh token to log out user... possible tombestone in database (???)");
		res.status(200).json({message: "Succesfully logged out."});
		return;
	}
	const result = await db.execute("DELETE FROM access WHERE refresh_token = ? AND user_id = ?", [obtainRT, req.auth_user_id], { prepare: true });
	if(result.wasApplied()){
		res.status(200).json({message: "Succesfully logged out."});
		return;
	} else {
		res.status(500).json({error: "Database error occured."});
		return;
	}
});

expressApp.post("/logoutAll", requireAuth, async (req, res) => {
	const result = await db.execute("DELETE FROM access WHERE user_id = ?", [req.auth_user_id], { prepare: true });
	if(result.wasApplied()){
		res.status(200).json({message: "Succesfully logged out from all devices."});
		return;
	} else {
		res.status(500).json({error: "Database error occured."});
		return;
	}
});

expressApp.post("/login", async (req, res) => {
	if(!req.body.login || !req.body.password){
		res.status(400).json({message: "Required credentials missing."});
		return;
	}
	if(req.body.login.length < 3 || req.body.login.length > 30){
		res.status(400).json({message: "Invalid length of credentials."});
		return;
	}
	if(req.body.password.length < 6 || req.body.password.length > 100){
		res.status(400).json({message: "Invalid length of credentials."});
		return;
	}
	try {
		const user = await db.execute("SELECT id, passwd FROM accounts WHERE login = ?", [req.body.login], { prepare: true });
		if(user.rowLength){
			const checkPassword = await Bun.password.verify(req.body.password, user.first().passwd);
			if(checkPassword){
				const access_token = randomBytes(64).toString("hex");
				const access_token_expiry = new Date();
				access_token_expiry.setMinutes(access_token_expiry.getMinutes() + 15);

				const refresh_token = randomBytes(64).toString("hex");
				const refresh_token_expiry = new Date();
				refresh_token_expiry.setDate(refresh_token_expiry.getDate() + 7);

				try {
					const storeTokens = await db.execute("INSERT INTO access (user_id, access_token, access_token_expiry, refresh_token, refresh_token_expiry) VALUES (?, ?, ?, ?, ?)", [user.first().id, access_token, access_token_expiry, refresh_token, refresh_token_expiry], { prepare: true });
					if(storeTokens.wasApplied()){
						res.cookie("refresh_token", refresh_token, {
							httpOnly: true,
							secure: true,
							sameSite: "none",
							domain: ".zakrzewski.dev"
						}).status(200).json({access_token: access_token});
						return;
					} else {
						res.status(500).json({message: "There was an error while trying to generate your user session."});
						return;
					}
				} catch(er2) {
					console.log(er2);
					res.status(500).json({message: "There was an error while trying to generate your user session."});
					return;
				}
			} else {
				res.status(401).json({message: "Invalid credentials."});
				return;
			}
		} else {
			res.status(401).json({message: "Invalid credentials."});
			return;
		}
	} catch(er) {
		console.log("Error in ExpressJS on /login");
		console.dir(er, {depth: null, colors: true});
		res.status(500).json({message: "There was an error while processing your request."});
		return;
	}
});

expressApp.post("/refresh", async (req, res) => {
	console.log("ck", req.cookies);
	console.log("sck", req.signedCookies);
	if(!req.cookies){
		res.status(401).json({message: "Missing cookies."});
		return;
	}
	if(!req.cookies.refresh_token){
		res.status(401).json({message: "Missing refresh token."});
		return;
	}
	try {
		const validateToken = await db.execute("SELECT * FROM access_by_rt WHERE refresh_token = ?", [req.cookies.refresh_token], { prepare: true });
		if(!validateToken.rowLength){
			// no query results
			console.log("Niepoprawny refresh: ", req.cookies.refresh_token);
			res.status(401).json({message: "Invalid refresh token."});
			return;
		}
		if(new Date(validateToken.first().refresh_token_expiry) < new Date()){
			// expired
			res.status(401).json({message: "Refresh token expired."});
			await db.execute("DELETE FROM access WHERE refresh_token = ? AND user_id = ?", [req.cookies.refresh_token, validateToken.first().user_id]);
			return;
		}
		// check if user exists
		const findUser = await db.execute("SELECT * FROM accounts WHERE id = ?", [validateToken.first().user_id], { prepare: true });
		if(!findUser.rowLength){
			// user doesnt exist
			res.status(401).json({error: "Your account has been removed."});
			await db.execute("DELETE FROM access WHERE user_id = ?", [validateToken.first().user_id], { prepare: true });
			return;
		}
		const accessToken = randomBytes(64).toString("hex");
		const accessExpiry = new Date();
		accessExpiry.setMinutes(accessExpiry.getMinutes() + 15);
		const updateAccess = await db.execute("UPDATE access SET access_token = ?, access_token_expiry = ? WHERE refresh_token = ? AND user_id = ?", [accessToken, accessExpiry, req.cookies.refresh_token, validateToken.first().user_id], { prepare: true });
		if(updateAccess.wasApplied()){
			res.status(200).json({access_token: accessToken});
			return;
		} else {
			res.status(500).json({error: "Database error occured."});
			return;
		}
	} catch(er) {
		console.log("refresh", er);
		res.status(500).json({error: "There was an error while trying to refresh your user session."});
		return;
	}
});

expressApp.get("/me", requireAuth, async (req, res) => {
	const userInfo = await db.execute("SELECT login, email, avatar, banner, favcar, favtrack, ip FROM accounts WHERE id = ?", [ req.auth_user_id ], { prepare: true });
	if(!userInfo.rowLength){
		res.status(403).json({error: "Your account has been removed."});
		return;
	} else {
		// return response with everything except user previous IP
		res.status(200).json({login: userInfo.first().login, email: userInfo.first().email, avatar: userInfo.first().avatar, banner: userInfo.first().banner, favCar: userInfo.first().favcar, favTrack: userInfo.first().favtrack});

		const userIP = req.headers['x-forwarded-for'];
		if(typeof(userIP) === "string" &&  userInfo.first().ip != userIP){
			//if current IP is different, lets update the value in db
			await db.execute("UPDATE accounts SET ip = ? WHERE id = ?", [userIP, req.auth_user_id], { prepare: true });
			boundIP[userIP] = userInfo.first().login;
		}
		return;
	}
});

expressApp.post("/register", async (req, res) => {
	if(!register_available){
		res.status(403).json({error: "Registration is currently disabled."});
		return;
	}
	if(!req.body.username || !req.body.email || !req.body.passwd){
		res.status(400).json({error: "Missing parameters."});
		return;
	}
	if(req.body.username.length < 3 || req.body.username.length > 30){
		res.status(400).json({error: "Invalid username length."});
		return;
	}
	if(req.body.passwd.length < 6 || req.body.passwd.length > 100){
		res.status(400).json({error: "Invalid password length."});
		return;
	}
	if(req.body.email.length < 6 || req.body.email.length > 70){
		res.status(400).json({error: "Invalid email length."});
		return;
	}

	const checkLogin = await db.execute("SELECT id FROM accounts WHERE login = ?", [req.body.username], { prepare: true });
	if(checkLogin.rowLength){
		res.status(409).json({error: "Username already taken!"});
		return;
	}
	const checkEmail = await db.execute("SELECT id FROM accounts WHERE email = ?", [req.body.email], { prepare: true });
	if(checkEmail.rowLength){
		res.status(409).json({error: "Email already in use!"});
		return;
	}
	const hasher = await Bun.password.hash(req.body.passwd);
	const result = await db.execute("INSERT INTO accounts (id, login, passwd, email, avatar, banner) VALUES (?, ?, ?, ?, '/avatars/defaultAvatar.png', '/banners/defaultBanner.png')", [cassandra.types.Uuid.random(), req.body.username, hasher, req.body.email], { prepare: true });
	if(result.wasApplied()){
		res.status(200).json({response: "Account created."});
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
		res.status(500).json({error: "Error. Try again."});
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
	const result = await db.execute("UPDATE accounts SET reset = ? WHERE login = ?", [resetCode, req.body.username], { prepare: true });
	if(result.wasApplied()){
		console.log(`User ${req.body.username} resets his password. Reset code: ${resetCode}`);
		// send reset code on email address
		const email = await db.execute("SELECT email FROM accounts WHERE login = ?", [req.body.username], { prepare: true });
		try {
			// await smtp.sendMail({
			// 	from: process.env.EMAIL_ADDRESS,
			// 	to: email[0].email,
			// 	subject: "F1 Telemetry - Password recovery",
			// 	html: "<h1>Requested password recovery!</h1><br>Your reset code: <b>"+resetCode+"</b>"
			// });
			console.log(`SMTP Send not implemented. Code should, but wasnt delivered to ${email.first().email}`)
			res.status(200).json({response: "Reset code has been sent."});
		} catch(er) {
			console.log("Error while trying to send reset code for password recovery for user: ", req.body.username);
			console.log("Reset code is: "+resetCode);
			console.dir(er, {depth: null, colors: true});
			res.status(500).json({error: "There was an error while trying to send an email message with your reset code."});
			return;
		}
	} else {
		res.send({error: "There's no account with such username."});
		return;
	}
});

expressApp.post("/resetcheck", async (req, res) => {
	const r = await db.execute("SELECT id FROM accounts WHERE reset = ?", [req.body.resetCode], { prepare: true });
	if(r.rowLength){
		res.status(200).json({response: "OK"});
		return;
	} else {
		res.status(400).json({error: "Invalid reset code."});
		return;
	}
});

expressApp.post("/resetfinal", async (req, res) => {
	const hasher = await Bun.password.hash(req.body.passwd);
	const r = await db.execute("UPDATE accounts SET passwd = ?, reset = '' WHERE reset = ?", [hasher, req.body.resetCode], { prepare: true });
	if(r.wasApplied()){
		res.status(200).json({response: "Password succesfully changed."});
		return;
	} else {
		res.status(400).json({error: "Invalid reset code."});
		return;
	}
});

// expressApp.post("/sessions/:token", async (req, res) => {
// 	if(!req.params.token || req.params.token.length != 40){
// 		res.send({error: "Invalid user session"});
// 		return;
// 	}
// 	const userSessions = await db.execute("SELECT sessionType, trackId, session_id, lastUpdate, carId FROM sessions WHERE user_id = (SELECT id FROM accounts WHERE token = ?) ORDER BY lastUpdate DESC", [req.params.token], { prepare: true });
// 	if(userSessions.rowLength){
// 		res.send({data: userSessions});
// 	} else {
// 		res.send({data: null});
// 	}
// });

// expressApp.post("/sessionDetails/:token", async (req, res) => {
// 	if(!req.params.token || !req.body.sessionId){
// 		res.send({error: "Not permitted."});
// 		return;
// 	}
// 	try {
// 		const [r] = await db.execute<RowDataPacket[]>("SELECT * FROM sessions WHERE session_id = ? AND user_id = (SELECT id FROM accounts WHERE token = ?)", [req.body.sessionId, req.params.token]);
// 		if(r.length){
// 			try {
// 				const [r2] = await db.execute<RowDataPacket[]>("SELECT * FROM frames WHERE session_id = ?", [req.body.sessionId]);
// 				if(r2.length){
// 					let tmpObj: Record<number, any> = {};
// 					r2.forEach((singleFrame) => {
// 						if(!tmpObj[singleFrame.frame]) tmpObj[singleFrame.frame] = {};
// 						tmpObj[singleFrame.frame][singleFrame.data_type] = JSON.parse( inflateRawSync( Buffer.from(singleFrame.data, 'base64') ).toString() );
// 					});
// 					res.send({
// 						data: tmpObj,
// 						track: r[0].trackId,
// 						type: r[0].sessionType,
// 						lastUpdate: r[0].lastUpdate,
// 						car: r[0].carId
// 					});
// 					return;
// 				} else {
// 					res.send({
// 						data: null,
// 						track: r[0].trackId,
// 						type: r[0].sessionType,
// 						lastUpdate: r[0].lastUpdate,
// 						car: r[0].carId
// 					});
// 					return;
// 				}
// 			} catch(er2) {
// 				console.log("Error on sessionDetails while trying to obtain frames for sessionID:", req.body.sessionId);
// 				console.dir(er2, { depth: null, colors: true});
// 			}
// 		} else {
// 			res.send({error: "Not permitted or session has been deleted."});
// 		}
// 	} catch(er){
// 		console.log("sessionDetails sql error");
// 		console.log(er);
// 		res.send({error: "Database error occured."});
// 		return;
// 	}
// });

// expressApp.post("/deleteSession/:token/:sessionId", async (req, res) => {
// 	if(!req.params.token || !req.params.sessionId){
// 		res.send({error: "Invalid request."});
// 		return;
// 	}
// 	try {
// 		const [r] = await db.execute<ResultSetHeader>("DELETE FROM sessions WHERE session_id = ? AND user_id = (SELECT id FROM accounts WHERE token = ?)", [req.params.sessionId, req.params.token]);
// 		if(r.affectedRows){
// 			try {
// 				const [r2] = await db.execute<ResultSetHeader>("DELETE FROM frames WHERE session_id = ?", [req.params.sessionId]);
// 				res.send({response: "OK", recordsDeleted: r2.affectedRows});
// 				return;
// 			} catch(er2){
// 				console.log("Error: Session was deleted from sessions table, but couldnt remove data from frames table.");
// 				console.dir(er2, { depth: null, colors: true});
// 				res.send({response: "OK"});
// 			}
// 		} else {
// 			res.send({error: "Not permitted or session was already deleted."});
// 			return;
// 		}
// 	} catch(er) {
// 		console.log("Error while deleting session:", req.params.sessionId);
// 		console.dir(er, {depth: null, colors: true});
// 		res.send({error: "Database error occured."});
// 		return;
// 	}
// });

// expressApp.get("/lastSession", requireAuth, async (req, res) => {
// 	const [ lastSession ] = await db.execute<RowDataPacket[]>("SELECT * FROM sessions WHERE user_id = ? ORDER BY lastUpdate DESC LIMIT 1", [req.auth_user_id]);
// 	if(lastSession.length){
// 		res.status(200).json({...lastSession[0]});
// 		return;
// 	} else {
// 		res.status(200).send(undefined);
// 		return;
// 	}
// });

// expressApp.post("/mainStats/:token", async (req, res) => {
// 	if(!req.params.token || req.params.token.length != 40){
// 		res.send({error: "Invalid user session."});
// 		return;
// 	}
// 	let tmp = {
// 		userSessions: 0,
// 		allSessions: 0,
// 		userSetups: 0,
// 		allSetups: 0,
// 		lastSession: <RowDataPacket | null>null,
// 		favCar: null,
// 		favTrack: null
// 	};
// 	const [allSessions] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as i FROM sessions");
// 	tmp.allSessions = allSessions[0].i;
// 	const [userSessions] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as i FROM sessions WHERE user_id = (SELECT id FROM accounts WHERE token = ?)", [req.params.token]);
// 	tmp.userSessions = userSessions[0].i;
// 	const [allSetups] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as i FROM setups");
// 	tmp.allSetups = allSetups[0].i;
// 	const [userSetups] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as i FROM setups WHERE author = (SELECT id FROM accounts WHERE token = ?)", [req.params.token]);
// 	tmp.userSetups = userSetups[0].i;
// 	const [fav] = await db.execute<RowDataPacket[]>("SELECT favCar, favTrack FROM accounts WHERE token = ?", [req.params.token]);
// 	tmp.favCar = fav[0].favCar;
// 	tmp.favTrack = fav[0].favTrack;
// 	if(tmp.userSessions){
// 		const [lastSession] = await db.execute<RowDataPacket[]>("SELECT * FROM sessions WHERE user_id = (SELECT id FROM accounts WHERE token = ?) ORDER BY lastUpdate DESC LIMIT 1", [req.params.token]);
// 		tmp.lastSession = lastSession[0];
// 	}
// 	res.send(tmp);
// });

// expressApp.post("/mainStatsFrames/:token", async (req, res) => {
// 	if(!req.params.token || req.params.token.length != 40){
// 		res.send({error: "Invalid user session."});
// 		return;
// 	}
// 	let tmp = { user: 0, all: 0 };
// 	if(req.body.haveSessions){
// 		const [userFrames] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as i FROM frames WHERE session_id IN (SELECT session_id FROM sessions WHERE user_id = (SELECT id FROM accounts WHERE token = ?))", [req.params.token]);
// 		tmp.user = userFrames[0].i;
// 	}
// 	const [allFrames] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as i FROM frames");
// 	tmp.all = allFrames[0].i;
// 	res.send(tmp);
// });

// expressApp.post("/setups/:token", async (req, res) => {
// 	if(!req.params.token || req.params.token.length != 40){
// 		res.send({error: "Invalid user session."});
// 		return;
// 	}
// 	try {
// 		const [r] = await db.execute<RowDataPacket[]>("SELECT setups.*, accounts.login, accounts.avatar FROM setups LEFT JOIN accounts ON setups.author = accounts.id WHERE author = (SELECT id FROM accounts WHERE token = ?) OR public = 1", [req.params.token]);
// 		if(r.length){
// 			res.send({data: r, error: null});
// 		} else {
// 			res.send({data: null, error: "No setups available to show."})
// 		}
// 	} catch(er) {
// 		console.log("Error while trying to obtain list of available setups.");
// 		console.dir(er, {depth: null, colors: true});
// 		res.send({error: "Database error occured."});
// 	}
// });

// expressApp.post("/setup/:token/:setupId", async (req, res) => {
// 	if(!req.params.token || req.params.token.length != 40){
// 		res.send({error: "Invalid user session"});
// 		return;
// 	}
// 	try {
// 		const [r] = await db.execute<RowDataPacket[]>("SELECT * FROM setups WHERE id = ? AND (public = 1 OR author = (SELECT id FROM accounts WHERE token = ?))", [req.params.setupId, req.params.token]);
// 		if(r.length){
// 			res.send({data: r[0]});
// 			return;
// 		} else {
// 			res.send({error: "You don't have access to that car setup."});
// 			return;
// 		}
// 	} catch(er) {
// 		console.log("Error while trying to obtain setup", req.params.setupId, "details.");
// 		console.dir(er, {depth: null, colors: true});
// 		res.send({error: "Database error occured."})
// 		return;
// 	}
// });

// expressApp.post("/deleteSetup/:token/:setupId", async (req, res) => {
// 	if(!req.params.token || req.params.token.length != 40){
// 		res.send({error: "Invalid user session."});
// 		return;
// 	}
// 	try {
// 		const [r] = await db.execute<ResultSetHeader>("DELETE FROM setups WHERE id = ? AND author = (SELECT id FROM accounts WHERE token = ?)", [req.params.setupId, req.params.token]);
// 		if(r.affectedRows){
// 			res.send({response: "Deleted"});
// 			return;
// 		} else {
// 			res.send({error: "You don't have permission to delete that setup."});
// 			return;
// 		}
// 	} catch(er) {
// 		console.log("Error while trying to delete setup id:", req.params.setupId);
// 		console.dir(er, {depth: null, colors: true});
// 		res.send({error: "Database error occured."});
// 		return;
// 	}
// });

// expressApp.post("/updateSetup/:token/:setupId", async (req, res) => {
// 	if(!req.params.token || req.params.token.length != 40){
// 		res.send({error: "Invalid user session."});
// 		return;
// 	}
// 	try {
// 		const [r] = await db.execute<ResultSetHeader>("UPDATE setups SET type = ?, track = ?, car = ?, weather = ?, wingF = ?, wingR = ?, diffOn = ?, diffOff = ?, camberF = ?, camberR = ?, toeF = ?, toeR = ?, susF = ?, susR = ?, barF = ?, barR = ?, heightF = ?, heightR = ?, brakeP = ?, brakeB = ?, tireFR = ?, tireFL = ?, tireRR = ?, tireRL = ?, public = ?, fuel = ? WHERE id = ? AND author = (SELECT id FROM accounts WHERE token = ?)", [req.body.type, req.body.track, req.body.car, req.body.weather, req.body.wingF, req.body.wingR, req.body.diffOn, req.body.diffOff, req.body.camberF, req.body.camberR, req.body.toeF, req.body.toeR, req.body.susF, req.body.susR, req.body.barF, req.body.barR, req.body.heightF, req.body.heightR, req.body.brakeP, req.body.brakeB, req.body.tireFR, req.body.tireFL, req.body.tireRR, req.body.tireRL, req.body.public, req.body.fuel, req.params.setupId, req.params.token]);
// 		if(r.affectedRows) {
// 			res.send({response: "Setup succesfully updated."});
// 			return;
// 		} else {
// 			res.send({error: "You don't permission to change this setup."});
// 			return;
// 		}
// 	} catch(er) {
// 		console.log("Error while trying to update setup", req.params.setupId);
// 		console.dir(er, {depth: null, colors: true});
// 		res.send({error: "Database error occured."});
// 		return;
// 	}
// });

// expressApp.post("/createSetup/:token", async (req, res) => {
// 	if(!req.params.token || req.params.token.length != 40){
// 		res.send({error: "Invalid user session."});
// 		return;
// 	}
// 	try {
// 		const [r] = await db.execute<ResultSetHeader>("INSERT INTO setups (`author`, `type`, `track`, `car`, `weather`, `wingF`, `wingR`, `diffOn`, `diffOff`, `camberF`, `camberR`, `toeF`, `toeR`, `susF`, `susR`, `barF`, `barR`, `heightF`, `heightR`, `brakeP`, `brakeB`, `tireFR`, `tireFL`, `tireRR`, `tireRL`, `public`, `fuel`) VALUES ((SELECT `id` FROM accounts WHERE `token` = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [req.params.token, req.body.type, req.body.track, req.body.car, req.body.weather, req.body.wingF, req.body.wingR, req.body.diffOn, req.body.diffOff, req.body.camberF, req.body.camberR, req.body.toeF, req.body.toeR, req.body.susF, req.body.susR, req.body.barF, req.body.barR, req.body.heightF, req.body.heightR, req.body.brakeP, req.body.brakeB, req.body.tireFR, req.body.tireFL, req.body.tireRR, req.body.tireRL, req.body.public, req.body.fuel]);
// 		if(r.affectedRows) {
// 			res.send({response: "Setup succesfully created."});
// 			return;
// 		} else {
// 			res.send({error: "Uhhh, setup not created..."});
// 			return;
// 		}
// 	} catch(er) {
// 		console.log("Error while trying to insert new setup");
// 		console.dir(er, {depth: null, colors: true});
// 		res.send({error: "Database error occured."});
// 		return;
// 	}
// });

// expressApp.post("/profilLookup", async (req, res) => {
// 	if(!req.body.username){
// 		res.send({error: "Username not provided."});
// 		return;
// 	}
// 	// basic profile info
// 	const [r] = await db.execute<RowDataPacket[]>("SELECT avatar, registered, description, favCar, favTrack FROM accounts WHERE login = ?", [req.body.username]);
// 	if(r.length){
// 		let tmpInfo = { avatar: r[0].avatar, registered: r[0].registered, description: r[0].description, favCar: r[0].favCar, favTrack: r[0].favTrack, userSessions: 0, lastSession: <RowDataPacket | null>null };
// 		try {
// 			const [userSessions] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) as i FROM sessions WHERE user_id = (SELECT id FROM accounts WHERE login = ?)", [req.body.username]);
// 			tmpInfo.userSessions = userSessions[0].i;
// 			if(userSessions[0].i > 0){
// 				const [lastSession] = await db.execute<RowDataPacket[]>("SELECT * FROM sessions WHERE user_id = (SELECT id FROM accounts WHERE login = ?) ORDER BY lastUpdate DESC LIMIT 1", [req.body.username]);
// 				tmpInfo.lastSession = lastSession[0];
// 			}
// 		} catch(er2){
// 			console.log("Error while trying to obtain information for profilLookup:", req.body.username);
// 			console.dir(er2, {depth: null, colors: true});
// 		} finally {
// 			res.send(tmpInfo);
// 		}
// 	} else {
// 		res.send({error: "There's no profile with such username."});
// 		return;
// 	}
// });

interface ISessionOverall {
    id: number,
    session_id: bigint | string,
    sessionType: number,
    trackId: number,
    carId: number,
    lastUpdate: string | Date
}

interface ICarSetup {
    id: number,
    name: string,
}

interface IUserInfo {
    username: string,
    joined: Date | number,
    avatar: string,
    banner: string,
    favCar?: number,
    favTrack?: number,
    sessionsCount: number,
    ownSetups?: ICarSetup[],
    lastSessions?: ISessionOverall[]
}

expressApp.get("/profile/:username", async (req, res) => {
	if(!req.params.username || req.params.username.length < 4 || req.params.username.length > 30){
		res.status(400).json({error: "Invalid username parameter."});
		return;
	}
	const findUser = await db.execute("SELECT * FROM accounts WHERE login = ?", [req.params.username], { prepare: true });
	if(!findUser.rowLength){
		res.status(404).json({error: "User not found."});
		return;
	}
	const responseBody: IUserInfo = {
		username: findUser.first().login,
		joined: findUser.first().registered,
		avatar: findUser.first().avatar,
		banner: findUser.first().banner, //findUser.first().banner, // "https://i.pinimg.com/736x/2b/90/8e/2b908ec9a631f49faead496b5c430a3f.jpg"
		favCar: findUser.first().favcar,
		favTrack: findUser.first().favtrack,
		sessionsCount: 0
	};
	res.status(200).json(responseBody);
});

expressApp.post("/changePassword", requireAuth, async (req, res) => {
	if(!req.body.currentPassword){
		res.status(400).json({error: "Missing value: Current password."});
		return;
	}
	if(!req.body.newPassword){
		res.status(400).json({error: "Missing value: New password."});
		return;
	}
	if(!req.body.newPassword2){
		res.status(400).json({error: "Missing value: Repeated new password."});
		return;
	}
	if(req.body.newPassword !== req.body.newPassword2){
		res.status(400).json({error: "New passwords are not the same."});
		return;
	}
	if(req.body.newPassword.length < 6 || req.body.newPassword > 100){
		res.status(400).json({error: "Invalid length of new password."});
		return;
	}
	const userInfo = await db.execute("SELECT login, passwd FROM accounts WHERE id = ?", [ req.auth_user_id ], { prepare: true });
	if(!userInfo.rowLength){
		res.status(403).json({error: "Account does not exist!"});
		return;
	}
	const checkPassword = await Bun.password.verify(req.body.currentPassword, userInfo.first().passwd);
	if(!checkPassword) {
		res.status(400).json({error: "Invalid current password."});
		return;
	}
	const newPasswdHash = await Bun.password.hash(req.body.newPassword);
	try {
		const r = await db.execute("UPDATE accounts SET passwd = ? WHERE id = ?", [newPasswdHash, req.auth_user_id], { prepare: true });
		if(r.wasApplied()){
			res.status(200).json({response: "Password changed!"});
			console.log(`User ${userInfo.first().login} changed password! Trying to revoke all other sessions except the one which sent request.`);
			
			// revoking all this user sessions except the one used to sent request
			const userSessions = await db.execute("SELECT * FROM access WHERE user_id = ?", [req.auth_user_id], { prepare: true });
			const queryBatch: {
				query: string;
    			params: cassandra.ArrayOrObject
			}[] = [];
			userSessions.rows.forEach((sessionRow) => {
				if(sessionRow.access_token !== req.auth_access_token) {
					queryBatch.push({
						query: "DELETE FROM access WHERE user_id = ? AND refresh_token = ?",
						params: [req.auth_user_id, sessionRow.refresh_token]
					});
				}
			});
			await db.batch(queryBatch, { prepare: true });
			
			return;
		} else {
			res.status(500).json({error: "Password not changed."});
			return;
		}
	} catch(er) {
		console.log("Error while trying to change user password");
		console.dir(er, {depth: null, colors: true});
		res.status(500).json({error: "Database error occured."});
		return;
	}
});

expressApp.post("/changeAvatar", requireAuth, upload.single('avatarImg'), async (req, res) => {
	if(!req.file){
		res.status(400).json({error: "Missing image file."});
		return;
	}
	// find current avatar and delete it later if its not a default one
	const avatar = await db.execute("SELECT avatar FROM accounts WHERE id = ?", [req.auth_user_id], { prepare: true });
	if(!avatar.rowLength){
		res.status(403).json({error: "Invalid user session."});
		return;
	}
	// update the path in database
	const newImagePath = "/" + req.file.destination + req.file.filename;
	const updateAvatar = await db.execute("UPDATE accounts SET avatar = ? WHERE id = ?", [newImagePath, req.auth_user_id], { prepare: true });
	if(updateAvatar.wasApplied()){
		res.status(200).json({response: newImagePath});
		// new image set up succesfully, remove now previous one
		if(avatar.first().avatar !== '/avatars/defaultAvatar.png'){
			await unlink("."+avatar.first().avatar);
		}
		return;
	} else {
		res.status(500).json({error: "There was an issue updating your avatar."});
		return;
	}
});

expressApp.post("/changeBanner", requireAuth, upload.single('bannerImg'), async (req, res) => {
	if(!req.file){
		res.status(400).json({error: "Missing image file."});
		return;
	}
	// find current avatar and delete it later if its not a default one
	const banner = await db.execute("SELECT banner FROM accounts WHERE id = ?", [req.auth_user_id], { prepare: true });
	if(!banner.rowLength){
		res.status(403).json({error: "Invalid user session."});
		return;
	}
	// update the path in database
	const newImagePath = "/" + req.file.destination + req.file.filename;
	const updateBanner = await db.execute("UPDATE accounts SET banner = ? WHERE id = ?", [newImagePath, req.auth_user_id], { prepare: true });
	if(updateBanner.wasApplied()){
		res.status(200).json({response: newImagePath});
		// new image set up succesfully, remove now previous one
		if(banner.first().banner !== '/banners/defaultBanner.png'){
			await unlink("."+banner.first().banner);
		}
		return;
	} else {
		res.status(500).json({error: "There was an issue updating your banner."});
		return;
	}
});

expressApp.post("/removeAvatar", requireAuth, async (req, res) => {
	try {
		const avatar = await db.execute("SELECT avatar FROM accounts WHERE id = ?", [req.auth_user_id], { prepare: true });
		if(!avatar.rowLength){
			res.status(403).json({error: "Invalid user session."});
			return;
		}
		if(avatar.first().avatar !== '/avatars/defaultAvatar.png'){
			const updateAvatar = await db.execute("UPDATE accounts SET avatar = '/avatars/defaultAvatar.png' WHERE id = ?", [req.auth_user_id], { prepare: true });
			if(updateAvatar.wasApplied()){
				res.status(200).json({response: '/avatars/defaultAvatar.png'});
				await unlink("."+avatar.first().avatar);
				return;
			} else {
				res.status(500).json({error: "There was an issue trying to delete your avatar."});
				return;
			}
		} else {
			res.status(403).json({error: "You can't delete default avatar."});
			return;
		}
	} catch(er) {
		console.log("Error while trying to remove user avatar.");
		console.dir(er, {depth: null, colors: true});
		res.status(500).json({error: "Database error occured."});
		return;
	}
});

expressApp.post("/changeCar", requireAuth, async (req, res) => {
	if(req.body.car === undefined){
		res.status(400).json({error: "Missing car value."});
		return;
	}
	const parsedValue = parseInt(req.body.car);
	if(isNaN(parsedValue)){
		res.status(400).json({error: "Invalid car value."});
		return;
	}
	const updateQuery = await db.execute("UPDATE accounts SET favcar = ? WHERE id = ?", [parsedValue === -1 ? null : parsedValue , req.auth_user_id], { prepare: true });
	if(updateQuery.wasApplied()){
		res.status(200).json({response: "Favourite car updated."});
		return;
	} else {
		res.status(403).json({error: "Invalid user session."});
		return;
	}
});

expressApp.post("/changeTrack", requireAuth, async (req, res) => {
	if(req.body.track === undefined){
		res.status(400).json({error: "Missing track value."});
		return;
	}
	const parsedValue = parseInt(req.body.track);
	if(isNaN(parsedValue)){
		res.status(400).json({error: "Invalid track value."});
		return;
	}
	const updateQuery = await db.execute("UPDATE accounts SET favtrack = ? WHERE id = ?", [parsedValue === -1 ? null : parsedValue , req.auth_user_id], { prepare: true });
	if(updateQuery.wasApplied()){
		res.status(200).json({response: "Favourite track updated."});
		return;
	} else {
		res.status(403).json({error: "Invalid user session."});
		return;
	}
});

// expressApp.post("/deleteAccount/:token", async (req, res) => {
// 	if(!req.params.token || req.params.token.length != 40){
// 		res.send({error: "Invalid user session."});
// 		return;
// 	}
// 	try {
// 		const [userId] = await db.execute<RowDataPacket[]>("SELECT id FROM accounts WHERE login = ? AND token = ?", [req.body.login, req.params.token]);
// 		if(!userId.length){
// 			res.send({error: "Invalid user session."});
// 			return;
// 		}
// 		const [r] = await db.execute<ResultSetHeader>("DELETE FROM accounts WHERE id = ?", [userId[0].id]);
// 		if(r.affectedRows){
// 			res.send({response: "OK"});
// 			try {
// 				await db.execute("DELETE FROM setups WHERE author = ?", [userId[0].id]);
// 				const [userSessions] = await db.execute<RowDataPacket[]>("SELECT session_id FROM sessions WHERE user_id = ?", [userId[0].id]);
// 				if(userSessions.length){
// 					await db.execute("DELETE FROM frames WHERE session_id IN ?", [userSessions.map(x => x.session_id)]);
// 					await db.execute("DELETE FROM sessions WHERE user_id = ?", [userId[0].id]);
// 				}
// 			} catch(er2) {
// 				console.log("Error while trying to remove sessions, setups and frames, after deleting USER account")
// 			}
// 			return;
// 		} else {
// 			res.send({error: "Invalid user session."});
// 			return;
// 		}
// 	} catch(er) {
// 		console.log("Error while trying to remove user ACCOUNT!");
// 		console.dir(er, {depth: null, colors: true});
// 		res.send({error: "Database error occured. Please reach contact with Administrator."});
// 		return;
// 	}
// });



// const storeSessionData = async (
// 		sessionID: bigint,
// 		frameID: number,
// 		dataType: "motion" | "carDamage" | "carStatus" | "telemetry" | "carId" | "trackId" | "lapData" | "weather" | "sessionType",
// 		data: any,
// 		userIP: string
// 	) => {
// 		// single values to store like car, track or session id are being sent the whole time session is in progress
// 		// but first 10 values are completely enough to obtain all needed information
// 		if(singleRecord.includes(dataType)){
// 			console.log("storeSessionData singleRecord");
// 			if(temporarySessionIds[sessionID.toString()]) temporarySessionIds[sessionID.toString()] += 1;
// 			else temporarySessionIds[sessionID.toString()] = 1;

// 			if(temporarySessionIds[sessionID.toString()] > 10) return;
// 			try {
// 				await db.execute(`INSERT INTO sessions (session_id, ip, ${dataType}, user_id) VALUES (?, ?, ?, (SELECT id FROM accounts WHERE ip = ?)) ON DUPLICATE KEY UPDATE ${dataType} = ?`, [sessionID, userIP, data, userIP, data]);
// 			} catch(er){
// 				console.log("Couldn't save single record value to database...");
// 				console.dir(er, { depth: null, colors: true });
// 			}
// 		} else {
// 			console.log("storeSessionData frame");
// 			try {
// 				await db.execute("INSERT INTO frames (session_id, frame, data_type, data) VALUES (?, ?, ?, ?)", [sessionID, frameID, dataType, deflateRawSync(JSON.stringify(data)).toString('base64')]);
// 			} catch(er2){
// 				console.log("Couldn't save frame packet to database...");
// 				console.dir(er2, { depth: null, colors: true });
// 			}
// 		}
// }

io.on("connection", (socket) => {
	socket.on("joinRoom", (msg) => {
		socket.join(msg);
	});
});

const socketUDP = await Bun.udpSocket({
    port: portUDP,
    socket: {
        data(socket, msg, port, addr) {
			if(!boundIP[addr]) return;
			let driverName = boundIP[addr];
            switch(msg.length) {
                case 1349:
                    let recvMotion = parsePacketMotionData(msg);
                    // console.log("packet motion ")
                    /*
                    USEFUL values:
                    - worldPositionX, Y, Z - for each car
                    - gForceLateral, gForceLongitudinal, gForceVertical
                    */
                    let userCarMotion = recvMotion.carMotionData[recvMotion.header.playerCarIndex];
                    // console.dir(recMotion, { depth: null });
					io.to(driverName).emit("carMotion", recvMotion.carMotionData);
					io.to(driverName).emit("carMotion2", userCarMotion);
                    break;
				case 273:
                    // console.log("Motion Ex Data - no parser yet");
					let recvMotionExtra = parsePacketCarMotionExtra(msg);
					io.to(driverName).emit("myCarId", recvMotionExtra.header.playerCarIndex);
					io.to(driverName).emit("motionExtra", {...recvMotionExtra, header: undefined});
                    break;
                case 753:
                    // console.log("Packet Session Data");
                    let recvSession = parsePacketSessionData(msg);
                    // weather forecast samples are initially of 64 length, but the amount of actual values are represented by numWeatherForecastSamples, let's reduce the length of array...
                    // also, it's good to point out that timeOffset in weatherForecastSample is in minutes - it would be cool to include that in some future page for race engineers
                    // recvSession = {...recvSession, weatherForecastSamples: recvSession.weatherForecastSamples.slice(0, recvSession.numWeatherForecastSamples) }
                    /*
                    POTENTIAL GREAT VALUES TO SEND OVER WEBSOCKET TO REALTIME HUD:
                        - pitStopWindowIdealLap, pitStopRejoinPosition
                        - safety car status (0 - no safety car, 1 - full, 2 - virtual, 3 - formation lap only)
                        - some values from weatherForecastSample structure are already in the parent, those are current values (weather, trackTemp, airTemp, forecastAccuracy)
                        - sector2LapDistanceStart, sector3LapDistanceStart ( distance in m around track where sector starts )
                    */
                    // console.dir(recvSession, { depth: null });
					io.to(driverName).emit("myCarId", recvSession.header.playerCarIndex);
					// io.to(driverName).emit("sessionInfo", {...recvSession, header: undefined, weatherForecastSamples: recvSession.weatherForecastSamples.slice(0, recvSession.numWeatherForecastSamples) });
					io.to(driverName).emit("sessionInfo", {
						totalLaps: recvSession.totalLaps,
						trackId: recvSession.trackId,
						safetyCarStatus: recvSession.safetyCarStatus,
						weather: recvSession.weather,
						trackTemperature: recvSession.trackTemperature,
						airTemperature: recvSession.airTemperature,
						sessionType: recvSession.sessionType,
						// sessionTimeLeft: recvSession.sessionTimeLeft,
						sector2: recvSession.sector2LapDistanceStart,
						sector3: recvSession.sector3LapDistanceStart,
						trackLength: recvSession.trackLength
					});
                    break;
                case 1285:
                    // console.log("Packet Lap Data");
                    //every car:  car position in race, last lap times, sector 1,2 times, delta to car in front, delta to leader, current lap number, is current lap invalid, resultStatus (DNF, DSQ, active)
                    let recvLapData = parsePacketLapData(msg);
					io.to(driverName).emit("myCarId", recvLapData.header.playerCarIndex);
					io.to(driverName).emit("lapData", recvLapData.lapData);
					io.to(driverName).emit("myLapData", recvLapData.lapData[recvLapData.header.playerCarIndex]);
                    // console.dir(recvLapData, { depth: null });
                    break;
                case 1284:
                    // console.log("Participants Data");
                    let recvParticipants = parsePacketParticipantsData(msg);
                    let usersList = recvParticipants.participants.map((part, index) => ({
						carId: index, name: part.name, ai: part.aiControlled ? true : false,
						teamId: part.teamId, networkId: part.networkId, platform: part.platform,
						liveryColours: part.liveryColours, raceNumber: part.raceNumber, driverId: part.driverId
					}));
                    // console.dir(usersList, { depth: null });
					io.to(driverName).emit("myCarId", recvParticipants.header.playerCarIndex);
					io.to(driverName).emit("participants", usersList);
                    break;
                case 1133:
                    // console.log("Car Setups Data");
                    // only user car data is available, rest appears to be blank
                    let recvSetup = parsePacketCarSetupData(msg);
					// io.to(driverName).emit("myCarId", recvSetup.header.playerCarIndex);
                    // console.dir(recvSetup.carSetupData[recvSetup.header.playerCarIndex], { depth: null });
                    break;
                case 1352:
                    // console.log("Car Telemetry Data");
                    // current speed and gear value, applied gas/brake/clutch/steer/drs, tire/brake/engine temps   aaand surfaceType ids for each wheel <== available for ALL cars
                    let recvTelemetry = parsePacketCarTelemetryData(msg);
                    // console.log(recvTelemetry, { depth: null });
					io.to(driverName).emit("myCarId", recvTelemetry.header.playerCarIndex);
					io.to(driverName).emit("carTelemetry", recvTelemetry.carTelemetryData);
                    break;
                case 1239:
                    // console.log("Car Status Data");
                    // fuel, brake bias, ers, rpm values, visualTyreCompound, tyresAgeLaps, drsAllowed
                    let recvCarStatus = parsePacketCarStatusData(msg);
                    // console.dir(recvCarStatus, { depth: null });
					io.to(driverName).emit("myCarId", recvCarStatus.header.playerCarIndex);
					io.to(driverName).emit("carStatus", recvCarStatus.carStatusData);
                    break;
                case 1042:
                    // console.log("Final Classification");
                    // once at the end of the race, could be useful to tag session as completed,
                    // that tag would indicate that session is ready for all session frames combining and applying compression to reduce transfer to frontend
                    let recvFinal = parsePacketClassificationData(msg);

                    let finalClassification = recvFinal.classificationData.slice(0, recvFinal.numCars).map(car => ({
                        position: car.position,
                        pitStops: car.numPitStops,
                        penaltiesCount: car.numPenalties,
                        penaltiesTime: car.penaltiesTime,
                        raceTime: Math.round(car.totalRaceTime*1000), // original value (sec) -> (ms)
                        bestLap: car.bestLapTimeInMS,
                        status: car.resultStatus, // 0 = invalid, 1 = inactive, 2 = active, 3 = finished, 4 = didnotfinish, 5 = disqualified, 6 = not classified, 7 = retired
                        tyreStints: {
                            actualTyre: car.tyreStintsActual.slice(0, car.numTyreStints),
                            visualTyre: car.tyreStintsVisual.slice(0, car.numTyreStints),
                            endLap: car.tyreStintsEndLaps.slice(0, car.numTyreStints)
                        }
                    }));
                    // console.dir(finalClassification, {depth: null});
                    break;
                case 954:
                    console.log("Lobby Info");
                    let recvLobby = parsePacketLobbyInfoData(msg);
                    console.dir(recvLobby, { depth: null });
                    break;
                case 1041:
                    // console.log("Car Damage Data");
                    let recvDamage = parsePacketCarDamageData(msg);
                    // console.dir(recvDamage, { depth: null });
					io.to(driverName).emit("myCarId", recvDamage.header.playerCarIndex);
					io.to(driverName).emit("carDamage", recvDamage.carDamageData);
                    break;
                case 1460:
                    // user lap times in session (array of 100 laps, initially every lap with lapTimeInMS = 0), summary of best sectors and lap (gives lap number)
                    // cycled through each car during 1 sec interval, need to use carIdx value to check if it matches with header playerCarIndex to get the user data, not other drivers...
                    // array of 100 laps can be reduced to first X values, which should be equal to numLaps value
                    let recvHistory = parsePacketSessionHistoryData(msg);
                    // if(recvHistory.carIdx != recvHistory.header.playerCarIndex) return;
					if(recvHistory.numLaps <= 1) return;
					if(!recvHistory.bestLapTimeLapNum) return;
					io.to(driverName).emit("bestLap", {carId: recvHistory.carIdx, bestLap: recvHistory.lapHistoryData.slice(0, recvHistory.numLaps - 1).sort((a, b) => a.lapTimeInMS - b.lapTimeInMS)[0] });
                    // console.log("Session History");

                    let lapTimesHistory = recvHistory.lapHistoryData.slice(0, recvHistory.numLaps);
                    // console.dir({ lapTimesHistory, tyreStints: recvHistory.tyreStintsHistoryData.filter(stint => stint.endLap ) }, { depth: null });
                    break;
                case 231:
                    // same as in Session History Data, have to use carIdx to obtain correct user values,
                    // but when it comes to tyre sets and their wear/usage, it could be cool to track how other drivers handle their tyres... potential indication of struggles and remaining possibilities
                    let recvTyreSet = parsePacketTyreSetsData(msg);
                    if(recvTyreSet.carIdx != recvTyreSet.header.playerCarIndex) return;
                    // console.log("Weekend Tyre Set Data");

                    // lets apply filter to list out only available sets...
                    // ONLY FOR CONSOLE.DIR PURPOSES - fittedIdx wont work on changed array of tyreSets!!!
                    // on the second thought - there's a fitted boolean value... so maybe its better to filter list even for further packet processing?

                    // console.dir({tyreSet: recvTyreSet.tyreSetData.filter(tyre => tyre.available), fittedIdx: recvTyreSet.fittedIdx}, { depth: null });
                    break;
                case 101:
                    // console.log("Time Trial Packet");
                    let recvTimeTrial = parsePacketTimeTrialData(msg);
                    // console.dir(recvTimeTrial, { depth: null });
                    break;
                case 1131:
                    // Packet Lap Data seems to already include useful Lap Positions Packet values and even more...
                    // console.log("Lap Positions Packet - no parser yet");
                    break;
                case 45:
                    // console.log("Event packet");
                    break;
				default:
					// console.log("Nieznany pakiet");
					break;
            }
        }
    }
});

serverHTTP.listen(portHTTP, () => {
	console.log(`ExpressJS and socket.io has started on http://localhost:${portHTTP}`);
});