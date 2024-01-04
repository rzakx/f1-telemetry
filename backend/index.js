const udp = require("dgram");
const mysql = require("mysql");
const fs = require('fs');
const compression = require('compression');
const zlib = require("zlib");
const cache = require('node-cache');
require('dotenv').config();
const Parser = require("binary-parser").Parser;
const serverUDP = udp.createSocket("udp4");
const portUDP = 20777;
const portHTTP = 20778;
const express = require("express");
const cors = require("cors");
const appHTTP = express();
const serverHTTP = require("http").createServer(appHTTP);
const io = require("socket.io")(serverHTTP, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});
const nodemailer = require("nodemailer");
const CryptoJS = require("crypto-js");
const { setInterval } = require("timers");
const KLUCZ_H = process.env.KLUCZ_H;
const db = mysql.createPool({
	user: 'rafal',
	host: "localhost",
	password: process.env.DB_PASS,
	database: "f1telemetry",
	port: 3306,
	multipleStatements: true,
	dateStrings: true
});
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
const register_available = true;

appHTTP.use(express.json());
appHTTP.use(compression());
appHTTP.use(cors());

let powiazaniaIP = {};
db.query("SELECT `login`, `ip` FROM `konta`", (er, r) => {
	if(er){ console.log(er); return; }
	if(r.length > 0){
		r.forEach((w) => {
			powiazaniaIP[w.ip] = w.login;
		});
	}
});

appHTTP.post("/login", (req, res) => {
	const userIP = req.headers['x-forwarded-for'];
	const user = req.body.username;
	const saltToken = user + Date.now().toString();
	const password = req.body.password;
	const haslo = CryptoJS.HmacSHA1(password, KLUCZ_H).toString();
	db.query(
		"SELECT `login` FROM `konta` WHERE `login` = ? AND `haslo` = ?",
		[user, haslo],
		(err, result) => {
			if(result.length > 0){
				console.log("");
				console.log(new Date().toISOString(), "Udana próba logowania na konto:", user);
				const tokenik = CryptoJS.HmacSHA1(saltToken, KLUCZ_H).toString();
				db.query(
					"UPDATE `konta` SET `token` = ?, `ip` = ? WHERE `login` = ?",
					[tokenik, userIP, user]
				);
				res.send({
					login: user,
					token: tokenik
				});
				console.log(tokenik);
				powiazaniaIP[userIP] = user;
			} else {
				console.log("Nieudana próba logowania na konto: ", user);
				res.send({blad: "ZLE DANE"});
			}
		}
	);
});

//sprawdzenie sesji
appHTTP.get("/typkonta/:token", (req, res) => {
	const token = req.params.token;
	const userIP = req.headers['x-forwarded-for'];
	if(token.length == 40){
		db.query("SELECT `login`, `ip` FROM `konta` WHERE `token` = ?", [token],
		(err, result) => {
			if(result.length > 0){
				if(result[0]['ip'] != userIP){
					db.query("UPDATE `konta` SET `ip` = ? WHERE `token` = ?", [userIP, token]);
					powiazaniaIP[userIP] = result[0]['login'];
				}
				res.send({login: result[0]['login']});
			} else {
				res.send({blad: "Nie ma takiego tokenu"});
			}
		});
	}
});

//rejestracja etap 1
appHTTP.post("/register", (req, res) => {
	if(!register_available) {
		res.send({blad: "Registration is currently disabled"});
		return;
	}
	const user = req.body.username;
	const szyfrHaslo = CryptoJS.HmacSHA1(req.body.password, KLUCZ_H).toString();
	console.log("");
	console.log(new Date().toISOString(), "Nowe konto ", user, req.body.email);
	db.query(
		"SELECT `login` FROM `konta` WHERE `login` = ?", [user], (err, result) => {
			if(result.length > 0){
				res.send({blad: 'Username already taken!'});
			} else {
				db.query(
					"SELECT `email` FROM `konta` WHERE `email` = ?", [req.body.email], (err2, result2) => {
						if(result2.length > 0){
							res.send({blad: 'Email already in use!'});
						} else {
							db.query(
								"INSERT INTO `konta` (`login`, `haslo`, `email`) VALUES (?, ?, ?)",
								[user, szyfrHaslo, req.body.email], async (err, result) => {
									if(err){ res.send({blad: err})}
									if(result.affectedRows > 0){
										await smtp.sendMail({
											from: 'no-reply@rzak.pl',
											to: req.body.email,
											subject: 'F1 Telemetry - Account was created',
											html: "<h1>Your account was created!</h1><br>Username: <b>"+user+"</b>"
										});
										res.send({odp: 'OK'});
									} else {
										res.send({blad: "Account wasn't created!"});
									}
								}
							);
						}
					}
				)
			}
		}
	);
});

//etap 1 resetowania hasla
appHTTP.post("/reset", (req, res) => {
	const user = req.body.username;
	const saltToken = user + Date.now().toString() + "reset";
	const kodzwrotny = CryptoJS.HmacSHA1(saltToken, KLUCZ_H).toString();
	console.log("");
	console.log(new Date().toISOString(), "Uzytkownik ", user, " resetuje haslo, jego kodzwrotny: ", kodzwrotny);
	db.query(
		"UPDATE `konta` SET `reset` = ? WHERE `login` = ?",
		[kodzwrotny, user], (err, result) => {
			if(err){console.error(err)}
			if(result.affectedRows > 0){
				db.query("SELECT `email` FROM `konta` WHERE `login` = ?", [user], async (err2, r2) => {
					if(r2.length > 0){
						await smtp.sendMail({
							from: 'no-reply@rzak.pl',
							to: r2[0]['email'],
							subject: 'F1 Telemetry - Password recovery',
							html: "<h1>Requested password recovery!</h1><br>Your code: <b>"+kodzwrotny+"</b>"
						});
						res.send({odp: "GITES"});
					}
				});
			} else {
				res.send({blad: "Nie ma takiego gagatka :D"});
			}
		}
	);
});

