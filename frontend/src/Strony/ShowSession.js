import gb from "../GlobalVars.js";
import Nawigacja from "../Nawigacja.js";
import { useParams } from "react-router-dom";
import Axios from "axios";
import { useState, useRef } from "react";
import LoadingIndicator from "../Components/LoadingIndicator.js";
import { AreaChart, XAxis, YAxis, CartesianGrid, Area, Tooltip, ResponsiveContainer, Line, LineChart } from "recharts";
import { CgArrowRight } from "react-icons/cg";
import { IoClose } from "react-icons/io5";
import { RiCheckboxMultipleBlankFill, RiCheckboxMultipleBlankLine, RiSwordLine, RiBarChart2Fill } from "react-icons/ri";

export default function ShowSessions(props){
	const {sessionId} = useParams();
	const [chartsLap, setChartsLap ] = useState(null);
	const [refLapId, setRefLapId] = useState(localStorage.getItem("referenceLap") ? JSON.parse(localStorage.getItem("referenceLap")).id : null);
	const [session, setSession] = useState({data: null, checkOwn: false, isChecking: false});
	const [refLapData, setRefLapData] = useState({data: null});
	const canvasRef = useRef(null);
	const imgRef = useRef(null);
	const dpr = window.devicePixelRatio;
	document.title = `f1-telemetry | Session ${sessionId}`;

	if(!sessionId){
		window.location.href = "/sessions";
	}

	const drawPosition = (frame) => {
		if(frame){
			const posX = session.data[frame].daneMotion.pozycjaX;
			const posY = session.data[frame].daneMotion.pozycjaZ;
			const canvasX = imgRef.current.width;
			const canvasY = imgRef.current.height;
			const ctx = canvasRef.current.getContext('2d');
			ctx.scale(dpr, dpr);
			ctx.clearRect(0,0,canvasX, canvasY);
			ctx.beginPath();
			let [correctX, correctY, viewX, viewY] = gb.minimapMappings[session.track];
			let tmpX = (posX+correctX)/viewX*canvasX;
			let tmpY = (posY+correctY)/viewY*canvasY;
			console.log("Rysuje", tmpX, tmpY);
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
				{["speed", "speedRef"].includes(payload[0].name) && (payload[0].payload.speed != undefined) && <span>Speed: {payload[0].payload.speed}km/h</span>}
				{["speed", "speedRef"].includes(payload[0].name) && (payload[0].payload.speedRef != undefined) && <span>Reference Speed: {payload[0].payload.speedRef}km/h</span>}
				{["brake", "brakeRef", "throttle", "throttleRef"].includes(payload[0].name) && (payload[0].payload.brake != undefined) && <span>Brake: {parseInt(payload[0].payload.brake)}%</span>}
				{["brake", "brakeRef", "throttle", "throttleRef"].includes(payload[0].name) && (payload[0].payload.brakeRef != undefined) && <span>Reference Brake: {parseInt(payload[0].payload.brakeRef)}%</span>}
				{["brake", "brakeRef", "throttle", "throttleRef"].includes(payload[0].name) && (payload[0].payload.throttle != undefined) && <span>Throttle: {parseInt(payload[0].payload.throttle)}%</span>}
				{["brake", "brakeRef", "throttle", "throttleRef"].includes(payload[0].name) && (payload[0].payload.throttleRef != undefined) && <span>Reference Throttle: {parseInt(payload[0].payload.throttleRef)}%</span>}
				{["steering", "steeringRef"].includes(payload[0].name) && (payload[0].payload.steering != undefined) && <span>Steering: {parseFloat(payload[0].payload.steering).toFixed(3)}</span>}
				{["steering", "steeringRef"].includes(payload[0].name) && (payload[0].payload.steeringRef != undefined) && <span>Reference Steering: {parseFloat(payload[0].payload.steeringRef).toFixed(3)}</span>}
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

	const overallReady = () => {
		document.getElementById("sessionsHref").classList.add("subPage")
		let laps = {};
		let lapTimes = [];
		let lapS1 = [];
		let lapS2 = [];
		for(const frame in session.data){
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
											lapNumber: okr
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
												track: session.track
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
										track: session.track
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
		let topSpeedC = 0;
		let avgSpeedC = 0;
		let avgThrottleC = 0;
		let avgBrakeC = 0;
		let initTireDegradationC = undefined;
		let lastTireDegradationC = undefined;
		let framesSource = undefined;
		let goodToGo = false;

		chartsLap.frames.map( frame => {
			const frameData = session.data[frame];
			// console.log(frameData);
			if(frameData.daneOkrazenia.lapDistance < 0) return;
			x++;
			if(frameData.telemetria){
				if(frameData.telemetria.predkosc > topSpeed) topSpeed = frameData.telemetria.predkosc;
				avgSpeed = avgSpeed + frameData.telemetria.predkosc;
				avgThrottle = avgThrottle + frameData.telemetria.gaz*100;
				avgBrake = avgBrake + frameData.telemetria.hamulec*100;
				chartsData.push({frame: frame, gear: frameData.telemetria.bieg, drs: frameData.telemetria.aktywowanyDRS, steering: (frameData.telemetria.kierownica).toFixed(3), speed: frameData.telemetria.predkosc, throttle: (frameData.telemetria.gaz*100).toFixed(0), brake: (frameData.telemetria.hamulec*100).toFixed(0), lapDist: frameData.daneOkrazenia.lapDistance.toFixed(0)});
			}
			if(frameData.uszkodzenia){
				if(initTireDegradation === undefined) initTireDegradation = (frameData.uszkodzenia.zuzycieFR + frameData.uszkodzenia.zuzycieFL + frameData.uszkodzenia.zuzycieRR + frameData.uszkodzenia.zuzycieRL)/4;
				lastTireDegradation = (frameData.uszkodzenia.zuzycieFR + frameData.uszkodzenia.zuzycieFL + frameData.uszkodzenia.zuzycieRR + frameData.uszkodzenia.zuzycieRL)/4;
			}
		});

		if(chartsLap.compare){
			const comparedLapData = JSON.parse(localStorage.getItem("referenceLap")).data;
			if(chartsLap.track != comparedLapData.track) {
				console.log("You're trying to compare laps from different tracks!");
				//TODO: popup z wiadomoscia o roznych torach
			} else {
				if(sessionId == refLapId.split("-")[0]){
					console.log("Ta sama sesja");
					framesSource = session;
				} else {
					console.log("Inna sesja");
					Axios.post(gb.backendIP+"sessionDetails", {
						requestUserId: localStorage.getItem("token"),
						sessionId: JSON.parse(localStorage.getItem("referenceLap")).id.split("-")[0]
					}).then((res) => {
						if(!res.data['blad']) {
							framesSource = {...res.data};
						}
					}).catch((err) => {
						console.log("Session details: ERROR | ", err.message);
					})
					//TODO: co jesli porownywana sesja jest juz usunieta?
				}
				/*
					TODO:
					dane szczegółowe okrazenia referencyjnego wrzucic do useState,
					analize okrazenia referencyjnego robic dopiero jak useState sie ustawi
				*/
				comparedLapData.frames.map(frame => {
					if(framesSource.data[frame].daneOkrazenia.lapDistance < 0) return;
					xC++;
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
						lapDist: (framesSource.data[frame].daneOkrazenia.lapDistance).toFixed(0)
					});
					if(framesSource.data[frame].uszkodzenia){
						if(initTireDegradationC === undefined) initTireDegradationC = (framesSource.data[frame].uszkodzenia.zuzycieFR + framesSource.data[frame].uszkodzenia.zuzycieFL + framesSource.data[frame].uszkodzenia.zuzycieRR + framesSource.data[frame].uszkodzenia.zuzycieRL)/4;
						lastTireDegradationC = (framesSource.data[frame].uszkodzenia.zuzycieFR + framesSource.data[frame].uszkodzenia.zuzycieFL + framesSource.data[frame].uszkodzenia.zuzycieRR + framesSource.data[frame].uszkodzenia.zuzycieRL)/4;
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
				console.log(chartsData[iter]);
				if(chartsData[iter].speed === undefined) chartsData[iter].speed = estimUnknown(iter, "speed");
				if(chartsData[iter].speedRef === undefined) chartsData[iter].speedRef = estimUnknown(iter, "speedRef");
				if(chartsData[iter].brake === undefined) chartsData[iter].brake = estimUnknown(iter, "brake");
				if(chartsData[iter].brakeRef === undefined) chartsData[iter].brakeRef = estimUnknown(iter, "brakeRef");
				if(chartsData[iter].throttle === undefined) chartsData[iter].throttle = estimUnknown(iter, "throttle");
				if(chartsData[iter].throttleRef === undefined) chartsData[iter].throttleRef = estimUnknown(iter, "throttleRef");
				if(chartsData[iter].steering === undefined) chartsData[iter].steering = estimUnknown(iter, "steering");
				if(chartsData[iter].steeringRef === undefined) chartsData[iter].steeringRef = estimUnknown(iter, "steeringRef");
			}
		}

		console.log(chartsData);

		/*
		todo:
		- reszta wykresow
		- napisac funkcje wychwyc bledy
		- css
		- car damage check
		*/
		
		return(
			<div className="lapDetails">
				<button className="closeButton" onClick={() => {
					imgRef.current = null;
					canvasRef.current = null;
					setChartsLap(null);
				}}><IoClose /> Close</button>
				<div className="lapDetailsInfo">
					<div className="overallLap">
						<div className="overallLapHeader">
							<div className="overallLapInfo">
								<p>Session {sessionId}</p>
								<span>Lap {chartsLap.lapNumber} Position {(positionMaxFrame !== positionMinFrame) ? positionMinFrame : positionMaxFrame} {(positionMaxFrame !== positionMinFrame) && <><CgArrowRight /> {positionMaxFrame}</>}</span>
							</div>
							<div className="overallLapSectors">
								<span>LAP | {gb.lapTimeFormat(chartsLap.time, true)}</span>
								<span>S1 | {gb.lapTimeFormat(chartsLap.s1, false)}</span>
								<span>S2 | {gb.lapTimeFormat(chartsLap.s2, false)}</span>
								<span>S3 | {gb.lapTimeFormat(chartsLap.time - chartsLap.s1 - chartsLap.s2, false)}</span>
							</div>
						</div>
						<div className="overallLapRest">
							<img style={{width: 340, height: 'fit-content', alignSelf: 'center'}} src={"/images/"+gb.carImages[session.car]} />
							<div className="pionowaKreska"/>
							<div className="lapTireType">
								<h3>Tire type</h3>
								<img src={"/images/"+gb.tireImages[chartsLap.tire]} />
								<b>{chartsLap.tire} [{chartsLap.tireC}]</b>
							</div>
							<div className="pionowaKreska"/>
							<div className="lapWeatherCondition">
								<h3>Weather</h3>
								słoneczko :) ZMIENIĆ
							</div>
						</div>
					</div>
					<div className="pionowaKreska" />
					<div className="lapTelemetry">
						<h3>Lap Telemetry</h3>
						<span>Top speed {topSpeed} kmh</span>
						<span>Average speed {(avgSpeed/x).toFixed(1)} kmh</span>
						<span>Average gas throttle input {(avgThrottle/x).toFixed(1)}%</span>
						<span>Average brake input {(avgBrake/x).toFixed(0)}%</span>
						<span>Tire degradation {(lastTireDegradation - initTireDegradation).toFixed(2)}%</span>
						<span>ERS burnt {session.data[chartsLap.maxF].statusPojazdu.wykorzystanyERS} Joules</span>
						<span>Car damage: yes/no</span>
					</div>
					<div className="pionowaKreska" />
					<div className="lapMinimap">
						<span>{gb.trackIds[session.track]} + flaga</span>
						<div className="lapMinimapImg">
							<img src={"/images/"+gb.trackMaps[session.track]} ref={setImgRef} />
							<canvas id="minimapCanvas" ref={setCanvasRef} className="lapMinimapCanvas"/>
						</div>
					</div>
				</div>
				<div className="lapCharts" id="lapCharts">
					<div className="lapChartsInside">
						<h3>Speed</h3>
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
						<h3>Throttle & Brake</h3>
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
						<h3>Steering</h3>
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
				{chartsLap && showCharts()}
			</div>
		</>
	)
};