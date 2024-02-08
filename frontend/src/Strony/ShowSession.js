import gb from "../GlobalVars.js";
import Nawigacja from "../Nawigacja.js";
import { useParams } from "react-router-dom";
import Axios from "axios";
import { useState, useRef } from "react";
import LoadingIndicator from "../Components/LoadingIndicator.js";
import { AreaChart, XAxis, YAxis, CartesianGrid, Area, Tooltip, ResponsiveContainer } from "recharts";
import { CgArrowRight } from "react-icons/cg";
import { RiCheckboxMultipleBlankFill, RiCheckboxMultipleBlankLine, RiSwordLine, RiBarChart2Fill } from "react-icons/ri";
import { WiDaySunny, WiDaySunnyOvercast, WiCloud, WiShowers, WiRain, WiThunderstorm, WiNa} from "react-icons/wi";

export default function ShowSessions(props){
	const {sessionId} = useParams();
	const [chartsLap, setChartsLap ] = useState(null);
	const [refLapId, setRefLapId] = useState(localStorage.getItem("referenceLap") ? JSON.parse(localStorage.getItem("referenceLap")).id : null);
	const [session, setSession] = useState({data: null, checkOwn: false, isChecking: false});
	const [blad, setBlad] = useState(false);
	const initFrameNumber = useRef(null);
	const canvasRef = useRef(null);
	const imgRef = useRef(null);
	const dpr = window.devicePixelRatio;
	document.title = `TrackVision - Session ${sessionId}`;

	if(!sessionId){
		window.location.href = "/sessions";
	}

	const wyswietlBlad = (text) => {
		return(
			<div className="confirmationPopupBg">
				<div className="showSessionError">
					<span>{text}</span>
					<div>
						<button onClick={() => {
							setChartsLap(null);
							setBlad(false);
						}}>Understood!</button>
						<button onClick={() => {
							localStorage.removeItem('referenceLap');
							setRefLapId(null);
							setChartsLap(null);
							setBlad(false);
						}}>Remove Reference</button>
					</div>
				</div>
			</div>
		)
	}

	const drawPosition = (frame) => {
		if(frame){
			if(!session.data[frame].daneMotion) return;
			if(!session.data[frame].daneMotion.pozycjaX || !session.data[frame].daneMotion.pozycjaZ) return;
			const posX = session.data[frame].daneMotion.pozycjaX;
			const posY = session.data[frame].daneMotion.pozycjaZ;
			const canvasX = imgRef.current.width;
			const canvasY = imgRef.current.height;
			const ctx = canvasRef.current.getContext('2d');
			ctx.scale(dpr, dpr);
			ctx.clearRect(0,0,canvasX*1.1, canvasY*1.1);
			ctx.beginPath();

			let [correctX, correctY, viewX, viewY] = gb.minimapMappings[session.track];
			// (pozycja + poczatekTrack) / koniecTrack  = jakis %
			// jakis % * rozdzielczosc canvy
			let tmpX = (posX+correctX)/viewX*canvasX;
			let tmpY = (posY+correctY)/viewY*canvasY;
			ctx.arc(tmpX-3, tmpY-3, 6, 0, 6*Math.PI);
			ctx.fillStyle = "#ffffff";
			ctx.fill();
			ctx.closePath();
		}
	};

	const setImgRef = (ref) => {
		if(!ref || imgRef.current){ return }
		imgRef.current = ref;
		//canvas o dużych wymiarach podczas rysowania figur powodują że są one zblurowane, a pixele są rozjechane
		//zmienna dpr ma za zadanie sfixować ten błąd
		const rect = imgRef.current.getBoundingClientRect();
		imgRef.current.width = rect.width * dpr ;
		imgRef.current.height = rect.height * dpr;
	}

	const setCanvasRef = (ref) => {
		if(!ref || canvasRef.current){ return }
		canvasRef.current = ref;
		const img = imgRef.current.getBoundingClientRect();
		const px = Math.max(...[img.width, img.height]);
		canvasRef.current.style.width = `${px}+px`;
		canvasRef.current.style.height = `${px}+px`;
		canvasRef.current.width = px * dpr;
		canvasRef.current.height = px * dpr;
	};

	const CustomToolTip = ({ active, payload, label }) => {
		if (!payload.length) return;
		return(
			<div className="customTooltip">
				<h1>Lap distance {label}m</h1>
				{["speed"].includes(payload[0].name) && (payload[0].payload.speed != undefined) && <span>Speed: {payload[0].payload.speed}km/h</span>}
				{["speedRef"].includes(payload[0].name) && (payload[0].payload.speedRef != undefined) && <span>Reference Speed: {payload[0].payload.speedRef}km/h</span>}
				{["brake", "throttle"].includes(payload[0].name) && (payload[0].payload.brake != undefined) && <span>Brake: {parseInt(payload[0].payload.brake)}%</span>}
				{["brakeRef", "throttleRef"].includes(payload[0].name) && (payload[0].payload.brakeRef != undefined) && <span>Reference Brake: {parseInt(payload[0].payload.brakeRef)}%</span>}
				{["brake", "throttle"].includes(payload[0].name) && (payload[0].payload.throttle != undefined) && <span>Throttle: {parseInt(payload[0].payload.throttle)}%</span>}
				{["brakeRef", "throttleRef"].includes(payload[0].name) && (payload[0].payload.throttleRef != undefined) && <span>Reference Throttle: {parseInt(payload[0].payload.throttleRef)}%</span>}
				{["steering"].includes(payload[0].name) && (payload[0].payload.steering != undefined) && <span>Steering: {parseFloat(payload[0].payload.steering).toFixed(3)}</span>}
				{["steeringRef"].includes(payload[0].name) && (payload[0].payload.steeringRef != undefined) && <span>Reference Steering: {parseFloat(payload[0].payload.steeringRef).toFixed(3)}</span>}

				{/* {["time", "timeRef", "delta"].includes(payload[0].name) && (payload[0].payload.time != undefined) && <span>Compared Lap Time Delta to Reference Lap Time: {gb.lapTimeFormat(payload[0].payload.time, false)}</span>} */}
				{["time"].includes(payload[0].name) && (payload[0].payload.time != undefined) && <span>Compared Lap Time: {gb.lapTimeFormat(payload[0].payload.time, true)}</span>}
				{["timeRef"].includes(payload[0].name) && (payload[0].payload.timeRef != undefined) && <span>Reference Lap Time: {gb.lapTimeFormat(payload[0].payload.timeRef, true)}</span>}
				{["delta"].includes(payload[0].name) && (payload[0].payload.delta != undefined) && <><span>Compared Lap Time: {gb.lapTimeFormat(payload[0].payload.time, true)}</span><span>Reference Lap Time: {gb.lapTimeFormat(payload[0].payload.timeRef, true)}</span><span>Delta: {payload[0].payload.delta} ms</span></>}
				{ drawPosition(payload[0].payload.frame) }
			</div>
		)
	};

	const initCheck = () => {
		isThatUserSession();
		setSession({...session, isChecking: true});
	};

	const isThatUserSession = async () => {
		await Axios.post(gb.backendIP+"sessionDetails", {
			requestUserId: localStorage.getItem("token"),
			sessionId: sessionId
		}).then((res) => {
			if(!res.data['blad']) {
				setSession({...res.data, checkOwn: true, isChecking: true});
			} else {
				console.log("Session details: Unauthorized access to session ", sessionId);
				window.location.href = "/sessions";
			}
		}).catch((err) => {
			console.log("Session details: ERROR | ", err.message);
			window.location.href = "/sessions";
		})
	};

	const linkRef = (lap, lapData) => {
		localStorage.setItem("referenceLap", JSON.stringify({id: `${sessionId}-lap${lap}`, data: lapData}) );
		setRefLapId(`${sessionId}-lap${lap}`);
	};

	const miniaturkaPogody = (id) => {
		switch(id){
			case 0:
				return <><WiDaySunny style={{fill: '#ffe812', filter: 'drop-shadow(0 0 12px #ffe81255)'}}/></>
			case 1:
				return <><WiDaySunnyOvercast style={{fill: '#ffed81', filter: 'drop-shadow(0 0 12px #ffed8155)'}}/></>
			case 2:
				return <><WiCloud style={{fill: '#ccc', filter: 'drop-shadow(0 0 12px #cccccc55)'}}/></>
			case 3:
				return <><WiShowers style={{fill: '#85c3ff', filter: 'drop-shadow(0 0 12px #85c3ff55)'}}/></>
			case 4:
				return <><WiRain style={{fill: '#2d98ff', filter: 'drop-shadow(0 0 12px #2d98ff55)'}}/></>
			case 5:
				return <><WiThunderstorm style={{fill: '#0169cd', filter: 'drop-shadow(0 0 12px #0169cd55)'}}/></>
			default:
				return <><WiNa style={{fill: '#ed143d', filter: 'drop-shadow(0 0 12px #ed143d55)'}}/></>
		}
	}

	const overallReady = () => {
		document.getElementById("sessionsHref").classList.add("subPage")
		let laps = {};
		let lapTimes = [];
		let lapS1 = [];
		let lapS2 = [];
		for(const frame in session.data){
			if(!initFrameNumber.current) initFrameNumber.current = parseInt(frame);
			for(const typeOfData in session.data[frame]){
				if(typeOfData == "daneOkrazenia"){
					let lapNumber = session.data[frame][typeOfData]['numerOkrazenia'];
					if(!laps[lapNumber]){
						laps[lapNumber] = {};
						laps[lapNumber]['minF'] = parseInt(frame);
						laps[lapNumber]['maxF'] = parseInt(frame);
						laps[lapNumber]['f'] = [parseInt(frame)];
					} else {
						laps[lapNumber]['f'].push(parseInt(frame));
						laps[lapNumber]['maxF'] = parseInt(frame);
					}
				}
			}
		}
		for(const lap in laps){
			const maxFrame = Math.max(...laps[lap]['f']);
			const minFrame = Math.min(...laps[lap]['f']);
			laps[lap]['maxF'] = maxFrame;
			laps[lap]['minF'] = minFrame;
			lapS1[lap] = session.data[maxFrame]["daneOkrazenia"]["sektor1"];
			lapS2[lap] = session.data[maxFrame]["daneOkrazenia"]["sektor2"];
			lapTimes[lap] = session.data[maxFrame]["daneOkrazenia"]["aktualneOkr"];
			if(lapTimes[lap-1]) lapTimes[lap-1] = session.data[maxFrame]["daneOkrazenia"]["ostatnieOkr"];
		}
		//najszybsze PEŁNE okrazenie
		let fastestLap;
		lapTimes.map((v, i) => {
			if(!fastestLap) fastestLap = v;
			if(fastestLap > v && lapS2[i]) {
				fastestLap = v;
			}
		});

		//najszybszy sektor 3
		let fastestS3;
		lapTimes.map((v, i) => {
			if(lapS1[i] && lapS2[i]){
				if(!fastestS3) fastestS3 = v - lapS1[i] - lapS2[i];
				if((v - lapS1[i] - lapS2[i]) < fastestS3) fastestS3 = v - lapS1[i] - lapS2[i];
			}
		});

		return(
			<div className="showSessionOverall">
				<div className="showSessionOverallInfo">
					<span>Session {sessionId}</span>
					<span>{new Date(session.lastUpdate).toLocaleString('pl-PL', {day: '2-digit', month: 'long'})} {new Date(session.lastUpdate).toLocaleString('pl-PL', {hour: '2-digit', minute: '2-digit'})}</span>
					<br />
					<span>{gb.sessionType[session.type]}</span>
					<span>{gb.trackIds[session.track]}</span>
					<img src={"/images/"+gb.trackMaps[session.track]} />
					<br />
					<img src={"/images/"+gb.carImages[session.car]} />
					<span>{gb.teamIds[session.car]}</span>
				</div>
				<div className="showSessionOverallLaps">
					<table>
						<thead><tr><th>Lap</th><th>Tire type</th><th>Lap Time</th><th style={{color: '#ef4444'}}>Sector 1</th><th style={{color: '#3b82f6'}}>Sector 2</th><th style={{color: '#fbbf24'}}>Sector 3</th><th>Action</th></tr></thead>
						<tbody>
					{ lapTimes.length && lapTimes.map((time, okr) => {
						const lastLapData = Object.entries(session.data).filter((v, k) => v[0] == laps[okr].maxF)[0][1];
						if(!lapS2[okr]) return;
						return <tr key={"okr"+okr}>
								<td>{okr}</td>
								<td>{gb.typOponWizualnie[ lastLapData.statusPojazdu.typOponWizualne ]}</td>
								<td className={lapTimes[okr] == fastestLap ? "tableFastestLap" : ""}>{gb.lapTimeFormat(time, true)}</td>
								<td className={lapS1[okr] == Math.min(...lapS1.filter(r => r)) ? "tableFastestLap" : ""}>{gb.lapTimeFormat(lapS1[okr] || time , false)}</td>
								<td className={lapS2[okr] == Math.min(...lapS2.filter(r => r)) ? "tableFastestLap" : ""}>{lapS1[okr] ? gb.lapTimeFormat(lapS2[okr], false) : "-"}</td>
								<td className={fastestS3 == (time - lapS1[okr] - lapS2[okr]) ? "tableFastestLap" : ""}>{(lapS1[okr] && lapS2[okr]) ? gb.lapTimeFormat(time - lapS1[okr] - lapS2[okr], false) : "-"}</td>
								<td>
									<button className="tabelaOdnosnik" onClick={() => {
										setChartsLap({
											tire: gb.typOponWizualnie[lastLapData.statusPojazdu.typOponWizualne],
											tireC: gb.typOpon[lastLapData.statusPojazdu.typOpon],
											minF: laps[okr].minF,
											maxF: laps[okr].maxF,
											frames: laps[okr].f,
											time: time,
											s1: lapS1[okr],
											s2: lapS2[okr],
											lapNumber: okr,
											car: session.car,
											sessionid: sessionId
										})
									}}><RiBarChart2Fill /> Charts</button>
									{(refLapId ? (
										(refLapId == (sessionId + "-lap" + okr))
										? <button className="tabelaOdnosnik danger" onClick={ () => {
											localStorage.removeItem("referenceLap");
											setRefLapId(null);
										}}><RiCheckboxMultipleBlankLine /> Remove Ref</button>
										: <button className="tabelaOdnosnik danger" onClick={() => {
											setChartsLap({
												tire: gb.typOponWizualnie[lastLapData.statusPojazdu.typOponWizualne],
												tireC: gb.typOpon[lastLapData.statusPojazdu.typOpon],
												minF: laps[okr].minF,
												maxF: laps[okr].maxF,
												frames: laps[okr].f,
												time: time,
												s1: lapS1[okr],
												s2: lapS2[okr],
												lapNumber: okr,
												compare: refLapId,
												track: session.track,
												car: session.car,
												sessionid: sessionId
											})	
										}}><RiSwordLine /> Compare</button>
									)
									:
									<button className="tabelaOdnosnik danger" onClick={ () => linkRef(okr, {
										tire: gb.typOponWizualnie[lastLapData.statusPojazdu.typOponWizualne],
										tireC: gb.typOpon[lastLapData.statusPojazdu.typOpon],
										minF: laps[okr].minF,
										maxF: laps[okr].maxF,
										frames: laps[okr].f,
										time: time,
										s1: lapS1[okr],
										s2: lapS2[okr],
										lapNumber: okr,
										track: session.track,
										car: session.car,
										sessionid: sessionId
									}) }><RiCheckboxMultipleBlankFill /> Set Ref</button>
									)}
								</td>
							</tr>
					})}
					</tbody>
					</table>
				</div>
			</div>
		);
	};

	const showCharts = () =>{
		let topSpeed = 0;
		let avgSpeed = 0;
		let avgThrottle = 0;
		let avgBrake = 0;
		let x = 0;
		let xC = 0;
		let initTireDegradation = undefined;
		let lastTireDegradation = undefined;
		let positionMaxFrame = session.data[chartsLap.maxF].daneOkrazenia.aktualnaPozycja;
		let positionMinFrame = session.data[chartsLap.minF].daneOkrazenia.aktualnaPozycja;
		let chartsData = [];
		//dataset for reference lap
		let carRef = -1;
		let tireRef = -1;
		let tireCRef = -1;
		let sessionidRef = -1;
		let lapNumberRef = -1;
		let timeLapRef = -1;
		let s1ref = -1;
		let s2ref = -1;
		let topSpeedC = 0;
		let avgSpeedC = 0;
		let avgThrottleC = 0;
		let avgBrakeC = 0;
		let initTireDegradationC = undefined;
		let lastTireDegradationC = undefined;
		let framesSource = undefined;
		let goodToGo = false;
		let pogodaFramesCounter = 0;
		let pogodaId = 0;
		let airTemp = 0;
		let trackTemp = 0;
		let ersC = 0;
		let positionMaxFrameC = 0;
		let positionMinFrameC = 0;

		chartsLap.frames.map( frame => {
			const frameData = session.data[frame];
			//console.log(frameData);
			if(frameData.daneOkrazenia.lapDistance < 0) return;
			x++;
			if(frameData.telemetria){
				console.log(frameData);
				if(frameData.telemetria.predkosc > topSpeed) topSpeed = frameData.telemetria.predkosc;
				avgSpeed = avgSpeed + frameData.telemetria.predkosc;
				avgThrottle = avgThrottle + frameData.telemetria.gaz*100;
				avgBrake = avgBrake + frameData.telemetria.hamulec*100;
				chartsData.push({
					frame: frame,
					gear: frameData.telemetria.bieg,
					drs: frameData.telemetria.aktywowanyDRS,
					steering: (frameData.telemetria.kierownica).toFixed(3),
					speed: frameData.telemetria.predkosc,
					throttle: (frameData.telemetria.gaz*100).toFixed(0),
					brake: (frameData.telemetria.hamulec*100).toFixed(0),
					time: frameData.daneOkrazenia.aktualneOkr,
					lapDist: frameData.daneOkrazenia.lapDistance ? frameData.daneOkrazenia.lapDistance.toFixed(0) : 0
				});
			}
			if(frameData.uszkodzenia){
				if(initTireDegradation === undefined) initTireDegradation = (frameData.uszkodzenia.zuzycieFR + frameData.uszkodzenia.zuzycieFL + frameData.uszkodzenia.zuzycieRR + frameData.uszkodzenia.zuzycieRL)/4;
				lastTireDegradation = (frameData.uszkodzenia.zuzycieFR + frameData.uszkodzenia.zuzycieFL + frameData.uszkodzenia.zuzycieRR + frameData.uszkodzenia.zuzycieRL)/4;
			}
			if(frameData.weather){
				pogodaFramesCounter++;
				pogodaId += frameData.weather.id;
				airTemp += frameData.weather.air;
				trackTemp += frameData.weather.t;
			}
		});

		if(chartsLap.compare){
			const comparedLapData = JSON.parse(localStorage.getItem("referenceLap")).data;
			//console.log(comparedLapData);
			if(chartsLap.track != comparedLapData.track) {
				console.log("You're trying to compare laps from different tracks!");
				setBlad("You're trying to compare laps from different tracks! 🤨");
				return;
			} else {
				if(sessionId == refLapId.split("-")[0]){
					console.log("Ta sama sesja");
					framesSource = session;
					carRef = comparedLapData.car;
					sessionidRef = comparedLapData.sessionid;
					timeLapRef = comparedLapData.time;
					s1ref = comparedLapData.s1;
					s2ref = comparedLapData.s2;
					tireRef = comparedLapData.tire;
					tireCRef = comparedLapData.tireC;
					lapNumberRef = comparedLapData.lapNumber;
					ersC = session.data[comparedLapData.maxF].statusPojazdu.wykorzystanyERS;
					positionMaxFrameC = session.data[comparedLapData.maxF].daneOkrazenia.aktualnaPozycja;
					positionMinFrameC = session.data[comparedLapData.minF].daneOkrazenia.aktualnaPozycja;
				} else {
					console.log("Inna sesja");
					setBlad("Comparing laps from different sessions not available yet! 😕");
					return;
				}
				comparedLapData.frames.map(frame => {
					if(framesSource.data[frame].daneOkrazenia.lapDistance < 0) return;
					xC++;
					if(framesSource.data[frame].telemetria){
						if(framesSource.data[frame].telemetria.predkosc > topSpeedC) topSpeedC = framesSource.data[frame].telemetria.predkosc;
						avgSpeedC = avgSpeedC + framesSource.data[frame].telemetria.predkosc;
						avgThrottleC = avgThrottleC + framesSource.data[frame].telemetria.gaz*100;
						avgBrakeC = avgBrakeC + framesSource.data[frame].telemetria.hamulec*100;
						chartsData.push({
							frameRef: frame,
							gearRef: framesSource.data[frame].telemetria.bieg,
							drsRef: framesSource.data[frame].telemetria.aktywowanyDRS,
							steeringRef: (framesSource.data[frame].telemetria.kierownica).toFixed(3),
							speedRef: framesSource.data[frame].telemetria.predkosc,
							throttleRef: (framesSource.data[frame].telemetria.gaz*100).toFixed(0),
							brakeRef: (framesSource.data[frame].telemetria.hamulec*100).toFixed(0),
							timeRef: framesSource.data[frame].daneOkrazenia.aktualneOkr,
							lapDist: (framesSource.data[frame].daneOkrazenia.lapDistance).toFixed(0)
						});
					}
					if(framesSource.data[frame].uszkodzenia){
						if(initTireDegradationC === undefined) initTireDegradationC = (framesSource.data[frame].uszkodzenia.uszFR + framesSource.data[frame].uszkodzenia.uszFL + framesSource.data[frame].uszkodzenia.uszRR + framesSource.data[frame].uszkodzenia.uszRL)/4;
						lastTireDegradationC = (framesSource.data[frame].uszkodzenia.uszFR + framesSource.data[frame].uszkodzenia.uszFL + framesSource.data[frame].uszkodzenia.uszRR + framesSource.data[frame].uszkodzenia.uszRL)/4;
					}
				});
				goodToGo = true;

				
			}
		}

		//posortuj wpisy rosnaco na lapDist
		chartsData = chartsData.sort((a, b) => {
			return a.lapDist - b.lapDist
		});

		if(chartsLap.compare){
			//jesli jest speed a speedRef nie ma, to ustawic speedRef na średnią pomiedzy poprzednim a nastepnym i na odwrot, jesli speedRef jest a speed nie ma itd.	
			const estimUnknown = (iteration, key) => {
				let seekMin = iteration;
				let seekMax = iteration;
				while(chartsData[seekMin][key] === undefined){
					seekMin = seekMin - 1;
				}
				while(chartsData[seekMax][key] === undefined){
					seekMax = seekMax + 1;
				}
				return (parseFloat(chartsData[seekMin][key])+parseFloat(chartsData[seekMax][key]))/2;
			};

			for(let iter = 1; iter < chartsData.length-1; iter++){
				if(chartsData[iter].speed === undefined) chartsData[iter].speed = estimUnknown(iter, "speed");
				if(chartsData[iter].speedRef === undefined) chartsData[iter].speedRef = estimUnknown(iter, "speedRef");
				if(chartsData[iter].brake === undefined) chartsData[iter].brake = estimUnknown(iter, "brake");
				if(chartsData[iter].brakeRef === undefined) chartsData[iter].brakeRef = estimUnknown(iter, "brakeRef");
				if(chartsData[iter].throttle === undefined) chartsData[iter].throttle = estimUnknown(iter, "throttle");
				if(chartsData[iter].throttleRef === undefined) chartsData[iter].throttleRef = estimUnknown(iter, "throttleRef");
				if(chartsData[iter].steering === undefined) chartsData[iter].steering = estimUnknown(iter, "steering");
				if(chartsData[iter].steeringRef === undefined) chartsData[iter].steeringRef = estimUnknown(iter, "steeringRef");
				if(chartsData[iter].time === undefined) chartsData[iter].time = estimUnknown(iter, "time");
				if(chartsData[iter].timeRef === undefined) chartsData[iter].timeRef = estimUnknown(iter, "timeRef");
				// chartsData[iter].time = chartsData[iter].timeRef - chartsData[iter].time;
				// console.log(chartsData[iter].time, chartsData[iter].timeRef);
			}
			for(let iter = 1; iter < chartsData.length; iter++){
				chartsData[iter].delta = chartsData[iter].time - chartsData[iter].timeRef;
			}
		}

		//console.log(chartsData);

		//jesli nie ma w tym okrazeniu ramki z pogodą to znaczy ze nie bylo zmian wzgledem poprzednich ramek np. z poprzedniego okrazenia
		//wyciagnijmy ja z poprzednich okrazen
		let tmpFrame = chartsLap.minF;
		//przeiteruj od poczatku ramki tego okrazenia wstecz az do pierwszej ramki tej sesji
		while(!pogodaFramesCounter && tmpFrame > initFrameNumber){
			if(session.data[tmpFrame]){
				if(session.data[tmpFrame].weather){
					pogodaFramesCounter++;
					pogodaId += session.data[tmpFrame].weather.id;
					airTemp += session.data[tmpFrame].weather.air;
					trackTemp += session.data[tmpFrame].weather.t;
				} else {
					tmpFrame--;
				}
			} else {
				tmpFrame--;
			}
		}
		//usrednij pogode i temperatury otoczenia bolidu
		const mainWeather = pogodaFramesCounter ? Math.round((pogodaId/pogodaFramesCounter)) : 6;
		const mainAirTemp = pogodaFramesCounter ? (airTemp/pogodaFramesCounter).toFixed(1) : -1;
		const mainTrackTemp = pogodaFramesCounter ? (trackTemp/pogodaFramesCounter).toFixed(1) : -1;
		
		return(
			<div className="lapDetails">
				<button className="closeButton" onClick={() => {
					imgRef.current = null;
					canvasRef.current = null;
					setChartsLap(null);
				}}>EXIT</button>
				<div className="lapDetailsInfo">
					<div className="overallLap">
						{/* INFO POJEDYNCZEGO / POROWNYWANEGO */}
						<div className="overallLapHeader" style={{background: chartsLap.compare ? '#001521' : ""}}>
							<div className="overallLapInfo">
								<p>Session {sessionId}</p>
								<span>{chartsLap.compare ? <b>Compared </b>: ""}Lap {chartsLap.lapNumber} Position {(positionMaxFrame !== positionMinFrame) ? positionMinFrame : positionMaxFrame} {(positionMaxFrame !== positionMinFrame) && <><CgArrowRight /> {positionMaxFrame}</>}</span>
							</div>
							<div className="overallLapSectors">
								<span>LAP | {gb.lapTimeFormat(chartsLap.time, true)}</span>
								<span>S1 | {gb.lapTimeFormat(chartsLap.s1, false)}</span>
								<span>S2 | {gb.lapTimeFormat(chartsLap.s2, false)}</span>
								<span>S3 | {gb.lapTimeFormat(chartsLap.time - chartsLap.s1 - chartsLap.s2, false)}</span>
							</div>
						</div>
						<div className="overallLapRest" style={{background: chartsLap.compare ? '#001521' : ""}}>
							<img style={{width: 310, height: 'fit-content', alignSelf: 'center'}} src={"/images/"+gb.carImages[session.car]} />
							<div className="lapTireType">
								<img src={"/images/"+gb.tireImages[chartsLap.tire]} />
								<div style={{display: "flex", flexDirection: "column"}}>
									<b>Tire type</b>
									<b>{chartsLap.tire} [{chartsLap.tireC}]</b>
								</div>
							</div>
							<div className="lapWeatherCondition">
								{miniaturkaPogody(mainWeather)}
								<div style={{display: "flex", flexDirection: "column"}}>
									<b>Weather: {gb.weatherType[mainWeather]}</b>
									{(mainAirTemp == -1) ? "" : <b>Air: {mainAirTemp} °C</b> }
									{(mainTrackTemp == -1) ? "" : <b>Track: {mainTrackTemp} °C</b> }
								</div>
							</div>
						</div>
						{/* INFO REFERENCYJNE */}
						{chartsLap.compare ?
						<><div className="overallLapHeader" style={{background: '#000b0c', borderTop: '2px solid white'}}>
							<div className="overallLapInfo">
								<p>Session {sessionidRef}</p>
								<span><b>Reference</b> Lap {lapNumberRef} Position {(positionMaxFrameC !== positionMinFrameC) ? positionMinFrameC : positionMaxFrameC} {(positionMaxFrameC !== positionMinFrameC) && <><CgArrowRight /> {positionMaxFrameC}</>}</span>
							</div>
							<div className="overallLapSectors">
								<span>LAP | {gb.lapTimeFormat(timeLapRef, true)}</span>
								<span>S1 | {gb.lapTimeFormat(s1ref, false)}</span>
								<span>S2 | {gb.lapTimeFormat(s2ref, false)}</span>
								<span>S3 | {gb.lapTimeFormat(timeLapRef - s1ref - s2ref, false)}</span>
							</div>
						</div>
						<div className="overallLapRest" style={{background: '#000b0c'}}>
							<img style={{width: 310, height: 'fit-content', alignSelf: 'center'}} src={"/images/"+gb.carImages[carRef]} />
							<div className="lapTireType">
								<img src={"/images/"+gb.tireImages[tireRef]} />
								<div style={{display: "flex", flexDirection: "column"}}>
									<b>Tire type</b>
									<b>{tireRef} [{tireCRef}]</b>
								</div>
							</div>
							<div className="lapWeatherCondition">
								{miniaturkaPogody(mainWeather)}
								<div style={{display: "flex", flexDirection: "column"}}>
									<b>Weather: {gb.weatherType[mainWeather]}</b>
									{(mainAirTemp == -1) ? "" : <b>Air: {mainAirTemp} °C</b> }
									{(mainTrackTemp == -1) ? "" : <b>Track: {mainTrackTemp} °C</b> }
								</div>
							</div>
						</div></> : ""}
					</div>
					<div className="lapTelemetry">
						<h3>Lap Telemetry</h3>
						{!chartsLap.compare ?
						<table>
							<tbody>
								<tr><th>Top Speed</th><td>{topSpeed} kmh</td></tr>
								<tr><th>Avg Speed</th><td>{(avgSpeed/x).toFixed(1)} kmh</td></tr>
								<tr><th>Avg Throttle Input</th><td>{(avgThrottle/x).toFixed(2)}%</td></tr>
								<tr><th>Avg Brake Input</th><td>{(avgBrake/x).toFixed(2)}%</td></tr>
								<tr><th>Tire wear</th><td>{initTireDegradation.toFixed(2)}% <CgArrowRight style={{verticalAlign: 'middle'}}/> {lastTireDegradation.toFixed(2)}%</td></tr>
								<tr><th>ERS Burnt</th><td>{session.data[chartsLap.maxF].statusPojazdu.wykorzystanyERS ? (session.data[chartsLap.maxF].statusPojazdu.wykorzystanyERS/1000).toFixed(0) : "0"} kJ</td></tr>
							</tbody>
						</table>
						:
						<table className="diffTable">
							<tbody>
								<tr>
									<th>Top Speed</th>
									<td>{topSpeed} kmh</td>
									<td>{topSpeedC} kmh</td>
								</tr>
								<tr>
									<th>Avg Speed</th>
									<td>{(avgSpeed/x).toFixed(1)} kmh</td>
									<td>{(avgSpeedC/xC).toFixed(1)} kmh</td>
								</tr>
								<tr>
									<th>Avg Throttle Input</th>
									<td>{(avgThrottle/x).toFixed(2)}%</td>
									<td>{(avgThrottleC/xC).toFixed(2)}%</td>
								</tr>
								<tr>
									<th>Avg Brake Input</th>
									<td>{(avgBrake/x).toFixed(2)}%</td>
									<td>{(avgBrakeC/xC).toFixed(2)}%</td>
								</tr>
								<tr>
									<th>Tire wear</th>
									<td>{initTireDegradation.toFixed(2)}% <CgArrowRight style={{verticalAlign: 'middle'}}/> {lastTireDegradation.toFixed(2)}%</td>
									<td>{initTireDegradationC.toFixed(2)}% <CgArrowRight style={{verticalAlign: 'middle'}}/> {lastTireDegradationC.toFixed(2)}%</td>
								</tr>
								<tr>
									<th>ERS Burnt</th>
									<td>{session.data[chartsLap.maxF].statusPojazdu.wykorzystanyERS ? (session.data[chartsLap.maxF].statusPojazdu.wykorzystanyERS/1000).toFixed(0) : "0"} kJ</td>
									<td>{ersC ? (ersC/1000).toFixed(0) : "0"} kJ</td>
								</tr>
							</tbody>
						</table>
						}
					</div>
					<div className="lapMinimap">
						<span>{gb.trackIds[session.track]}</span>
						<div className="lapMinimapImg" style={{background: `url('/images/${gb.trackMaps[session.track]}')`, backgroundRepeat: "no-repeat", backgroundSize: 'contain'}}>
							<img src={"/images/"+gb.trackMaps[session.track]} ref={setImgRef} style={{opacity: 0}} />
							<canvas id="minimapCanvas" ref={setCanvasRef} className="lapMinimapCanvas"/>
						</div>
					</div>
				</div>
				{ chartsLap.compare ?
				<div className="deltaWykres">
					<h3>Time Delta <sup>Compared Lap <CgArrowRight style={{verticalAlign: 'middle'}}/> Reference Lap</sup></h3>
					<ResponsiveContainer>
						<AreaChart syncId="charts" data={chartsData} margin={{left: 20, bottom: 0}}>
							<defs>
								<linearGradient id="speedColor" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#af7d00" stopOpacity={0.9}/>
									<stop offset="95%" stopColor="#af7d00" stopOpacity={0.3}/>
								</linearGradient>
							</defs>
							<XAxis dataKey="lapDist" tick={false}/>
							<YAxis unit="ms" />
							<CartesianGrid strokeDasharray="3 3" stroke="#aaa" strokeOpacity={0.1}/>
							<Tooltip filterNull={false} content={<CustomToolTip />} />
							<Area connectNulls type="monotone" dataKey="delta" strokeWidth={2} stroke="#af7d00" fill="url(#speedColor)" fillOpacity={1} />
							<Area connectNulls type="monotone" dataKey="time" strokeWidth={2} stroke="#af7d00" fill="url(#speedColor)" fillOpacity={1} hide={true}/>
							<Area connectNulls type="monotone" dataKey="timeRef" strokeWidth={2} stroke="#af7d00" fill="url(#speedColor)" fillOpacity={1} hide={true}/>
						</AreaChart>
					</ResponsiveContainer>
				</div> : ""}
				<div className="lapCharts" id="lapCharts">
					<div className="lapChartsInside" style={{background: chartsLap.compare ? '#001521' : ""}}>
						{ chartsLap.compare ? <h3>Compared Speed</h3> : <h3>Speed</h3> }
						<ResponsiveContainer className="lapChart">
							<AreaChart syncId="charts" data={chartsData} margin={{left: 20, bottom: 0}}>
								<defs>
									<linearGradient id="speedColor" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#af7d00" stopOpacity={0.9}/>
										<stop offset="95%" stopColor="#af7d00" stopOpacity={0.3}/>
									</linearGradient>
								</defs>
								<XAxis dataKey="lapDist" tick={false}/>
								<YAxis unit="kmh" />
								<CartesianGrid strokeDasharray="3 3" stroke="#aaa" strokeOpacity={0.1}/>
								<Tooltip filterNull={false} content={<CustomToolTip />} />
								<Area connectNulls type="monotone" dataKey="speed" strokeWidth={2} stroke="#af7d00" fill="url(#speedColor)" fillOpacity={1} />
							</AreaChart>
						</ResponsiveContainer>
						{ chartsLap.compare ? <h3>Compared Throttle & Brake</h3> : <h3>Throttle & Brake</h3>}
						<ResponsiveContainer className="lapChart">
							<AreaChart syncId="charts" data={chartsData} margin={{left: 20}}>
								<defs>
									<linearGradient id="brakeColor" x1="0" y1="0" x2="0" y2="1">
										<stop offset="15%" stopColor="#6a0000" stopOpacity={1}/>
										<stop offset="85%" stopColor="#080808" stopOpacity={0.4}/>
									</linearGradient>
									<linearGradient id="throttleColor" x1="0" y1="0" x2="0" y2="1">
										<stop offset="15%" stopColor="#004600" stopOpacity={1}/>
										<stop offset="85%" stopColor="#080808" stopOpacity={0.4}/>
									</linearGradient>
								</defs>
								<XAxis dataKey="lapDist" tick={false}/>
								<YAxis unit="%" />
								<CartesianGrid strokeDasharray="3 3" stroke="#aaa" strokeOpacity={0.1}/>
								<Tooltip filterNull={false} content={<CustomToolTip />} />
								<Area connectNulls type="monotone" dataKey="brake" strokeWidth={2} stroke="#6a0000" fill="url(#brakeColor)" />
								<Area connectNulls type="monotone" dataKey="throttle" strokeWidth={2} stroke="#004600" fill="url(#throttleColor)" />
							</AreaChart>
						</ResponsiveContainer>
						{chartsLap.compare ? <h3>Compared Steering</h3> : <h3>Steering</h3>}
						<ResponsiveContainer className="lapChart">
							<AreaChart syncId="charts" data={chartsData} margin={{left: 20}}>
								<defs>
									<linearGradient id="steeringColor" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="dodgerblue" stopOpacity={0.9}/>
										<stop offset="95%" stopColor="dodgerblue" stopOpacity={0.5}/>
									</linearGradient>
								</defs>
								<XAxis dataKey="lapDist" tick={false}/>
								<YAxis domain={[-1, 1]}/>
								<CartesianGrid strokeDasharray="3 3" stroke="#aaa" strokeOpacity={0.1}/>
								<Tooltip filterNull={false} content={<CustomToolTip />} />
								<Area connectNulls type="monotone" dataKey="steering" strokeWidth={2} stroke="dodgerblue" fill="url(#steeringColor)" fillOpacity={0.5} />
							</AreaChart>
						</ResponsiveContainer>
					</div>
					{
						chartsLap.compare ?
						<div className="lapChartsInside" style={{background: '#000b0c'}}>
						<h3>Reference Speed</h3>
						<ResponsiveContainer className="lapChart">
							<AreaChart syncId="charts" data={chartsData} margin={{left: 20, bottom: 0}}>
								<defs>
									<linearGradient id="speedColor" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#af7d00" stopOpacity={0.9}/>
										<stop offset="95%" stopColor="#af7d00" stopOpacity={0.3}/>
									</linearGradient>
								</defs>
								<XAxis dataKey="lapDist" tick={false}/>
								<YAxis unit="kmh" />
								<CartesianGrid strokeDasharray="3 3" stroke="#aaa" strokeOpacity={0.1}/>
								<Tooltip filterNull={false} content={<CustomToolTip />} />
								<Area connectNulls type="monotone" dataKey="speedRef" strokeWidth={2} stroke="#af7d00" fill="url(#speedColor)" fillOpacity={1} />
							</AreaChart>
						</ResponsiveContainer>
						<h3>Reference Throttle & Brake</h3>
						<ResponsiveContainer className="lapChart">
							<AreaChart syncId="charts" data={chartsData} margin={{left: 20}}>
								<defs>
									<linearGradient id="brakeColor" x1="0" y1="0" x2="0" y2="1">
										<stop offset="15%" stopColor="#6a0000" stopOpacity={1}/>
										<stop offset="85%" stopColor="#080808" stopOpacity={0.4}/>
									</linearGradient>
									<linearGradient id="throttleColor" x1="0" y1="0" x2="0" y2="1">
										<stop offset="15%" stopColor="#004600" stopOpacity={1}/>
										<stop offset="85%" stopColor="#080808" stopOpacity={0.4}/>
									</linearGradient>
								</defs>
								<XAxis dataKey="lapDist" tick={false}/>
								<YAxis unit="%" />
								<CartesianGrid strokeDasharray="3 3" stroke="#aaa" strokeOpacity={0.1}/>
								<Tooltip filterNull={false} content={<CustomToolTip />} />
								<Area connectNulls type="monotone" dataKey="brakeRef" strokeWidth={2} stroke="#6a0000" fill="url(#brakeColor)" />
								<Area connectNulls type="monotone" dataKey="throttleRef" strokeWidth={2} stroke="#004600" fill="url(#throttleColor)" />
							</AreaChart>
						</ResponsiveContainer>
						<h3>Reference Steering</h3>
						<ResponsiveContainer className="lapChart">
							<AreaChart syncId="charts" data={chartsData} margin={{left: 20}}>
								<defs>
									<linearGradient id="steeringColor" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="dodgerblue" stopOpacity={0.9}/>
										<stop offset="95%" stopColor="dodgerblue" stopOpacity={0.5}/>
									</linearGradient>
								</defs>
								<XAxis dataKey="lapDist" tick={false}/>
								<YAxis domain={[-1, 1]}/>
								<CartesianGrid strokeDasharray="3 3" stroke="#aaa" strokeOpacity={0.1}/>
								<Tooltip filterNull={false} content={<CustomToolTip />} />
								<Area connectNulls type="monotone" dataKey="steeringRef" strokeWidth={2} stroke="dodgerblue" fill="url(#steeringColor)" fillOpacity={0.5} />
							</AreaChart>
						</ResponsiveContainer>
					</div> : ""
					}
				</div>
			</div>
		);
	};

	return(
		<>
			<Nawigacja />
			{ !session.isChecking && initCheck() }
			<div className="screen">
				{ session.checkOwn ? overallReady() : <LoadingIndicator text={`Loading data for session ${sessionId}`} /> }
				{ (chartsLap && !blad) && showCharts()}
			</div>
			{ blad && wyswietlBlad(blad) }
		</>
	)
};