//etap 2 resetowanie hasla
appHTTP.post("/resetcheck", (req, res) => {
	const zwrotny = req.body.kodzik;
	console.log("");
	console.log(new Date().toISOString(), "Sprawdzanie czy kod zwrotny ", zwrotny, " jest git");
	db.query(
		"SELECT COUNT(*) FROM `konta` WHERE `reset` = ?",
		[zwrotny], (err, result) => {
			if(result.length > 0){
				res.send({odp: "GITES"});
			} else {
				res.send({blad: "Zly kod"});
			}
		}
	);
});

//etap 3 resetowanie hasla
appHTTP.post("/resetfinal", (req, res) => {
	const zwrotny = req.body.kodzwrotny;
	console.log("");
	console.log(new Date().toISOString(), "Przywrocono haslo dla osoby o kluczu ", zwrotny);
	const szyfrHaslo = CryptoJS.HmacSHA1(req.body.haslo, KLUCZ_H).toString();
	db.query(
		"UPDATE `konta` SET `haslo` = ?, `reset` = '' WHERE `reset` = ?",
		[szyfrHaslo, zwrotny], (err, result) => {
			if(result.affectedRows > 0){
				res.send({odp: "Zresetowano"});
			} else {
				res.send({blad: "Error"});
			}
		}
	);
});

appHTTP.post("/sessions/:token", (req, res) => {
	if(!req.params.token){
		res.send({error: "No token"});
		return;
	}
	db.query("SELECT `sessionType`,`trackId`,`session_id`,`lastUpdate`,`carId` FROM `sesje` WHERE `user_id` = (SELECT `id` FROM `konta` WHERE `token` = ?) ORDER BY `lastUpdate` DESC", [req.params.token], (err, r) => {
		if(r.length > 0){
			let tmp = [];
			r.forEach((row) => {
				tmp.push(row);
			});
			res.send({data: tmp});
		} else {
			res.send({data: null});
		}
	});
});
appHTTP.post("/sessionDetails/", (req, res) => {
	if(!req.body.requestUserId || !req.body.sessionId){
		res.send({blad: "Not permitted."});
		return;
	}
	db.query("SELECT * FROM `sesje` WHERE `session_id` = ? AND `user_id` = (SELECT `id` FROM `konta` WHERE `token` = ?)", [req.body.sessionId, req.body.requestUserId], (err, r) => {
		if(err) { console.log(err); }
		if(r.length > 0){
			db.query("SELECT * FROM `frames` WHERE `session_id` = ?", [req.body.sessionId], (err2, r2) => {
				if(r2.length > 0){
					let tmpObj = {};
					r2.map((row) => {
						if(!tmpObj[row.frame]) tmpObj[row.frame] = {};
						tmpObj[row.frame][row.data_type] = JSON.parse(zlib.inflateRawSync(Buffer.from(row.data, 'base64')).toString());
					});
					res.send({data: tmpObj, track: r[0]['trackId'], type: r[0]['sessionType'], lastUpdate: r[0]['lastUpdate'], car: r[0]['carId']});
				} else {
					res.send({data: null, track: r[0]['trackId'], type: r[0]['sessionType'], lastUpdate: r[0]['lastUpdate'], car: r[0]['carId']});
				}
			});
		} else {
			res.send({blad: "Not permitted."});
		}
	});
});
appHTTP.post("/deleteSession/:token/:idsesji", (req, res) => {
	if(!req.params.token || !req.params.idsesji){
		res.send({blad: "Niepoprawne zapytanie"});
		return;
	}
	db.query("DELETE FROM `sesje` WHERE `session_id` = ? AND `user_id` = (SELECT `id` FROM `konta` WHERE `token` = ?)", [req.params.idsesji, req.params.token], (er, r) => {
		if(er){
			console.log(er);
			res.send({blad: "Błąd SQL"});
			return;
		}
		if(r.affectedRows > 0){
			db.query("DELETE FROM `frames` WHERE `session_id` = ?", [req.params.idsesji]);
			res.send({odp: "OK"});
		}
	});
});

