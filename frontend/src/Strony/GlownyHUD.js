import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import gb from "../GlobalVars.js";
import Nawigacja from "../Nawigacja.js";
import {ReactComponent as Hamulec} from "../brake.svg";
import LoadingIndicator from "../Components/LoadingIndicator.js";
const socket = io.connect('https://backend2.rzak.pl');

export default function GlownyHUD() {
	const [ daneUszkodzenia, setDaneUszkodzenia ] = useState({
		zuzycieRL: 0,
		zuzycieRR: 0,
		zuzycieFL: 0,
		zuzycieFR: 0,
		uszRL: 0,
		uszRR: 0,
		uszFL: 0,
		uszFR: 0,
		skrzydloFL: 0,
		skrzydloFR: 0,
		skrzydloTyl: 0,
		podloga: 0,
		dyfuzor: 0,
		sidepod: 0,
		usterkaDRS: 0,
		usterkaERS: 0,
		skrzynia: 0,
		silnik: 0,
		zuzycieMGUH: 0,
		zuzycieES: 0,
		zuzycieCE: 0,
		zuzycieICE: 0,
		zuzycieMGUK: 0,
		zuzycieTC: 0,
		wybuchSilnik: 0,
		zatartySilnik: 0
	});
	const [ daneStatusPojazdu, setDaneStatusPojazdu ] = useState({
		trakcja: 0,
		abs: 0,
		trybPaliwo: 0,
		balansHamulca: 0,
		pitLimiter: 0,
		paliwoTank: 0,
		paliwoMax: 0,
		paliwoOkr: 0,
		obrotyMax: 0,
		obrotyJalowe: 0,
		dostepDRS: 0,
		dystansDRS: 0,
		typOpon: 0,
		typOponWizualne: 0,
		oponyOkrazenia: 0,
		flaga: 0,
		dostepnyERS: 0,
		trybERS: 0,
		zebranyERSmguk: 0,
		zebranyERSmguh: 0,
		wykorzystanyERS: 0,
		pauzaSieciowa: 0,
	});
	const [ daneOkrazenia, setDaneOkrazenia ] = useState({
		ostatnieOkr: null,
		aktualneOkr: null,
		sektor1: 0,
		sektor2: 0,
		aktualnaPozycja: null,
		poprzedniNumerOkrazenia: -1,
		numerOkrazenia: null,
		anulowaneOkrazenie: null,
		lapDistance: null
	});
	const [ daneTelemetria, setDaneTelemetria ] = useState({
		aktywowanyDRS: 0,
		predkosc: 0,
		gaz: 0,
		kierownica: 0,
		hamulec: 0,
		sprzeglo: 0,
		bieg: 0,
		obroty: 0,
		hamulecRL: 0,
		hamulecRR: 0,
		hamulecFL: 0,
		hamulecFR: 0,
		outRL: 0,
		outRR: 0,
		outFL: 0,
		outFR: 0,
		inRL: 0,
		inRR: 0,
		inFL: 0,
		inFR: 0,
		temperaturaSilnika: 0,
		cisnienieRL: 0,
		cisnienieRR: 0,
		cisnienieFL: 0,
		cisnienieFR: 0,
		nawierzchniaRL: 0,
		nawierzchniaRR: 0,
		nawierzchniaFL: 0,
		nawierzchniaFR: 0,
		sugerowanyBieg: 0,
	});
	const [ sprData, setSprData ] = useState(false);
	const okr = useRef(null);
	const dpr = window.devicePixelRatio;
	document.title = "f1-telemetry | Realtime";

	useEffect(() => {
		// socket.on("glowne", (v) => {
		socket.on(localStorage.getItem("login"), (v) => {
			if(v.daneMotion){
				rysuj(v.daneMotion.pozycjaX, v.daneMotion.pozycjaZ);
				!sprData && setSprData(true);
			}
			if(v.daneOkrazenia){
				if(v.daneOkrazenia.numerOkrazenia != v.daneOkrazenia.poprzedniNumerOkrazenia) noweOkr();
				setDaneOkrazenia(v.daneOkrazenia);
				!sprData && setSprData(true);
			}
			if(v.uszkodzenia){
				setDaneUszkodzenia(v.uszkodzenia);
				!sprData && setSprData(true);
			}
			if(v.statusPojazdu){
				setDaneStatusPojazdu(v.statusPojazdu);
				!sprData && setSprData(true);
			}
			if(v.telemetria){
				setDaneTelemetria(v.telemetria);
				!sprData && setSprData(true);
			}
		});
	}, []);

	const procentSlupek = (co) => {
		if(co){
			let tmp = parseInt(-100*co);
			return `translateY(${tmp}%)`;
		} else {
			return `translateY(0)`;
		}
	};

	const ustawReferencje = (ref) => {
		if(!ref || okr.current){ return }
		okr.current = ref;
		//canvas o dużych wymiarach podczas rysowania figur powodują że są one zblurowane, a pixele są rozjechane
		//zmienna dpr ma za zadanie sfixować ten błąd
		const rect = okr.current.getBoundingClientRect();
		okr.current.width = rect.width * dpr ;
		okr.current.height = rect.height * dpr;
	};

	const rysuj = (posX, posZ) => {
		console.log(posX, posZ);
		if(!okr.current) return;
		const ctx = okr.current.getContext("2d");
		let tmpX = (posX+1000)/2000*okr.current.width;
		let tmpZ = (posZ+1000)/2000*okr.current.height;
		ctx.fillStyle = "#eee";
		ctx.beginPath();
		ctx.arc(tmpX, tmpZ, 2, 0, 2*Math.PI);
		ctx.fill();
		ctx.closePath();
		//console.log("rysuje tu", tmpX, tmpZ);
	};

	const noweOkr = () => {
		if(!okr.current) return;
		const ctx = okr.current.getContext("2d");
		ctx.beginPath();
		ctx.fillStyle = "#11111166";
		ctx.rect(0,0,500,300);
		ctx.fill();
		ctx.closePath();
		//console.log("NOWE OKR");
	};

	/* TODO:
		- zrobic useParams dla loginu, zeby moc ogladac telemetrie kogos innego
		- zrobic sprawdzenie czy uzytkownik ma dostep do czyjejs telemetrii
			(raczej bedzie nowa tabela w bazie, np. ID, kto, komu) i tutaj zrobic liste np. ze zwrotem użytkowników "kto", gdzie "komu" jest naszym loginem
			- jak zrobi sie podstrone dla Profilu użytkownika, to żeby tam użytkownik mógł nadawać i zabierać dostęp innym do Realtime hudu
	*/

	return (
		<>
			<Nawigacja />
			<div className="screen">
				<div className="middle" style={{overflow: 'hidden'}}>
					{ sprData ? "" :
					<div className="realtimeBrak">
						<LoadingIndicator text={`No data received yet 🙄\nStart driving or check telemetry settings.`} />
					</div>
					}
					<div className="naglowek">
						<div>
							<h1>POSITION {daneOkrazenia.aktualnaPozycja}</h1>
							<h1>LAP {daneOkrazenia.numerOkrazenia}</h1>
						</div>
						<div>
							<h1>LAP TIME</h1>
							<h3>CURRENT: {gb.lapTimeFormat(daneOkrazenia.aktualneOkr, true) || "NULL"}</h3>
							<h3>PREVIOUS: {gb.lapTimeFormat(daneOkrazenia.ostatnieOkr, true) || "NULL"}</h3>
						</div>
						<div className="sektory">
							<div className="sektor sektorZly">
								<h1>S1</h1>
								<h3>{daneOkrazenia.sektor1 ? gb.lapTimeFormat(daneOkrazenia.sektor1, false) : gb.lapTimeFormat(daneOkrazenia.aktualneOkr, false)}</h3>
							</div>
							<div className="sektor">
								<h1>S2</h1>
								<h3>{daneOkrazenia.sektor2 ? gb.lapTimeFormat(daneOkrazenia.sektor2, false) : (daneOkrazenia.sektor1 ? gb.lapTimeFormat(daneOkrazenia.aktualneOkr - daneOkrazenia.sektor1, false) : "") }</h3>
							</div>
							<div className="sektor">
								<h1>S3</h1>
								<h3>{(daneOkrazenia.sektor1 && daneOkrazenia.sektor2) ? gb.lapTimeFormat((daneOkrazenia.aktualneOkr - daneOkrazenia.sektor1 - daneOkrazenia.sektor2), false) : ""}</h3>
							</div>
						</div>
					</div>
					<div className="glowne">
						<div className="slupki">
							<div className="slupek">
								<div className="slupekTlo"><div className="slupekSprzeglo" style={{transform: procentSlupek(daneTelemetria.sprzeglo/100)}}/></div>
								<div className="slupekTekst">Clutch<br/>{parseInt(daneTelemetria.sprzeglo || 0)}%</div>
							</div>
							<div className="slupek">
								<div className="slupekTlo"><div className="slupekGaz" style={{transform: procentSlupek(daneTelemetria.gaz)}}/></div>
								<div className="slupekTekst">Gas<br/>{parseInt(daneTelemetria.gaz*100 || 0)}%</div>
							</div>
							<div className="slupek">
								<div className="slupekTlo"><div className="slupekHamulec" style={{transform: procentSlupek(daneTelemetria.hamulec)}}/></div>
								<div className="slupekTekst">Brake<br />{parseInt(daneTelemetria.hamulec*100 || 0)}%</div>
							</div>
						</div>
						<div className="kierownica">
							<h4>STEERING WHEEL<br />{parseInt(daneTelemetria.kierownica*360/2)}°</h4>
							<div className="kierownicaImg" style={{rotate: `${parseInt(daneTelemetria.kierownica*360/2)}deg`}}/>
						</div>
						<div className="inne">
							<h1>{daneTelemetria.predkosc} KM/H</h1>
							<h2>GEAR {daneTelemetria.bieg}</h2>
							<h5>{daneTelemetria.obroty} RPM</h5>
							<br />
							<h4>Brake bias: {daneStatusPojazdu.balansHamulca}%</h4>
						</div>
						<div className="inne">
							<h5>ERS Deploy: {gb.nazwaTrybuERS[daneStatusPojazdu.trybERS]}</h5>
							<h4>ERS Battery: {daneStatusPojazdu.dostepnyERS ? (daneStatusPojazdu.dostepnyERS/40000).toFixed(1) : 0}%</h4>
							<h6>{daneStatusPojazdu.dostepnyERS ? parseInt(daneStatusPojazdu.dostepnyERS/1000) : 0} kJ ( used this lap: {parseInt(daneStatusPojazdu.wykorzystanyERS/1000)} kJ )</h6>
							<hr />
							<h5>Fuel Mix: {gb.trybPaliwo[daneStatusPojazdu.trybPaliwo]}</h5>
							<h4>Fuel tank: {daneStatusPojazdu.paliwoTank ? daneStatusPojazdu.paliwoTank.toFixed(2) : 0}kg</h4>
							<h6>~{daneStatusPojazdu.paliwoOkr ? daneStatusPojazdu.paliwoOkr.toFixed(2) : 0} laps</h6>
						</div>
					</div>
					<div className="glowne">
					<div className="bolid">
						<div className="bolidFL">
							<div className="bolidRow"><Hamulec />{daneTelemetria.hamulecFL} °C</div>
							<div className="bolidRow"><div className="bolidIN" /> {daneTelemetria.inFL} °C</div>
							<div className="bolidRow"><div className="bolidOUT" /> {daneTelemetria.outFL} °C</div>
						</div>
						<div className="bolidFR">
							<div className="bolidRow"><Hamulec />{daneTelemetria.hamulecFR} °C</div>
							<div className="bolidRow"><div className="bolidIN" /> {daneTelemetria.inFR} °C</div>
							<div className="bolidRow"><div className="bolidOUT" /> {daneTelemetria.outFR} °C</div>
						</div>
						<div className="bolidRL">
							<div className="bolidRow"><Hamulec />{daneTelemetria.hamulecRL} °C</div>
							<div className="bolidRow"><div className="bolidIN" /> {daneTelemetria.inRL} °C</div>
							<div className="bolidRow"><div className="bolidOUT" /> {daneTelemetria.outRL} °C</div>
						</div>
						<div className="bolidRR">
							<div className="bolidRow"><Hamulec />{daneTelemetria.hamulecRR} °C</div>
							<div className="bolidRow"><div className="bolidIN" /> {daneTelemetria.inRR} °C</div>
							<div className="bolidRow"><div className="bolidOUT" /> {daneTelemetria.outRR} °C</div>
						</div>
						<div className="bolidEngine">
							Engine: {daneTelemetria.temperaturaSilnika}°C
						</div>
					</div>
						<div>
							<h1>Car Data</h1>
							Tyre age: {daneStatusPojazdu.oponyOkrazenia} laps<br />
							Tyre type: {gb.typOpon[daneStatusPojazdu.typOpon]} ({gb.typOponWizualnie[daneStatusPojazdu.typOponWizualne]})<br />
							Tyre wear: {daneUszkodzenia.uszRL}% {daneUszkodzenia.uszRR}% {daneUszkodzenia.uszFL}% {daneUszkodzenia.uszFR}%<br />
							<br />
							Front Wing Damage: Left {daneUszkodzenia.skrzydloFL}%, Right {daneUszkodzenia.skrzydloFR}%<br />
							Rear Wing Damage: {daneUszkodzenia.skrzydloTyl}%<br />
							Floor Damage: {daneUszkodzenia.podloga}%<br />
							Sidepod Damage: {daneUszkodzenia.sidepod}%<br />
							Diffusor Damage: {daneUszkodzenia.dyfuzor}%<br />
						</div>
					</div>
					<div className="glowne">
						<div>
							<h3>Minimap</h3>
							<canvas className="minimapa" ref={ustawReferencje} />
						</div>
						<div>
							<h3>ENVIRONMENT INFORMATIONS</h3>
							<h5>work in progress</h5>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
