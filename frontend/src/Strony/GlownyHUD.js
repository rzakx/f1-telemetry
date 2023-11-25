import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import gb from "../GlobalVars.js";
import Nawigacja from "../Nawigacja.js";
import {ReactComponent as Hamulec} from "../brake.svg";
const socket = io.connect('https://backend2.rzak.pl');

export default function GlownyHUD() {
	const [ dane, setDane ] = useState(null);
	const [ sprStorage, setSprStorage ] = useState(false);
	const [ ostatniTimestamp, setOstatniTimestamp ] = useState(Date.now());
	const okr = useRef(null);
	const dpr = window.devicePixelRatio;
	document.title = "f1-telemetry | Main";

	const sprawdzStorage = () => {
		const tmp = JSON.parse(localStorage.getItem('zapisane'));
		if(tmp){
			console.log("Wczytuje ostatnie zapisane dane");
			setDane(tmp);
		} else {
			console.log("Brak zapisanych danych do wczytania");
			setSprStorage(true);
		}
	};
	const zapiszStorage = () => {
		//console.log(Date.now(), "zapisuje");
		localStorage.setItem('zapisane', JSON.stringify(dane));
		setOstatniTimestamp(Date.now());
	};

	useEffect(() => {
		// socket.on("glowne", (v) => {
		socket.on(localStorage.getItem("login"), (v) => {
			rysuj(v.daneMotion.pozycjaX, v.daneMotion.pozycjaZ);
			if(v.daneOkrazenia.numerOkrazenia != v.daneOkrazenia.poprzedniNumerOkrazenia) noweOkr();
			setDane({...dane, ...v});
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

	return (
		<>
			<Nawigacja />
			{ dane ?
			<div className="screen"><div className="middle">
				<div className="naglowek">
					<div>
						<h1>POSITION {dane.daneOkrazenia.aktualnaPozycja}</h1>
						<h1>LAP {dane.daneOkrazenia.numerOkrazenia}</h1>
					</div>
					<div>
						<h1>LAP TIME</h1>
						<h3>CURRENT: {gb.lapTimeFormat(dane.daneOkrazenia.aktualneOkr, true) || "NULL"}</h3>
						<h3>PREVIOUS: {gb.lapTimeFormat(dane.daneOkrazenia.ostatnieOkr, true) || "NULL"}</h3>
					</div>
					<div className="sektory">
						<div className="sektor sektorZly">
							<h1>S1</h1>
							<h3>{dane.daneOkrazenia.sektor1 ? gb.lapTimeFormat(dane.daneOkrazenia.sektor1, false) : gb.lapTimeFormat(dane.daneOkrazenia.aktualneOkr, false)}</h3>
						</div>
						<div className="sektor">
							<h1>S2</h1>
							<h3>{dane.daneOkrazenia.sektor2 ? gb.lapTimeFormat(dane.daneOkrazenia.sektor2, false) : (dane.daneOkrazenia.sektor1 ? gb.lapTimeFormat(dane.daneOkrazenia.aktualneOkr - dane.daneOkrazenia.sektor1, false) : "") }</h3>
						</div>
						<div className="sektor">
							<h1>S3</h1>
							<h3>{(dane.daneOkrazenia.sektor1 && dane.daneOkrazenia.sektor2) ? gb.lapTimeFormat((dane.daneOkrazenia.aktualneOkr - dane.daneOkrazenia.sektor1 - dane.daneOkrazenia.sektor2), false) : ""}</h3>
						</div>
					</div>
				</div>
				<div className="glowne">
					<div className="slupki">
						<div className="slupek">
							<div className="slupekTlo"><div className="slupekSprzeglo" style={{transform: procentSlupek(dane.telemetria.sprzeglo/100)}}/></div>
							<div className="slupekTekst">Clutch<br/>{parseInt(dane.telemetria.sprzeglo || 0)}%</div>
						</div>
						<div className="slupek">
							<div className="slupekTlo"><div className="slupekGaz" style={{transform: procentSlupek(dane.telemetria.gaz)}}/></div>
							<div className="slupekTekst">Gas<br/>{parseInt(dane.telemetria.gaz*100 || 0)}%</div>
						</div>
						<div className="slupek">
							<div className="slupekTlo"><div className="slupekHamulec" style={{transform: procentSlupek(dane.telemetria.hamulec)}}/></div>
							<div className="slupekTekst">Brake<br />{parseInt(dane.telemetria.hamulec*100 || 0)}%</div>
						</div>
					</div>
					<div className="kierownica">
						<h4>STEERING WHEEL<br />{parseInt(dane.telemetria.kierownica*360/2)}°</h4>
						<div className="kierownicaImg" style={{rotate: `${parseInt(dane.telemetria.kierownica*360/2)}deg`}}/>
					</div>
					<div className="inne">
						<h1>{dane.telemetria.predkosc} KM/H</h1>
						<h2>GEAR {dane.telemetria.bieg}</h2>
						<h5>{dane.telemetria.obroty} RPM</h5>
						<br />
						<h4>Brake bias: {dane.statusPojazdu.balansHamulca}%</h4>
					</div>
					<div className="inne">
						<h5>ERS Deploy: {gb.nazwaTrybuERS[dane.statusPojazdu.trybERS]}</h5>
						<h4>ERS Battery: {(dane.statusPojazdu.dostepnyERS/40000).toFixed(1)}%</h4>
						<h6>{parseInt(dane.statusPojazdu.dostepnyERS/1000)} kJ ( used this lap: {parseInt(dane.statusPojazdu.wykorzystanyERS/1000)} kJ )</h6>
						<hr />
						<h5>Fuel Mix: {gb.trybPaliwo[dane.statusPojazdu.trybPaliwo]}</h5>
						<h4>Fuel tank: {dane.statusPojazdu.paliwoTank.toFixed(2)}kg</h4>
						<h6>~{dane.statusPojazdu.paliwoOkr.toFixed(2)} laps</h6>
					</div>
				</div>
				<div className="glowne">
				<div className="bolid">
					<div className="bolidFL">
						<div className="bolidRow"><Hamulec />{dane.telemetria.hamulecFL} °C</div>
						<div className="bolidRow"><div className="bolidIN" /> {dane.telemetria.inFL} °C</div>
						<div className="bolidRow"><div className="bolidOUT" /> {dane.telemetria.outFL} °C</div>
					</div>
					<div className="bolidFR">
						<div className="bolidRow"><Hamulec />{dane.telemetria.hamulecFR} °C</div>
						<div className="bolidRow"><div className="bolidIN" /> {dane.telemetria.inFR} °C</div>
						<div className="bolidRow"><div className="bolidOUT" /> {dane.telemetria.outFR} °C</div>
					</div>
					<div className="bolidRL">
						<div className="bolidRow"><Hamulec />{dane.telemetria.hamulecRL} °C</div>
						<div className="bolidRow"><div className="bolidIN" /> {dane.telemetria.inRL} °C</div>
						<div className="bolidRow"><div className="bolidOUT" /> {dane.telemetria.outRL} °C</div>
					</div>
					<div className="bolidRR">
						<div className="bolidRow"><Hamulec />{dane.telemetria.hamulecRR} °C</div>
						<div className="bolidRow"><div className="bolidIN" /> {dane.telemetria.inRR} °C</div>
						<div className="bolidRow"><div className="bolidOUT" /> {dane.telemetria.outRR} °C</div>
					</div>
					<div className="bolidEngine">
						Engine: {dane.telemetria.temperaturaSilnika}°C
					</div>
				</div>
					<div>
						<h1>Car Data</h1>
						Tyre age: {dane.statusPojazdu.oponyOkrazenia} laps<br />
						Tyre type: {gb.typOpon[dane.statusPojazdu.typOpon]} ({gb.typOponWizualnie[dane.statusPojazdu.typOponWizualne]})<br />
						Tyre wear: {dane.uszkodzenia.uszRL}% {dane.uszkodzenia.uszRR}% {dane.uszkodzenia.uszFL}% {dane.uszkodzenia.uszFR}%<br />
						<br />
						Front Wing Damage: Left {dane.uszkodzenia.skrzydloFL}%, Right {dane.uszkodzenia.skrzydloFR}%<br />
						Rear Wing Damage: {dane.uszkodzenia.skrzydloTyl}%<br />
						Floor Damage: {dane.uszkodzenia.podloga}%<br />
						Sidepod Damage: {dane.uszkodzenia.sidepod}%<br />
						Diffusor Damage: {dane.uszkodzenia.dyfuzor}%<br />
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
				{ (ostatniTimestamp + 1000*30 < Date.now()) && zapiszStorage() }
			</div></div>
			:
			<div className="screen"><div className="middle">
				{ sprStorage ? <span>Brak danych!</span> : sprawdzStorage() }
			</div></div>
		}
		</>
	);
}