appHTTP.post("/mainStats/:token", (req, res) => {
	if(!req.params.token){
		res.send({error: "Invalid token"});
		return;
	}
	let tmp = {sessionsO: 0, sessionsA: 0, setupsO: 0, setupsA: 0, queue: bufforData.getStats().keys, lastsession: null};
	db.query("SELECT COUNT(*) as 'i' FROM `sesje`", (er, r) => {
		if(!er)	tmp.sessionsA = r[0].i;
		db.query("SELECT COUNT(*) as 'i' FROM `sesje` WHERE `user_id` = (SELECT `id` FROM `konta` WHERE `token` = ?)", [req.params.token], (er2, r2) => {
			if(!er2) tmp.sessionsO = r2[0].i;
			if(tmp.sessionsO){
				db.query("SELECT * FROM `sesje` WHERE `user_id` = (SELECT `id` FROM `konta` WHERE `token` = ?) ORDER BY `lastUpdate` DESC LIMIT 1", [req.params.token], (er3, r3) => {
					console.log(r3[0]);
					tmp.lastsession = r3[0];
					res.send(tmp);
				});
			} else {
				res.send(tmp);
			}
		});
	});
});
appHTTP.post("/mainStatsFrames/:token", (req, res) => {
	if(!req.params.token){
		res.send({error: "Invalid token"});
		return;
	}
	let tmp = {own: 0, all: 0};
	db.query("SELECT COUNT(*) as 'i' FROM `frames`", (er, r) => {
		tmp.all = r[0].i;
		if(req.body.haveSessions){
			db.query("SELECT COUNT(*) as 'i' FROM `frames` WHERE `session_id` IN (SELECT `session_id` FROM `sesje` WHERE `user_id` = (SELECT `id` FROM `konta` WHERE `token` = ?))", [req.params.token], (er2, r2) => {
				if(er2){
					console.log(er2);
				} else {
					tmp.own = r2[0].i;
				}
				res.send(tmp);
				return;
			});
		} else {
			res.send(tmp);
			return;
		}
	})
});
appHTTP.post("/setups/:token", (req, res) => {
	if(!req.params.token){
		res.send({error: "Invalid token"});
		return;
	}
	db.query("SELECT `setups`.`id` as 'id', `setups`.`track` as 'track', `setups`.`car` as 'car', `setups`.`weather` as 'weather', `setups`.`created` as 'created', `setups`.`type` as 'type', `konta`.`login` as 'login', `konta`.`avatar` as 'avatar' FROM `setups` LEFT JOIN `konta` ON `setups`.`author` = `konta`.`id` WHERE `author` = (SELECT `id` FROM `konta` WHERE `token` = ?) OR `public` = 1", [req.params.token], (er, r) => {
		if(er){
			res.send({error: "Database error"});
			return;
		}
		if(r.length > 0){
			let tmp = [];
			r.forEach((w) => {
				tmp.push(w);
			});
			res.send({data: tmp, error: null});
			return;
		} else {
			res.send({data: null, error: "No setups available to show."});
			return;
		}
	});
});
appHTTP.post("/setup/:token/:setupId", (req, res) => {
	if(!req.params.token){
		res.send({error: "Invalid token"});
		return;
	}
	db.query("SELECT * FROM `setups` WHERE `id` = ? AND (`public` = 1 OR `author` = (SELECT `id` FROM `konta` WHERE `token` = ?))", [req.params.setupId, req.params.token], (er, r) => {
		if(er){
			res.send({error: "Database error "+er.errno});
			return;
		}
		if(r.length > 0){
			res.send({data: r[0]});
			return;
		} else {
			res.send({error: "You don't have access to that car setup."});
			return;
		}
	});
});
appHTTP.post("/deleteSetup/:token/:setupId", (req, res) => {
	if(!req.params.token){
		res.send({error: "Invalid token."});
		return;
	}
	db.query("DELETE FROM `setups` WHERE `id` = ? AND `author` = (SELECT `id` FROM `konta` WHERE `token` = ?)", [req.params.setupId, req.params.token], (er, r) => {
		if(er){
			console.log(er);
			res.send({error: "Database error "+er.errno});
			return;
		}
		if(r.affectedRows > 0){
			res.send({odp: "Deleted"});
			return;
		} else {
			res.send({error: "You don't have permission to delete that setup."});
			return;
		}
	});
});
appHTTP.post("/updateSetup/:token/:setupId", (req, res) => {
	if(!req.params.token){
		res.send({error: "Invalid token."});
		return;
	}
	db.query("UPDATE `setups` SET `type` = ?, `track` = ?, `car` = ?, `weather` = ?, `wingF` = ?, `wingR` = ?, `diffOn` = ?, `diffOff` = ?, `camberF` = ?, `camberR` = ?, `toeF` = ?, `toeR` = ?, `susF` = ?, `susR` = ?, `barF` = ?, `barR` = ?, `heightF` = ?, `heightR` = ?, `brakeP` = ?, `brakeB` = ?, `tireFR` = ?, `tireFL` = ?, `tireRR` = ?, `tireRL` = ?, `public` = ?, `fuel` = ? WHERE `id` = ? AND `author` = (SELECT `id` FROM `konta` WHERE `token` = ?)", [req.body.type, req.body.track, req.body.car, req.body.weather, req.body.wingF, req.body.wingR, req.body.diffOn, req.body.diffOff, req.body.camberF, req.body.camberR, req.body.toeF, req.body.toeR, req.body.susF, req.body.susR, req.body.barF, req.body.barR, req.body.heightF, req.body.heightR, req.body.brakeP, req.body.brakeB, req.body.tireFR, req.body.tireFL, req.body.tireRR, req.body.tireRL, req.body.public, req.body.fuel, req.params.setupId, req.params.token], (er, r) => {
		if(er){
			console.log(er);
			res.send({error: "Something went wrong. Your setup was not updated."});
			return;
		}
		if(r.affectedRows > 0){
			res.send({odp: "Setup succesfully updated."});
			return;
		} else {
			res.send({error: "You don't have permission to change this setup."});
			return;
		}
	})
});
appHTTP.post("/createSetup/:token", (req, res) => {
	if(!req.params.token){
		res.send({error: "Invalid token."});
		return;
	}
	db.query("INSERT INTO `setups` (`author`, `type`, `track`, `car`, `weather`, `wingF`, `wingR`, `diffOn`, `diffOff`, `camberF`, `camberR`, `toeF`, `toeR`, `susF`, `susR`, `barF`, `barR`, `heightF`, `heightR`, `brakeP`, `brakeB`, `tireFR`, `tireFL`, `tireRR`, `tireRL`, `public`, `fuel`) VALUES ((SELECT `id` FROM `konta` WHERE `token` = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [req.params.token, req.body.type, req.body.track, req.body.car, req.body.weather, req.body.wingF, req.body.wingR, req.body.diffOn, req.body.diffOff, req.body.camberF, req.body.camberR, req.body.toeF, req.body.toeR, req.body.susF, req.body.susR, req.body.barF, req.body.barR, req.body.heightF, req.body.heightR, req.body.brakeP, req.body.brakeB, req.body.tireFR, req.body.tireFL, req.body.tireRR, req.body.tireRL, req.body.public, req.body.fuel], (er, r) => {
		if(er){
			console.log(er);
			res.send({error: "Something went wrong. Your setup was not created."});
			return;
		}
		if(r.affectedRows > 0){
			res.send({odp: r.insertId});
			return;
		}
	})
});

/* Parsery */
const headerParser = new Parser().endianness("little").uint16le("m_packetFormat").uint8("m_gameMajorVersion").uint8("m_gameMinorVersion").uint8("m_packetVersion").uint8("m_packetId").uint64le("m_sessionUID").floatle("m_sessionTime").uint32le("m_frameIdentifier").uint8("m_playerCarIndex").uint8("m_secondaryPlayerCarIndex");
const uszkodzeniaDataParser = new Parser().endianness("little").array("m_tyresWear", { length: 4, type: new Parser().floatle("") }).array("m_tyresDamage", { length: 4, type: new Parser().uint8("") }).array("m_brakesDamage", { length: 4, type: new Parser().uint8("") }).uint8("m_frontLeftWingDamage").uint8("m_frontRightWingDamage").uint8("m_rearWingDamage").uint8("m_floorDamage").uint8("m_diffuserDamage").uint8("m_sidepodDamage").uint8("m_drsFault").uint8("m_ersFault").uint8("m_gearBoxDamage").uint8("m_engineDamage").uint8("m_engineMGUHWear").uint8("m_engineESWear").uint8("m_engineCEWear").uint8("m_engineICEWear").uint8("m_engineMGUKWear").uint8("m_engineTCWear").uint8("m_engineBlown").uint8("m_engineSeized");
const statusPojazduDataParser = new Parser().endianness("little").uint8("m_tractionControl").uint8("m_antiLockBrakes").uint8("m_fuelMix").uint8("m_frontBrakeBias").uint8("m_pitLimiterStatus").floatle("m_fuelInTank").floatle("m_fuelCapacity").floatle("m_fuelRemainingLaps").uint16le("m_maxRPM").uint16le("m_idleRPM").uint8("m_maxGears").uint8("m_drsAllowed").uint16le("m_drsActivationDistance").uint8("m_actualTyreCompound").uint8("m_visualTyreCompound").uint8("m_tyresAgeLaps").int8("m_vehicleFiaFlags").floatle("m_ersStoreEnergy").uint8("m_ersDeployMode").floatle("m_ersHarvestedThisLapMGUK").floatle("m_ersHarvestedThisLapMGUH").floatle("m_ersDeployedThisLap").uint8("m_networkPaused");
const telemetriaDataParser = new Parser().endianness("little").uint16le("m_speed").floatle("m_throttle").floatle("m_steer").floatle("m_brake").uint8("m_clutch").int8("m_gear").uint16le("m_engineRPM").uint8("m_drs").uint8("m_revLightsPercent").uint16le("m_revLightsBitValue").array("m_brakesTemperature", {length: 4,	type: new Parser().uint16le("")}).array("m_tyresSurfaceTemperature", {length: 4, type: new Parser().uint8("")}).array("m_tyresInnerTemperature", {length: 4, type: new Parser().uint8("")}).uint16le("m_engineTemperature").array("m_tyresPressure", { length: 4, type: new Parser().floatle("") }).array("m_surfaceType", { length: 4, type: new Parser().uint8("") });
const uczestnikDataParser = new Parser().endianness("little").uint8("m_aiControlled").uint8("m_driverId").uint8("m_networkId").uint8("m_teamId").uint8("m_myTeam").uint8("m_raceNumber").uint8("m_nationality").string("m_name", { length: 48, stripNull: true }).uint8("m_yourTelemetry");
const carMotionDataParser = new Parser().endianness("little").floatle("m_worldPositionX").floatle("m_worldPositionY").floatle("m_worldPositionZ").floatle("m_worldVelocityX").floatle("m_worldVelocityy").floatle("m_worldVelocityZ").uint16le("m_worldForwardDirX").uint16le("m_worldForwardDirY").uint16le("m_worldForwardDirZ").uint16le("m_worldRightDirX").uint16le("m_worldRightDirY").uint16le("m_worldRightDirZ").floatle("m_gForceLateral").floatle("m_gForceLongitudinal").floatle("m_gForceVertical").floatle("m_yaw").floatle("m_pitch").floatle("m_roll");
const lapDataParser = new Parser().endianness("little").uint32le("m_lastLapTimeInMS").uint32le("m_currentLapTimeInMS").uint16le("m_sector1TimeInMS").uint16le("m_sector2TimeInMS").floatle("m_lapDistance").floatle("m_totalDistance").floatle("m_safetyCarDelta").uint8("m_carPosition").uint8("m_currentLapNum").uint8("m_pitStatus").uint8("m_numPitStops").uint8("m_sector").uint8("m_currentLapInvalid").uint8("m_penalties").uint8("m_warnings").uint8("m_numUnservedDriveThroughPens").uint8("m_numUnservedStopGoPens").uint8("m_gridPosition").uint8("m_driverStatus").uint8("m_resultStatus").uint8("m_pitLaneTimerActive").uint16le("m_pitLaneTimeInLaneInMS").uint16le("m_pitStopTimerInMS").uint8("m_pitStopShouldServePen");
const MarshalZoneParser = new Parser().endianness("little").floatle('m_zoneStart').int8('m_zoneFlag');
const WeatherForecastSampleParser = new Parser().endianness("little").uint8('m_sessionType').uint8('m_timeOffset').uint8('m_weather').int8('m_trackTemperature').int8('m_trackTemperatureChange').int8('m_airTemperature').int8('m_airTemperatureChange').uint8('m_rainPercentage');

/* główne dane są wysyłane cały czas co jakiś czas z jakąś cząsteczką informacji,
a wystarczy nam około 5-10 pakietów by miec kompletne główne dane, reszta jest zbędna i tylko obciąża baze danych INSERT/UPDATE */
let temporarySessionIds = { };
//przechowywanie wartosci pogody dla okrazenia dla sesji
let weatherLapSession = {};
const singleRecord = ["carId", "trackId", "sessionType"];
const bufforData = new cache();
const przechowujSesje = async (id, ramka, typdanych, daneIn, adresIP) => {
	bufforData.set(`${id}-${ramka}-${typdanych}-${adresIP}`, [id, ramka, typdanych, daneIn, adresIP]);
};

const zapiszDaneSesji = async (id, ramka, typdanych, daneIn, adresIP) => {
	if(singleRecord.includes(typdanych)){
		if(temporarySessionIds[id]) { temporarySessionIds[id] = temporarySessionIds[id] + 1; }
		else { temporarySessionIds[id] = 1; }
		if(temporarySessionIds[id] > 10){
			return;
		}
		console.log(id, typdanych, daneIn);
		db.query(`INSERT INTO sesje (session_id, ip, ${typdanych}, user_id) VALUES (?, ?, ?, (SELECT id FROM konta WHERE ip = ?)) ON DUPLICATE KEY UPDATE ${typdanych} = ?`, [id, adresIP, daneIn, adresIP, daneIn], (er2, r2) => {
			if(!er2){
				if(r2.affectedRows < 1){
					console.log("Niedodano sesji", id);
				}
			} else {
				{ console.log("BŁĄD DODAWANIA SESJI", er2);}
			}
		});
	} else {
		/* TODO: DODAĆ TIMESTAMP DO RAMEK I POZNIEJ USUWAC DUPLIKATY O STARSZEJ DACIE */
		db.query("INSERT INTO frames (session_id, frame, data_type, data) VALUES (?, ?, ?, ?)", [id, ramka, typdanych, zlib.deflateRawSync(JSON.stringify(daneIn)).toString('base64')], (er2, r2) => {
			if(!er2){
				if(r2.affectedRows < 1){
					console.log("Nie zapisano ramki", ramka, "sesji", id);
				}
			} else { console.log("BŁĄD DODAWANIA RAMKI", er2);}
		});
	}
};

// "OCZYSZCZANIE" CACHE, (DANE LĄDUJĄ POWOLUTKU DO BAZY DANYCH)
setInterval(() => {
	let queryLimit = 4000; //limit operacji bazy danych w interwale
	let x = 0;
	bufforData.keys() && bufforData.keys().map((key) => {
		if(x >= queryLimit) return;
		const v = bufforData.take(key);
		zapiszDaneSesji(v[0], v[1], v[2], v[3], v[4]);
		x = x + 1;
	});
	(x !== 0) && console.log("Zapisano", x, " danych z buffora");
}, 30 * 1000); //30sec

serverUDP.on("error", (er) => {
	console.log("Error: ", er);
	serverUDP.close();
});

let poprzedniNumerOkrazenia = {};

serverUDP.on("message", (msg, info) => {
	switch (msg.byteLength) {
		//MOTION:
		case 1464:
			let motionParser = new Parser().endianness("little").nest("m_header", { type: headerParser }).array("m_carMotionData", { length: 22, type: carMotionDataParser }).parse(msg);
			const motion = motionParser.m_carMotionData[motionParser.m_header.m_playerCarIndex];
			let daneMotion = {
				pozycjaX: motion.m_worldPositionX,
				pozycjaY: motion.m_worldPositionY,
				pozycjaZ: motion.m_worldPositionZ,
				gLateral: motion.m_gForceLateral,
				gLong: motion.m_gForceLongitudinal,
				gVert: motion.m_gForceVertical,
			};
			powiazaniaIP[info.address] && io.emit(powiazaniaIP[info.address], {daneMotion: daneMotion});
			przechowujSesje(
				motionParser.m_header.m_sessionUID,
				motionParser.m_header.m_frameIdentifier,
				"daneMotion",
				daneMotion,
				info.address
			);
			break;
		//EVENTY:
		case 40:
			let eventParser = new Parser().endianness("little").nest("m_header", { type: headerParser }).string("m_eventStringCode", { length: 4 });
			const typEventu = eventParser.parse(msg);
			switch (typEventu.m_eventStringCode) {
				case "SSTA":
					//console.log("EVENT: Sesja rozpoczeta");
					break;
				case "SEND":
					//console.log("EVENT: Sesja zakonczona");
					break;
				case "FTLP":
					const ftlp = eventParser.nest("FastestLap", {
						type: new Parser()
							.endianness("little")
							.uint8("vehicleIdx")
							.floatle("lapTime"),
					});
					//console.log("EVENT: Najszybsze okrazenie");
					//console.log(ftlp.next.parse(msg));
					break;
				case "RTMT":
					const rtmt = eventParser.nest("Retirement", {
						type: new Parser()
							.endianness("little")
							.uint8("vehicleIdx"),
					});
					//console.log("EVENT: Opuszczenie sesji");
					//console.log(rtmt.next.parse(msg));
					break;
				case "DRSE":
					console.log("EVENT: DRS Włączony");
					break;
				case "DRSD":
					console.log("EVENT: DRS Wyłączony");
					break;
				case "TMPT":
					const tmpt = eventParser.nest("TeamMateInPits", {
						type: new Parser()
							.endianness("little")
							.uint8("vehicleIdx"),
					});
					//console.log("EVENT: Kolega w pitstopie");
					//console.log(tmpt.next.parse(msg));
					break;
				case "CHQF":
					console.log("EVENT: Flaga końcowa");
					break;
				case "RCWN":
					const rcwn = eventParser.nest("RaceWinner", {
						type: new Parser()
							.endianness("little")
							.uint8("vehicleIdx"),
					});
					//console.log("EVENT: Zwycięzca wyscigu");
					//console.log(rcwn.next.parse(msg).RaceWinner);
					break;
				case "PENA":
					const pena = eventParser.nest("Penalty", {
						type: new Parser()
							.endianness("little")
							.uint8("penaltyType")
							.uint8("infringementType")
							.uint8("vehicleIdx")
							.uint8("otherVehicleIdx")
							.uint8("time")
							.uint8("lapNum")
							.uint8("placesGained"),
					});
					//console.log("EVENT: Nałożona kara");
					//console.log(pena.next.parse(msg).Penalty);
					break;
				case "SPTP":
					const sptp = eventParser.nest("SpeedTrap", {
						type: new Parser()
							.endianness("little")
							.uint8("vehicleIdx")
							.floatle("speed")
							.uint8("isOverallFastestInSession")
							.uint8("isDriverFastestInSession")
							.uint8("fastestVehicleIdxInSession")
							.floatle("fastestSpeedInSession"),
					});
					//console.log("EVENT: Speed trap has been triggered by fastest speed");
					//console.log(sptp.next.parse(msg).SpeedTrap);
					break;
				case "STLG":
					const stlg = eventParser.nest("StartLIghts", {
						type: new Parser()
							.endianness("little")
							.uint8("numLights"),
					});
					//console.log("EVENT: Swiatla startowe");
					//console.log(stlg.next.parse(msg));
					break;
				case "LGOT":
					console.log("EVENT: Zielone swiatla - Wyscig!");
					break;
				case "DTSV":
					const dtsv = eventParser.nest("DriveThroughPenaltyServed", {
						type: new Parser()
							.endianness("little")
							.uint8("vehicleIdx"),
					});
					//console.log("EVENT: Kara przejazdu wykonana");
					//console.log(dtsv.next.parse(msg));
					break;
				case "SGSV":
					const sgsv = eventParser.nest("StopGoPenaltyServed", {
						type: new Parser()
							.endianness("little")
							.uint8("vehicleIdx"),
					});
					//console.log("EVENT: Kara czasowa w pitstopie wykonana");
					//console.log(sgsv.next.parse(msg).StopGoPenaltyServed);
					break;
				case "FLBK":
					const flbk = eventParser.nest("Flashback", {
						type: new Parser()
							.endianness("little")
							.uint32le("flashbackFrameIdentifier")
							.floatle("flashbackSessionTime"),
					});
					//console.log("EVENT: Użycie flashbacka");
					//console.log(flbk.next.parse(msg).Flashback);
					break;
				case "BUTN":
					const butn = eventParser.nest("Buttons", {
						type: new Parser()
							.endianness("little")
							.uint32le("m_buttonStatus"),
					});
					//console.log(`EVENT: Wcisniecie przycisku ${butn.next.parse(msg).Buttons.m_buttonStatus}`);
					break;
			}
			break;
		
		//HISTORIA SESJI:
		case 1155:
			//console.log("Historia sesji");
			break;
		//USZKODZENIA
		case 948:
			let uszkodzeniaParser = new Parser().endianness("little").nest("m_header", { type: headerParser }).array("m_carDamageData", { length: 22, type: uszkodzeniaDataParser }).parse(msg);
			//console.log("Uszkodzenie pojazdu");
			//console.log(uszkodzeniaParser.parse(msg).m_carDamageData);
			const usz =	uszkodzeniaParser.m_carDamageData[uszkodzeniaParser.m_header.m_playerCarIndex];
			let uszkodzenia = {
				zuzycieRL: usz.m_tyresWear[0],
				zuzycieRR: usz.m_tyresWear[1],
				zuzycieFL: usz.m_tyresWear[2],
				zuzycieFR: usz.m_tyresWear[3],
				uszRL: usz.m_tyresDamage[0],
				uszRR: usz.m_tyresDamage[1],
				uszFL: usz.m_tyresDamage[2],
				uszFR: usz.m_tyresDamage[3],
				skrzydloFL: usz.m_frontLeftWingDamage,
				skrzydloFR: usz.m_frontRightWingDamage,
				skrzydloTyl: usz.m_rearWingDamage,
				podloga: usz.m_floorDamage,
				dyfuzor: usz.m_diffuserDamage,
				sidepod: usz.m_sidepodDamage,
				usterkaDRS: usz.m_drsFault,
				usterkaERS: usz.m_ersFault,
				skrzynia: usz.m_gearBoxDamage,
				silnik: usz.m_engineDamage,
				zuzycieMGUH: usz.m_engineMGUHWear,
				zuzycieES: usz.m_engineESWear,
				zuzycieCE: usz.m_engineCEWear,
				zuzycieICE: usz.m_engineICEWear,
				zuzycieMGUK: usz.m_engineMGUKWear,
				zuzycieTC: usz.m_engineTCWear,
				wybuchSilnik: usz.m_engineBlown,
				zatartySilnik: usz.m_engineSeized
			};
			powiazaniaIP[info.address] && io.emit(powiazaniaIP[info.address], {uszkodzenia: uszkodzenia});
			przechowujSesje(
				uszkodzeniaParser.m_header.m_sessionUID,
				uszkodzeniaParser.m_header.m_frameIdentifier,
				"uszkodzenia",
				uszkodzenia,
				info.address
			);
			break;
		
		//INFO LOBBY - ZBĘDNE
		case 1191:
			//console.log("Info o lobby");
			break;
		//KLASYFIKACJA - ZBĘDNE
		case 1015:
			//console.log("Klasyfikacja");
			break;
		
		//STATUS POJAZDU
		case 1058:
			const statusPojazduParser = new Parser().endianness("little").nest("m_header", { type: headerParser }).array("m_carStatusData", { length: 22, type: statusPojazduDataParser }).parse(msg);
			//console.log("Status pojazdu");
			const s = statusPojazduParser.m_carStatusData[statusPojazduParser.m_header.m_playerCarIndex];
			let statusPojazdu = {
				trakcja: s.m_tractionControl,
				abs: s.m_antiLockBrakes,
				trybPaliwo: s.m_fuelMix,
				balansHamulca: s.m_frontBrakeBias,
				pitLimiter: s.m_pitLimiterStatus,
				paliwoTank: s.m_fuelInTank,
				paliwoMax: s.m_fuelCapacity,
				paliwoOkr: s.m_fuelRemainingLaps,
				obrotyMax: s.m_maxRPM,
				obrotyJalowe: s.m_idleRPM,
				dostepDRS: s.m_drsAllowed,
				dystansDRS: s.m_drsActivationDistance,
				typOpon: s.m_actualTyreCompound,
				typOponWizualne: s.m_visualTyreCompound,
				oponyOkrazenia: s.m_tyresAgeLaps,
				flaga: s.m_vehicleFiaFlags,
				dostepnyERS: s.m_ersStoreEnergy,
				trybERS: s.m_ersDeployMode,
				zebranyERSmguk: s.m_ersHarvestedThisLapMGUK,
				zebranyERSmguh: s.m_ersHarvestedThisLapMGUH,
				wykorzystanyERS: s.m_ersDeployedThisLap,
				pauzaSieciowa: s.m_networkPaused
			};
			powiazaniaIP[info.address] && io.emit(powiazaniaIP[info.address], {statusPojazdu: statusPojazdu});
			przechowujSesje(
				statusPojazduParser.m_header.m_sessionUID,
				statusPojazduParser.m_header.m_frameIdentifier,
				"statusPojazdu",
				statusPojazdu,
				info.address
			);
			break;
		//TELEMETRIA
		case 1347:
			const telemetriaParser = new Parser().endianness("little").nest("m_header", { type: headerParser }).array("m_carTelemetryData", { length: 22, type: telemetriaDataParser })
				.uint8("m_mfdPanelIndex").uint8("m_mfdPanelIndexSecondaryPlayer").int8("m_suggestedGear").parse(msg);
			//console.log("Telemetria pojazdu");
			let t = telemetriaParser.m_carTelemetryData[telemetriaParser.m_header.m_playerCarIndex];
			let telemetria = {
				aktywowanyDRS: t.m_drs,
				predkosc: t.m_speed,
				gaz: t.m_throttle,
				kierownica: t.m_steer,
				hamulec: t.m_brake,
				sprzeglo: t.m_clutch,
				bieg: t.m_gear,
				obroty: t.m_engineRPM,
				hamulecRL: t.m_brakesTemperature[0],
				hamulecRR: t.m_brakesTemperature[1],
				hamulecFL: t.m_brakesTemperature[2],
				hamulecFR: t.m_brakesTemperature[3],
				outRL: t.m_tyresSurfaceTemperature[0],
				outRR: t.m_tyresSurfaceTemperature[1],
				outFL: t.m_tyresSurfaceTemperature[2],
				outFR: t.m_tyresSurfaceTemperature[3],
				inRL: t.m_tyresInnerTemperature[0],
				inRR: t.m_tyresInnerTemperature[1],
				inFL: t.m_tyresInnerTemperature[2],
				inFR: t.m_tyresInnerTemperature[3],
				temperaturaSilnika: t.m_engineTemperature,
				cisnienieRL: t.m_tyresPressure[0],
				cisnienieRR: t.m_tyresPressure[1],
				cisnienieFL: t.m_tyresPressure[2],
				cisnienieFR: t.m_tyresPressure[3],
				nawierzchniaRL: t.m_surfaceType[0],
				nawierzchniaRR: t.m_surfaceType[1],
				nawierzchniaFL: t.m_surfaceType[2],
				nawierzchniaFR: t.m_surfaceType[3],
				sugerowanyBieg: telemetriaParser.m_suggestedGear
			}
			powiazaniaIP[info.address] && io.emit(powiazaniaIP[info.address], { telemetria: telemetria});
			przechowujSesje(
				telemetriaParser.m_header.m_sessionUID,
				telemetriaParser.m_header.m_frameIdentifier,
				"telemetria",
				telemetria,
				info.address
			);
			//console.log("TELEMETRIA", telemetria);
			break;
		
		//KONFIGURACJA POJAZDU
		case 1102:
			//console.log("Konfiguracja pojazdu");
			break;
		//UCZESTNICY
		case 1257:
			//console.log("Uczestnicy");
			const uczestnicyParser = new Parser().endianness("little").nest("m_header", { type: headerParser }).uint8("m_numActiveCars").array("m_participants", { length: 22, type: uczestnikDataParser }).parse(msg);
			const car = uczestnicyParser.m_participants[uczestnicyParser.m_header.m_playerCarIndex].m_teamId;
			przechowujSesje(
				uczestnicyParser.m_header.m_sessionUID,
				uczestnicyParser.m_header.m_frameIdentifier,
				"carId",
				car,
				info.address
			);
			break;
		
		//DANE OKRĄŻENIA
		case 972:
			//console.log("Dane okrążenia");
			let lapParser = new Parser().endianness("little").nest("m_header", { type: headerParser }).array("m_lapData", { length: 22, type: lapDataParser }).uint8("m_timeTrialPBCarIdx").uint8("m_timeTrialRivalCarIdx").parse(msg);
			const lap = lapParser.m_lapData[lapParser.m_header.m_playerCarIndex];
			let daneOkrazenia = {
				ostatnieOkr: lap.m_lastLapTimeInMS,
				aktualneOkr: lap.m_currentLapTimeInMS,
				sektor1: lap.m_sector1TimeInMS,
				sektor2: lap.m_sector2TimeInMS,
				aktualnaPozycja: lap.m_carPosition,
				poprzedniNumerOkrazenia: poprzedniNumerOkrazenia[lapParser.m_header.m_sessionUID] ? poprzedniNumerOkrazenia[lapParser.m_header.m_sessionUID] : 0,
				numerOkrazenia: lap.m_currentLapNum,
				anulowaneOkrazenie: lap.m_currentLapInvalid,
				lapDistance: lap.m_lapDistance
			};
			powiazaniaIP[info.address] && io.emit(powiazaniaIP[info.address], {daneOkrazenia: daneOkrazenia});
			poprzedniNumerOkrazenia[lapParser.m_header.m_sessionUID] = daneOkrazenia.numerOkrazenia;
			przechowujSesje(
				lapParser.m_header.m_sessionUID,
				lapParser.m_header.m_frameIdentifier,
				"daneOkrazenia",
				daneOkrazenia,
				info.address
			);
			break;
		//DANE SESJI np. TOR, POGODA, JAKA SESJA, JAKI BOLID
		case 632:
			//console.log("Sesja");
			const sesjaParser = new Parser().endianness('little').nest('m_header', {type: headerParser}).uint8('m_weather').int8('m_trackTemperature').int8('m_airTemperature').uint8('m_totalLaps').uint16le('m_trackLength').uint8('m_sessionType').int8('m_trackId').uint8('m_formula').uint16le('m_sessionTimeLeft').uint16le('m_sessionDuration').uint8('m_pitSpeedLimit').uint8('m_gamePaused').uint8('m_isSpectating').uint8('m_spectatorCarIndex').uint8('m_sliProNativeSupport').uint8('m_numMarshalZones').array('m_marshalZones', {length: 21, type: MarshalZoneParser}).uint8('m_safetyCarStatus').uint8('m_networkGame').uint8('m_numWeatherForecastSamples').array('m_weatherForecastSamples', {length: 56, type: WeatherForecastSampleParser}).uint8('m_forecastAccuracy').uint8('m_aiDifficulty').uint32le('m_seasonLinkIdentifier').uint32le('m_weekendLinkIdentifier').uint32le('m_sessionLinkIdentifier').uint8('m_pitStopWindowIdealLap').uint8('m_pitStopWindowLatestLap').uint8('m_pitStopRejoinPosition').uint8('m_steeringAssist').uint8('m_brakingAssist').uint8('m_gearboxAssist').uint8('m_pitAssist').uint8('m_pitReleaseAssist').uint8('m_ERSAssist').uint8('m_DRSAssist').uint8('m_dynamicRacingLine').uint8('m_dynamicRacingLineType').uint8('m_gameMode').uint8('m_ruleSet').uint32le('m_timeOfDay').uint8('m_sessionLength').parse(msg);
			let tmpW = false;
			if(!weatherLapSession[sesjaParser.m_header.m_sessionUID]){
				weatherLapSession[sesjaParser.m_header.m_sessionUID] = {
					'id': sesjaParser.m_weather,
					't': sesjaParser.m_trackTemperature,
					'air': sesjaParser.m_airTemperature
				};
				tmpW = true;
			}
			if(!weatherLapSession[sesjaParser.m_header.m_sessionUID].id != sesjaParser.m_weather){
				weatherLapSession[sesjaParser.m_header.m_sessionUID].id = sesjaParser.m_weather;
				tmpW = true;
			}
			if(!weatherLapSession[sesjaParser.m_header.m_sessionUID].t != sesjaParser.m_trackTemperature){
				weatherLapSession[sesjaParser.m_header.m_sessionUID].t = sesjaParser.m_trackTemperature;
				tmpW = true;
			}
			if(!weatherLapSession[sesjaParser.m_header.m_sessionUID].air != sesjaParser.m_airTemperature){
				weatherLapSession[sesjaParser.m_header.m_sessionUID].air = sesjaParser.m_airTemperature;
				tmpW = true;
			}
			tmpW && przechowujSesje(
				sesjaParser.m_header.m_sessionUID,
				sesjaParser.m_header.m_frameIdentifier,
				"weather",
				weatherLapSession[sesjaParser.m_header.m_sessionUID]
			);
			przechowujSesje(
				sesjaParser.m_header.m_sessionUID,
				sesjaParser.m_header.m_frameIdentifier,
				"trackId",
				sesjaParser.m_trackId, info.address
			);
			przechowujSesje(
				sesjaParser.m_header.m_sessionUID,
				sesjaParser.m_header.m_frameIdentifier,
				"sessionType",
				sesjaParser.m_sessionType, info.address
			);
			/* TODO: DODAC POGODOWE RZECZY I SUGEROWANIE PITSTOPOW 
			przechowujSesje(
				sesjaParser.m_header.m_sessionUID,
				sesjaParser.m_header.m_frameIdentifier,
				"sessionPacket",
				track, info.address
			); */
			break;
		
		default:
			console.log("Nieznany pakiet");
			break;
	}
});
serverUDP.on("listening", () => {
	const adr = serverUDP.address();
	const port = adr.port;
	const family = adr.family;
	const ipadr = adr.address;
	console.log("Serwer UDP: ", ipadr, ":", port, " Typ: ", family);
});
serverUDP.on("close", () => {
	console.log("Socket zamkniety!");
});
serverUDP.bind(portUDP);
serverHTTP.listen(portHTTP, () => {
	console.log(`Serwer HTTP: http://localhost:${portHTTP}`);
});
