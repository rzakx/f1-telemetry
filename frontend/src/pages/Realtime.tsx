import React, { useRef, useState, useEffect, memo, type RefObject, type SetStateAction, type Dispatch, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { backendURL, fuelMixture, getTeamById, minimapMapping, trackMap, trackNameById, weatherType } from "@/GlobalVars";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ICarDamageData, ICarMotion, ICarMotionExtra, ICarStatusData, ICarTelemetryData, ICustomParticipants, ILapData, ILapHistoryData, ILiveryColour } from "@/interfaces/f1struct";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ersModeNames, lapTimeFormat, tireName, tireNameVisual } from "@/GlobalVars";
// import { Label } from "@/components/ui/label";
import ChartSpeedGear from "@/components/ChartSpeedGear";
import ChartGasBrake from "@/components/ChartGasBrake";
// import ChartGForce from "@/components/ChartGForce";
import ChartWheelSlipRatio from "@/components/ChartWheelSlipRatio";
import ChartFloorHeight from "@/components/ChartFloorHeight";
// import lttb from "@/hooks/optimizeChart";
import { WiDaySunny, WiDaySunnyOvercast, WiCloud, WiShowers, WiRain, WiThunderstorm, WiNa} from "react-icons/wi";
import CustomLoading from "@/components/CustomLoading";
import ChartGForce from "@/components/ChartGForce";
import BrakeIcon from "@/components/BrakeIcon";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { CardAction, CardHeader, CardTitle } from "@/components/ui/card";

interface ICustomSessionData {
	totalLaps: number,
	trackId: number,
	safetyCarStatus: number,
	weather: number,
	trackTemperature: number,
	airTemperature: number,
	sessionType: number,
	// sessionTimeLeft: number,
	sector2: number,
	sector3: number,
	trackLength: number
};

const driverStatus = (val: number) => {
	if (val === 0) return "In Garage"
	if (val === 1) return "Flying Lap"
	if (val === 2) return "Return Lap"
	if (val === 3) return "Out Lap"
	if (val === 4) return "On track"
};

const WeatherIcon = ({weatherId, className}: {weatherId: number | undefined} & React.ComponentProps<"div">) => {
	switch (weatherId) {
		case 0:
			return <WiDaySunny className={className} style={{ fill: '#ffe812', filter: 'drop-shadow(0 0 12px #ffe81255)' }} />
		case 1:
			return <WiDaySunnyOvercast className={className} style={{ fill: '#ffed81', filter: 'drop-shadow(0 0 12px #ffed8155)' }} />
		case 2:
			return <WiCloud className={className} style={{ fill: '#ccc', filter: 'drop-shadow(0 0 12px #cccccc55)' }} />
		case 3:
			return <WiShowers className={className} style={{ fill: '#85c3ff', filter: 'drop-shadow(0 0 12px #85c3ff55)' }} />
		case 4:
			return <WiRain className={className} style={{ fill: '#2d98ff', filter: 'drop-shadow(0 0 12px #2d98ff55)' }} />
		case 5:
			return <WiThunderstorm className={className} style={{ fill: '#0169cd', filter: 'drop-shadow(0 0 12px #0169cd55)' }} />
		default:
			return <WiNa className={className} style={{ fill: '#ed143d', filter: 'drop-shadow(0 0 12px #ed143d55)' }} />
	}
};

const carColor = (teamId: number, liveryColors: ILiveryColour) => {
	return teamId < 10 ? getTeamById[teamId].color : `rgb(${liveryColors.red}, ${liveryColors.green}, ${liveryColors.blue})`;
};

const TrackCard = memo( function TrackCard({ trackId, weather, airTemp, trackTemp, carMotion, carColors, myIndex, refreshRate }: { carColors: {carId: number, color?: string}[], trackId: number | undefined, weather: number | undefined, airTemp: number | undefined, trackTemp: number | undefined, carMotion: RefObject<ICarMotion[]>, myIndex: number | undefined, refreshRate: number }) {
	const imgRef = useRef<HTMLImageElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [ tick, setSubtick ] = useState<number>(0);

	// useEffect(() => console.log("minimap colors changed"), [carColors]);

	const drawPosition = useCallback(() => {
		if(myIndex === undefined) return;
		if (!canvasRef.current) {
			console.log("Empty canvasRef");
			return;
		}
		if (!imgRef.current) {
			console.log("Empty imgRef");
			return;
		}
		if (!carMotion.current.length) {
			console.log("motionData puste");
			return;
		}
		if (trackId === undefined) {
			console.log("Unknown trackId");
			return;
		}
		const minimapImg: HTMLImageElement = imgRef.current;
		const canvas: HTMLCanvasElement = canvasRef.current;
		const rect = minimapImg.getBoundingClientRect();
		canvas.style.width = rect.width + "px";
		canvas.style.height = rect.height + "px";
		canvas.width = rect.width;
		canvas.height = rect.height;

		const canvasX = canvas.width;
		const canvasY = canvas.height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const [offsetX, offsetY, mapWidth, mapHeight] = minimapMapping[trackId];
		ctx.clearRect(0, 0, canvasX * 1.1, canvasY * 1.1);

		carMotion.current.forEach((driver, index) => {
			if (index == myIndex) return; // own position should be on top layer
			ctx.beginPath();
			const posX = driver.worldPositionX;
			const posY = driver.worldPositionZ;
			const tmpX = (posX - offsetX) / mapWidth * canvas.width;
			const tmpY = (posY - offsetY) / mapHeight * canvas.height;
			ctx.arc(tmpX - 3, tmpY - 3, 6, 0, 6 * Math.PI);
			ctx.fillStyle = carColors[index]?.color ?? "#fff";
			ctx.strokeStyle = "#000";
			ctx.shadowColor = "#000";
			ctx.shadowBlur = 2;
			ctx.stroke();
			ctx.fill();
			ctx.closePath();
		})
		ctx.beginPath();
		const posX = carMotion.current[myIndex].worldPositionX;
		const posY = carMotion.current[myIndex].worldPositionZ;
		const tmpX = (posX - offsetX) / mapWidth * canvas.width;
		const tmpY = (posY - offsetY) / mapHeight * canvas.height;
		ctx.arc(tmpX - 3, tmpY - 3, 6, 0, 6 * Math.PI);
		ctx.fillStyle = carColors[myIndex]?.color ?? "#fff";
		ctx.strokeStyle = "#fff";
		ctx.shadowColor = "#fff";
		ctx.shadowBlur = 2;
		ctx.stroke();
		ctx.fill();
		ctx.closePath();
		return;
	}, [carColors, carMotion, myIndex, trackId]);

	useEffect(() => {
		const intval = setInterval(() => {
			drawPosition();
			setSubtick(t => t + 1);
		}, 1000/refreshRate);
		return () => clearInterval(intval);
	}, [refreshRate, drawPosition]);

	return (
		<div className="bg-card text-card-foreground rounded-xl border p-4 flex flex-col justify-center gap-3 min-w-[320px] grow max-w-[500px]">
			<div className="flex justify-between w-full gap-3">
				<div>
					<h3 className="font-semibold tracking-wide text-sm">Location ({tick})</h3>
					<p className="font-black text-accent-foreground tracking-widest text-xl -mt-1">{trackId !== undefined ? trackNameById[trackId] : "Unknown"}</p>
				</div>
				<div className="grid grid-rows-2 gap-1 -mt-1">
					<div className="row-start-1 col-start-1 text-xs font-semibold content-end">Track: {trackTemp ?? "??"} °C</div>
					<div className="row-start-2 col-start-1 text-xs font-semibold content-start">Air: {airTemp ?? "??"} °C</div>
					<div className="row-span-2 col-start-2 row-start-1 text-center">
						<WeatherIcon weatherId={weather} className="w-10 h-10 mx-auto -mb-1" />
						<p className="uppercase text-xs font-black tracking-widest">{weather !== undefined ? weatherType[weather] : "Unknown"}</p>
					</div>
				</div>
			</div>
			<div className="w-full flex relative grow items-center justify-center">
				{ trackId !== undefined ? <>
				<img ref={imgRef} className="absolute w-fit h-fit max-w-full max-h-full" src={'/images/' + trackMap[trackId]} />
				<canvas className="absolute z-10" ref={canvasRef} />
				</> : <p className="font-black text-xl tracking-widest text-center">Minimap not available</p> }
			</div>
		</div>
	);
});

const brakeColor = (temp: number) => {
	if(temp <= 200) return "dodgerblue";
	if(temp <= 400) return "var(--color-green-400)"
	if(temp <= 800) return "goldenrod";
	return "crimson";
};

const tireColor = (tireType: number, tireTemp: number) => {
	// soft
	if(tireNameVisual[tireType] === "Soft"){
		if(tireTemp > 120) return "var(--color-red-500)"
		if(tireTemp > 90) return "var(--color-green-500)"
		return "var(--color-blue-500)"
	} else {
		return "var(--color-purple-500)"
	}
};

const DamageCard = memo( function({carDamage, carTelemetry, myIndex, refreshRate }: {carTelemetry: RefObject<ICarTelemetryData[]>, carDamage: RefObject<ICarDamageData[]>, myIndex: number | undefined, refreshRate: number } ) {
	const [ _, setSubtick ] = useState<number>(0);

	useEffect(() => {
		const intval = setInterval(() => {
			setSubtick(t => t + 1);
		}, 1000/refreshRate);
		return () => clearInterval(intval);
	}, [refreshRate]);

	return (
		<div className="bg-card text-card-foreground rounded-xl border p-3 col-start-2 row-start-3 row-span-2 flex flex-col min-w-84 text-xs">
			<h3 className="font-semibold tracking-widest text-sm">Damage & Tire Info</h3>
			{ myIndex !== undefined ?
			<>
			<div className="flex justify-evenly text-center font-semibold tracking-widest mt-2">
				<div className="px-2 py-1 border-1 border-white">
					<p>Left Wing</p>
					<p>{carDamage.current[myIndex]?.frontLeftWingDamage ?? "??"}%</p>
				</div>
				<div className="py-1 px-2 border-1 border-white">
					<p>Right Wing</p>
					<p>{carDamage.current[myIndex]?.frontRightWingDamage ?? "??"}%</p>
				</div>
			</div>
			<div className="h-[400px] flex p-3 gap-1 font-semibold tracking-widest">
				<div className="min-w-22 relative">
					{/* Front Left */}
					<div className="absolute top-[6%] w-full text-xs px-3 py-2 space-y-1 rounded-2xl bg-white/30 shadow-[inset_0_0_6px_0] shadow-card">
						<div className="flex items-center gap-2 justify-between">
							<HiWrenchScrewdriver className="w-4 h-4 inline" />
							<p>{carDamage.current[myIndex]?.tyresWear[0]?.toFixed(0) ?? "??"}%</p>
						</div>
						<div className="flex items-center gap-2 justify-between">
							<div
								className="inline-block w-4 h-4 rounded-full bg-zinc-900 border-3 transition-colors drop-shadow-[0_0_2px_black]"
								style={{borderColor: tireColor(16, carTelemetry.current[myIndex]?.tyresSurfaceTemperature[0])}}
							/>
							<p>{carTelemetry.current[myIndex]?.tyresSurfaceTemperature[0] ?? "??"}°C</p>
						</div>
						<div className="flex items-center gap-2 justify-between">
							<div
								className="inline-block w-4 h-4 rounded-full border-2 border-zinc-900 transition-colors"
								style={{ backgroundColor: tireColor(16, carTelemetry.current[myIndex]?.tyresInnerTemperature[0]) }}
							/>
							<p>{carTelemetry.current[myIndex]?.tyresInnerTemperature[0] ?? "??"}°C</p>
						</div>
						<div className="flex items-center gap-2 justify-between">
							<BrakeIcon
								className="w-4 h-4 drop-shadow-[0_0_2px_black]"
								color={brakeColor(carTelemetry.current[myIndex]?.brakesTemperature[0])}
							/>
							<p>{carTelemetry.current[myIndex]?.brakesTemperature[0] ?? "??"}°C</p>
						</div>
					</div>
					{/* Rear Left */}
					<div className="absolute bottom-[0%] w-full text-xs px-3 py-2 space-y-1 rounded-2xl bg-white/30 shadow-[inset_0_0_6px_0] shadow-card">
						<div className="flex items-center gap-1 justify-between">
							<HiWrenchScrewdriver className="w-4 h-4 inline" />
							<p>{carDamage.current[myIndex]?.tyresWear[2]?.toFixed(0) ?? "??"}%</p>
						</div>
						<div className="flex items-center gap-1 justify-between">
							<div
								className="inline-block w-4 h-4 rounded-full bg-zinc-900 border-3 transition-colors drop-shadow-[0_0_2px_black]"
								style={{borderColor: tireColor(16, carTelemetry.current[myIndex]?.tyresSurfaceTemperature[2])}}
							/>
							<p>{carTelemetry.current[myIndex]?.tyresSurfaceTemperature[2] ?? "??"}°C</p>
						</div>
						<div className="flex items-center gap-1 justify-between">
							<div
								className="inline-block w-4 h-4 rounded-full border-2 border-zinc-900 transition-colors"
								style={{backgroundColor: tireColor(16, carTelemetry.current[myIndex]?.tyresInnerTemperature[2])}}
							/>
							<p>{carTelemetry.current[myIndex]?.tyresInnerTemperature[2] ?? "??"}°C</p>
						</div>
						<div className="flex items-center gap-1 justify-between">
							<BrakeIcon className="w-4 h-4 drop-shadow-[0_0_2px_black]" color={brakeColor(carTelemetry.current[myIndex]?.brakesTemperature[2])} />
							<p>{carTelemetry.current[myIndex]?.brakesTemperature[2] ?? "??"}°C</p>
						</div>
					</div>
				</div>
				<img src="/images/bolid.png" className="h-full opacity-100" />

				<div className="relative min-w-22">
					{/* Front Right */}
					<div className="absolute top-[6%] w-full text-xs px-3 py-2 space-y-1 rounded-2xl bg-white/30 shadow-[inset_0_0_6px_0] shadow-card">
						<div className="flex items-center gap-1 justify-between">
							<p>{carDamage.current[myIndex]?.tyresWear[1]?.toFixed(0) ?? "??"}%</p>
							<HiWrenchScrewdriver className="w-4 h-4 inline" />
						</div>
						<div className="flex items-center gap-1 justify-between">
							<p>{carTelemetry.current[myIndex]?.tyresSurfaceTemperature[1] ?? "??"}°C</p>
							<div
								className="inline-block w-4 h-4 rounded-full bg-zinc-900 border-3 transition-colors drop-shadow-[0_0_2px_black]"
								style={{borderColor: tireColor(16, carTelemetry.current[myIndex]?.tyresSurfaceTemperature[1])}}
							/>
						</div>
						<div className="flex items-center gap-1 justify-between">
							<p>{carTelemetry.current[myIndex]?.tyresInnerTemperature[1] ?? "??"}°C</p>
							<div
								className="inline-block w-4 h-4 rounded-full border-2 border-zinc-900 transition-colors"
								style={{backgroundColor: tireColor(16, carTelemetry.current[myIndex]?.tyresInnerTemperature[1])}}
							/>
						</div>
						<div className="flex items-center gap-1 justify-between">
							<p>{carTelemetry.current[myIndex]?.brakesTemperature[1] ?? "??"}°C</p>
							<BrakeIcon
								className="w-4 h-4 drop-shadow-[0_0_2px_black]"
								color={brakeColor(carTelemetry.current[myIndex]?.brakesTemperature[1])}
							/>
						</div>
					</div>
					{/* Rear Right */}
					<div className="absolute bottom-[0%] w-full text-xs px-3 py-2 space-y-1 rounded-2xl bg-white/30 shadow-[inset_0_0_6px_0] shadow-card">
						<div className="flex items-center gap-1 justify-between">
							<p>{carDamage.current[myIndex]?.tyresWear[3]?.toFixed(0) ?? "??"}%</p>
							<HiWrenchScrewdriver className="w-4 h-4" />
						</div>
						<div className="flex items-center gap-1 justify-between">
							<p>{carTelemetry.current[myIndex]?.tyresSurfaceTemperature[3] ?? "??"}°C</p>
							<div
								className="w-4 h-4 rounded-full bg-zinc-900 border-3 transition-colors drop-shadow-[0_0_2px_black]"
								style={{borderColor: tireColor(16, carTelemetry.current[myIndex]?.tyresSurfaceTemperature[3])}}
							/>
						</div>
						<div className="flex items-center gap-1 justify-between">
							<p>{carTelemetry.current[myIndex]?.tyresInnerTemperature[3] ?? "??"}°C</p>
							<div
								className="w-4 h-4 rounded-full border-2 border-zinc-900 transition-colors"
								style={{backgroundColor: tireColor(16, carTelemetry.current[myIndex]?.tyresInnerTemperature[3])}}
							/>
						</div>
						<div className="flex items-center gap-1 justify-between">
							<p>{carTelemetry.current[myIndex]?.brakesTemperature[3] ?? "??"}°C</p>
							<BrakeIcon
								className="w-4 h-4 drop-shadow-[0_0_2px_black]"
								color={brakeColor(carTelemetry.current[myIndex]?.brakesTemperature[3])}
							/>
						</div>
					</div>
				</div>
			</div>
			<div className="flex justify-evenly text-center font-semibold tracking-widest">
				<div className="px-2 py-1 border-1 border-white">
					<p>Rear Wing</p>
					<p>{carDamage.current[myIndex]?.rearWingDamage ?? "??"}%</p>
				</div>
				<div className="py-1 px-2 border-1 border-white">
					<p>Diffuser</p>
					<p>{carDamage.current[myIndex]?.diffuserDamage ?? "??"}%</p>
				</div>
			</div>
			</>
			: "Waiting for car index value" }
		</div>
	)
});

const ActiveCarCard = memo( function({ lapData, carTelemetry, carStatus, maxLaps, refreshRate, myIndex }: { lapData: RefObject<ILapData[]>, carTelemetry: RefObject<ICarTelemetryData[]>, maxLaps?: number | undefined, carStatus: RefObject<ICarStatusData[]>, refreshRate: number, myIndex: number | undefined }) {
	const [ tick, setSubtick ] = useState<number>(0);

	useEffect(() => {
		const intval = setInterval(() => {
			setSubtick(t => t + 1);
		}, 1000/refreshRate);
		return () => clearInterval(intval);
	}, [refreshRate]);

	return (
		<div className="bg-card text-card-foreground rounded-xl border p-4 min-w-[320px] max-w-[380px] text-sm max-[1400px]:text-xs">
			{ myIndex === undefined ? "Waiting for car index value"
			:
			<>
			<div className="h-36 gap-3 flex w-full justify-between">
					<div className="flex flex-col text-center gap-0.5">
						<div className="w-12 grow bg-zinc-300 relative overflow-hidden rounded-xs">
							<div className={`absolute bg-red-600 w-full h-full transition-transform`} style={{ transform: `translateY(${(1 - (carTelemetry.current[myIndex] ? carTelemetry.current[myIndex].brake : 0) / 1) * 100}%)` }} />
							<div className="absolute top-1/2 -translate-1/2 left-1/2 font-medium text-xs mix-blend-difference text-white">{(carTelemetry.current[myIndex] ? carTelemetry.current[myIndex].brake * 100 : 0).toFixed(0)}%</div>
						</div>
						<div className="font-medium tracking-wide">Brake</div>
					</div>
					<div className="flex flex-col justify-between items-center pt-5 grow min-w-[140px] max-w-[180px]">
						<img src="/images/steeringWheel.png" className="h-[64px] transition-transform duration-100" style={{rotate: `${(carTelemetry.current[myIndex]?.steer || 0)*135}deg` }} />
						<div className="w-full text-center">
							<div className="-mb-0.5 text-xs">{((carTelemetry.current[myIndex]?.steer || 0) * 100).toFixed(0)}%</div>
							<div className="flex items-center gap-1 w-full">
								<span className="text-xs font-black">L</span>
								<div className="w-full h-2.5 rounded-xs bg-zinc-800 border-2 border-zinc-600 relative">
									<div className="absolute top-0 bottom-0 bg-purple-500 transition-[width] rounded-xs" style={
										(carTelemetry.current[myIndex]?.steer || 0) >= 0 ?
										{left: '50%', width: `${((carTelemetry.current[myIndex]?.steer || 0) * 50).toFixed(0)}%`} :
										{right: '50%', width: `${((carTelemetry.current[myIndex]?.steer || 0) * -50).toFixed(0)}%`}
									} />
									<div className="absolute left-1/2 top-0 bottom-0 bg-purple-200 w-0.5 -translate-x-1/2" />
								</div>
								<span className="text-xs font-black">R</span>
							</div>
							<div className="font-medium tracking-wide">Steer</div>
						</div>
					</div>
					<div className="flex flex-col text-center gap-0.5">
						<div className="w-12 grow bg-zinc-300 relative overflow-hidden rounded-xs">
							<div className={`absolute bg-green-700 w-full h-full transition-transform`} style={{ transform: `translateY(${(1 - (carTelemetry.current[myIndex] ? carTelemetry.current[myIndex].throttle : 0) / 1) * 100}%)` }} />
							<div className="absolute top-1/2 -translate-1/2 left-1/2 font-medium text-xs mix-blend-difference text-white">{(carTelemetry.current[myIndex] ? carTelemetry.current[myIndex].throttle * 100 : 0).toFixed(0)}%</div>
						</div>
						<div className="font-medium tracking-wide">Throttle</div>
					</div>
			</div>
			<div>
				{carTelemetry.current[myIndex]?.speed || 0} km/h
				{carTelemetry.current[myIndex]?.engineRPM || 0} rpm
				{carTelemetry.current[myIndex]?.gear || 0}
			</div>
				<div>Brake bias: {carStatus.current[myIndex]?.frontBrakeBias || 0} %</div>
				<div>ERS: {((carStatus.current[myIndex]?.ersStoreEnergy || 0) / 40000).toFixed(0)}% [{ersModeNames[(carStatus.current[myIndex]?.ersDeployMode || 0)]}]</div>
				<div className="flex flex-col gap-1">
					<span>Paliwo: {carStatus.current[myIndex]?.fuelInTank ? carStatus.current[myIndex]?.fuelInTank.toFixed(2) : 0} litrów</span>
					<span>Tryb mieszanki: {fuelMixture[carStatus.current[myIndex]?.fuelMix] || "Unknown"}</span>
					<span>Szacowany nadmiar paliwa: { carStatus.current[myIndex]?.fuelRemainingLaps ? `~${( carStatus.current[myIndex].fuelRemainingLaps).toFixed(2)} laps` : "Unknown" } </span>
					<span>tick: {tick}</span>
				</div>
			{ lapData.current[myIndex] &&
				<div className="space-x-2">
					<span>Pos {lapData.current[myIndex].carPosition || "??"}</span>
					<span>Lap {lapData.current[myIndex].currentLapNum || "??"} / {maxLaps}</span>
				</div>
			}
			</>
			}
		</div>
	)
});

const ParticipantsCard = memo(
	function({refreshRate, lapData, participants, carDamage, carStatus, bestLapTimes, myIndex}: {
		refreshRate: number,
		lapData: RefObject<ILapData[]>,
		participants: RefObject<ICustomParticipants[]>,
		carDamage: RefObject<ICarDamageData[]>,
		bestLapTimes: RefObject<Record<number, ILapHistoryData>>,
		carStatus: RefObject<ICarStatusData[]>, myIndex: number | undefined
	}) {
	const [ _, setSubtick ] = useState<number>(0);

	useEffect(() => {
		const intval = setInterval(() => {
			setSubtick(t => t + 1);
		}, 1000/refreshRate);
		return () => clearInterval(intval);
	}, [refreshRate]);

	return (
		<div className="bg-card col-start-3 row-start-3 row-span-2 overflow-auto">
			{
				lapData.current.length && participants.current.length ?
					<Table>
						<TableHeader><TableRow>
							<TableHead>Pos</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Delta</TableHead>
							<TableHead>ERS</TableHead>
							<TableHead>ERS Deploy</TableHead>
							<TableHead>Tyre</TableHead>
							<TableHead>Tyre Wear</TableHead>
							<TableHead>Last Lap</TableHead>
							<TableHead>Best Lap</TableHead>
							<TableHead>Driver Status</TableHead>
						</TableRow></TableHeader>
						<TableBody className="text-xs">
							{participants.current.sort((a, b) => lapData.current[a.carId].carPosition - lapData.current[b.carId].carPosition).map((driver) => {
								if(!driver.name) return;
								// const carColor = driver.teamId < 10 ? getTeamById[driver.teamId].color : `rgb(${driver.liveryColours[1].red}, ${driver.liveryColours[1].green}, ${driver.liveryColours[1].blue})`;
								// console.log(carColor);
								return (
									<TableRow key={`${driver.name}_${driver.carId}`} className={`${driver.carId === myIndex ? "bg-zinc-700" : ""}`}>
										<TableCell className="relative pl-4"><div className="absolute left-1 top-1 bottom-1 w-1 ring ring-black/25" style={{backgroundColor: carColor(driver.teamId, driver.liveryColours[1])}}/> {lapData.current[driver.carId].carPosition}</TableCell>
										<TableCell>{driver.ai && <div className="px-1 rounded-xs text-[0.7rem] inline-flex border border-zinc-600 mr-1">AI</div>} {driver.carId === myIndex && <div className="px-1 rounded-xs text-[0.7rem] inline-flex bg-green-600 border border-zinc-600 mr-1">YOU</div>} {driver.name}</TableCell>
										<TableCell className="text-right">{lapData.current[driver.carId].deltaToCarInFrontMSPart || lapData.current[driver.carId].deltaToCarInFrontMSPart ? `+${lapData.current[driver.carId].deltaToCarInFrontMinutesPart ? lapData.current[driver.carId].deltaToCarInFrontMinutesPart + ":" : ""}${(lapData.current[driver.carId].deltaToCarInFrontMSPart / 1000).toFixed(3)}` : lapData.current[driver.carId].resultStatus === 7 ? "Retired" : lapData.current[driver.carId].resultStatus === 5 ? "DSQ" : lapData.current[driver.carId].resultStatus === 4 ? "DNF" : "-"} </TableCell>
										<TableCell>{carStatus.current.length ? `${(carStatus.current[driver.carId].ersStoreEnergy / 40000).toFixed(0)}%` : "??%"}</TableCell>
										<TableCell>{carStatus.current.length ? ersModeNames[carStatus.current[driver.carId].ersDeployMode] : "Unknown"}</TableCell>
										<TableCell>{carStatus.current.length ? tireNameVisual[carStatus.current[driver.carId].visualTyreCompound] : "?"} {carStatus.current.length ? `(${tireName[carStatus.current[driver.carId].actualTyreCompound]})` : "(?)"}</TableCell>
										<TableCell>{carDamage.current.length ? `${Math.round(carDamage.current[driver.carId].tyresWear.reduce((a: number, b: number) => a + b, 0) / 4)}%` : ""} {carStatus.current.length ? carStatus.current[driver.carId].tyresAgeLaps + " laps" : ""}</TableCell>
										<TableCell>{lapTimeFormat(lapData.current[driver.carId].lastLapTimeInMS, true)}</TableCell>
										<TableCell>{bestLapTimes.current[driver.carId] ? bestLapTimes.current[driver.carId].lapTimeInMS ? lapTimeFormat(bestLapTimes.current[driver.carId].lapTimeInMS, true) : "Not set" : "Unknown"}</TableCell>
										<TableCell>{driverStatus(lapData.current[driver.carId].driverStatus)}</TableCell>
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
					: "Not available"
			}
		</div>
	)
});

interface IChartGForce { lapDistance: number, lateral: number, longitudinal: number, lapNum: number };
interface IChartFloor { front: number, rear: number, lapDistance: number, lapNum: number };
interface IChartWheelSlip { wheelSlipRatioFront: number, wheelSlipRatioRear: number, lapDistance: number, lapNum: number };
interface IChartGasBrake { throttle: number, brake: number, lapDistance: number, lapNum: number };
interface IChartSpeedGear { lapDistance: number, speed: number, gear: number, lapNum: number };

const Realtime = () => {

	/*
	THIS PAGE DOES INTENSIVE DATA EXCHANGE AND MUTATION:
	example scenario: packets author has telemetry in-game interval set to 60Hz
	reason: worst case 60 re-renders PER type of packet PER second
	
	solution and steps done:
	- receive socket events and set the data in useRef hook, force specific components refresh rate to be constant at much lower values, ex. 2 or 10 Hz
		- refs instead of states, because of straightforward, less performance cost mutations, allowing for manual re-renders
	- data received and required for charts is added in chunks/batches, causing less re-renders

	possible additional optimizations:
		- useCallback for functions,
		- currently refs for chart data store data in chunks which are then pushed into state, it would be cool to
			store multiple laps in refs chart data, and use state for useMemo combined with lap number index and chartRef[lap number index].length ???
			and then pass to chart components that useMemo value
	*/

	/* TODO LIST:
	- make sure track svg paths are correct
	- apply some padding to track svgs (currently, bounds are too close and car markers are overflowing and being cut)
	- abu dhabi and 2 other tracks svg are not yet generated,
	- redesign active car card and add DRS strike distance and DRS usage indicators
	- redesign car damage card, flip the car image so it takes less height and more width, include sidepods and floor damage values, include current tire info and available sets of tires
	- update track card, add info about session time left and type of sessios
	- participants card - add info about drivers penalties and warnings, currently example: i'm pos 2 and have delta to 1st pos equal ~2sec, but 1st car has 5sec penalty, when drivers keep the same pace, i would finish 1st, but currently we dont know about any penalties, thinking we will end up 2nd pos
	- performance optimization:
		- those included above...
		- previously i created LTTB downsampling method, mainly - it was reducing chart data size from X values to fraction of X values, trying to maintain the original shape, it could be useful to apply during useMemo for chart final data
	- create fetch function for available other drivers telemetry access
	- at least make RWD for small PC screens or tablets, that page is nowhere useful on mobile phones...

	*/

	const [myIndex, setMyIndex] = useState<number | undefined>(undefined);
	const [ sessionInfo, setSessionInfo ] = useState<ICustomSessionData>();

	const lapData = useRef<ILapData[]>([]);
	const participants = useRef<ICustomParticipants[]>([]);
	const [ carColors, setCarColors] = useState<{carId: number, color?: string}[]>([]);
	const carDamage = useRef<ICarDamageData[]>([]);
	const carStatus = useRef<ICarStatusData[]>([]);
	const bestLapTimes = useRef<Record<number, ILapHistoryData>>({});
	const carMotion = useRef<ICarMotion[]>([]);
	const carTelemetry = useRef<ICarTelemetryData[]>([]);

	const [chartGasBrake, setChartGasBrake] = useState<{ lapNumber: number, data: IChartGasBrake[]}[]>([]);
	const chartGasBrakeBatch = useRef<IChartGasBrake[]>([]);
	
	const [chartWheelSlipRatio, setChartWheelSlipRatio] = useState<{ lapNumber: number, data: IChartWheelSlip[] }[]>([]);
	const chartWheelSlipRatioBatch = useRef<IChartWheelSlip[]>([]);
	
	const [chartSpeedGear, setChartSpeedGear] = useState<{ lapNumber: number, data: IChartSpeedGear[] }[]>([]);
	const chartSpeedGearBatch = useRef<IChartSpeedGear[]>([]);
	
	const chartFloorHeightBatch = useRef<IChartFloor[]>([]);
	const [chartFloorHeight, setChartFloorHeight] = useState<{ lapNumber: number, data: IChartFloor[] }[]>([]);

	const chartGForceBatch = useRef<IChartGForce[]>([]);
	const [chartGForce, setChartGForce] = useState< { lapNumber: number, data: IChartGForce[] }[] >([]);
	const currentLapDistance = useRef<number>(0);
	// const currentLapNumber = myIndex === undefined ? undefined : lapData.current.length ? lapData.current[myIndex]?.currentLapNum || 0 : undefined;
	// const [ lapNumber, setLapNumber ] = useState<{previous: number, current: number}>({previous: 0, current: 0});
	const lapNumber = useRef<{previous: number, current: number}>({previous: 0, current: 0});
	
	const [ viewLapNum, setViewLapNum ] = useState<string>("");

	const { user } = useAuth();
	const [driverSelect, setDriverSelect] = useState<string>(user?.login || "");
	const prevDriver = useRef("");
	const [socketConnected, setSocketConnected] = useState(false);
	const socketRef = useRef<Socket>(null);

	// const batchSize = useMemo(() => Math.round((sessionInfo?.trackLength || 6000) / 200), [sessionInfo?.trackLength]);
	const batchSize = 60;
	// const reducedBatchSize = 7;

	// const random = Math.random();
	const chartDataHandler = <T extends IChartGForce | IChartFloor | IChartGasBrake | IChartSpeedGear | IChartWheelSlip>(myIndex: number, ref: RefObject<T[]>, newData: T, _lttbKeys: string[], setState: Dispatch<SetStateAction<{ lapNumber: number, data: T[] }[]>>) => {
		// console.log(random);
		const currentLap = lapNumber.current.current;
		const previousLap = lapNumber.current.previous;
		if(previousLap !== currentLap && ref.current.length){
			// const readyBatch = lttb([...ref.current.filter(x => x.lapNum === previousLap)], lttbSize, lttbKeys, "lapDistance");
			const readyBatch = [...ref.current.filter(x => x.lapNum === previousLap)];
			ref.current = ref.current.filter(x => x.lapNum !== previousLap);
			setState(prev => {
				const chartIndex = prev.findIndex(x => x.lapNumber === previousLap);
				if(chartIndex === -1){
					return [...prev, { lapNumber: previousLap, data: readyBatch}];
				} else {
					const tmpData = [...prev];
					tmpData[chartIndex] = { lapNumber: previousLap, data: [...tmpData[chartIndex].data, ...readyBatch ]}
					return tmpData;
				}
			});
		}

		if([0, 2, 3].includes(lapData.current[myIndex].driverStatus)) return;

		if(currentLapDistance.current >= 0) {
			ref.current = ref.current.filter(x => x.lapDistance <= currentLapDistance.current);
			ref.current.push(newData);
		}

		if(ref.current.length >= batchSize){
			// const readyBatch = lttb([...ref.current], lttbSize, lttbKeys, "lapDistance");
			const readyBatch = [...ref.current]
			// ref.current = ref.current.slice(-1);
			ref.current = [];
			setState(prev => {
				const chartIndex = prev.findIndex(x => x.lapNumber === currentLap);
				if(chartIndex === -1){
					return [...prev, {lapNumber: currentLap, data: readyBatch}];
				} else {
					const tmpData = [...prev];
					const lastLapDistance = tmpData[chartIndex].data.at(-1)!.lapDistance;
					if( lastLapDistance >= currentLapDistance.current ) {
						tmpData[chartIndex] = { lapNumber: currentLap, data: readyBatch };
					} else {
						tmpData[chartIndex] = { lapNumber: currentLap, data: [...tmpData[chartIndex].data, ...readyBatch ] };
					}
					return tmpData;
				}
			});
		}
	};

	// useEffect(() => console.log(chartGForce.at(-1)), [chartGForce])

	useEffect(() => {
		if (!user) return;
		if (!driverSelect) {
			setDriverSelect(user.login);
			return;
		}
		if (!socketRef.current) socketRef.current = io(backendURL);
		const socketConn = async () => {
			console.log("Init socket...", driverSelect)
			socketRef.current!.emit("joinRoom", driverSelect);
			setSocketConnected(true);
		};
		const socketDisconn = () => {
			setSocketConnected(false);
		};

		const handleLapData = (e: ILapData[]) => {
			lapData.current = e;
			if(myIndex === undefined) return;
			currentLapDistance.current = Number(e[myIndex].lapDistance.toFixed(2));
			// setLapNumber(x => ({previous: x.current, current: e[myIndex].currentLapNum}));
			lapNumber.current = {previous: lapNumber.current.current, current: e[myIndex].currentLapNum}
		};

		const handleBestLap = (e: {carId: number, bestLap: ILapHistoryData}) => bestLapTimes.current = { ...bestLapTimes.current, [e.carId]: e.bestLap };
		const handleCarId = (e: number) => setMyIndex(e);
		const handleCarStatus = (e: ICarStatusData[]) => carStatus.current = e;
		const handleCarDamage = (e: ICarDamageData[]) => carDamage.current = e;
		const handleSessionInfo = (e: ICustomSessionData) => setSessionInfo(e);

		const handleCarMotion = (e: ICarMotion[]) => {
			carMotion.current = e;
			if(myIndex === undefined) return;
			chartDataHandler(
				myIndex,
				chartGForceBatch,
				{lapDistance: currentLapDistance.current, lateral: e[myIndex].gForceLateral, longitudinal: e[myIndex].gForceLongitudinal, lapNum: lapNumber.current.current},
				["lateral", "longitudinal"],
				setChartGForce
			)
		};
		const handleParticipants = (e: ICustomParticipants[]) => {
			participants.current = e;
			setCarColors( participants.current.map((d, i) => ({carId: i, color: carColor(d.teamId, d.liveryColours[1]) })) );
		};
		const handleCarTelemetry = (e: ICarTelemetryData[]) => {
			if(myIndex === undefined) return;
			carTelemetry.current = e;
			chartDataHandler(
				myIndex,
				chartGasBrakeBatch,
				{ throttle: Number((e[myIndex].throttle*100).toFixed(0)), brake: Number((e[myIndex].brake*100).toFixed(0)), lapDistance: currentLapDistance.current, lapNum: lapNumber.current.current},
				["throttle", "brake"],
				setChartGasBrake
			);
			chartDataHandler(
				myIndex,
				chartSpeedGearBatch,
				{ speed: e[myIndex].speed, gear: e[myIndex].gear,lapDistance: currentLapDistance.current, lapNum: lapNumber.current.current },
				["speed", "gear"],
				setChartSpeedGear
			)
		};
		const handleCarMotionExtra = (e: ICarMotionExtra) => {
			if(myIndex === undefined) return;
			chartDataHandler(
				myIndex,
				chartFloorHeightBatch,
				{ front: e.frontAeroHeight, rear: e.rearAeroHeight, lapDistance: currentLapDistance.current, lapNum: lapNumber.current.current },
				["front", "rear"],
				setChartFloorHeight
			);
			chartDataHandler(
				myIndex,
				chartWheelSlipRatioBatch,
				{ wheelSlipRatioFront: Number( ( e.wheelSlipRatio[0] + e.wheelSlipRatio[1]).toFixed(1) ), wheelSlipRatioRear: Number( ( e.wheelSlipRatio[2] + e.wheelSlipRatio[3]).toFixed(1) ), lapDistance: currentLapDistance.current, lapNum: lapNumber.current.current },
				["wheelSlipRatioFront", "wheelSlipRatioRear"],
				setChartWheelSlipRatio
			);
		};
		// setSocketConnected(socket.connected);
		if (socketRef.current && !socketConnected && (prevDriver.current != driverSelect)) socketRef.current.connect();
		socketRef.current.on("connect", socketConn);
		socketRef.current.on("disconnect", socketDisconn)
		socketRef.current.on("lapData", handleLapData);
		socketRef.current.on("carDamage", handleCarDamage);
		socketRef.current.on("carStatus", handleCarStatus);
		socketRef.current.on("carTelemetry", handleCarTelemetry);
		socketRef.current.on("participants", handleParticipants);
		socketRef.current.on("myCarId", handleCarId);
		socketRef.current.on("bestLap", handleBestLap);
		socketRef.current.on("sessionInfo", handleSessionInfo);
		socketRef.current.on("carMotion", handleCarMotion);
		socketRef.current.on("motionExtra", handleCarMotionExtra);
		return () => {
			socketRef.current!.off("connect", socketConn);
			socketRef.current!.off("disconnect", socketDisconn);
			socketRef.current!.off("lapData", handleLapData);
			socketRef.current!.off("carDamage", handleCarDamage);
			socketRef.current!.off("carStatus", handleCarStatus);
			socketRef.current!.off("carTelemetry", handleCarTelemetry);
			socketRef.current!.off("participants", handleParticipants);
			socketRef.current!.off("myCarId", handleCarId);
			socketRef.current!.off("bestLap", handleBestLap);
			socketRef.current!.off("sessionInfo", handleSessionInfo);
			socketRef.current!.off("carMotion", handleCarMotion);
			socketRef.current!.off("motionExtra", handleCarMotionExtra);
		}
	}, [socketConnected, user, driverSelect, myIndex]);

	const changeDriver = (e: string) => {
		prevDriver.current = driverSelect;
		if (socketRef.current) {
			socketRef.current.disconnect();
		}
		setMyIndex(undefined);
		lapData.current = [];
		participants.current = [];
		carDamage.current = [];
		carStatus.current = [];
		carTelemetry.current = [];
		bestLapTimes.current = {};
		chartFloorHeightBatch.current = [];
		setChartFloorHeight([]);
		chartWheelSlipRatioBatch.current = [];
		setChartWheelSlipRatio([]);
		chartGasBrakeBatch.current = [];
		setChartGasBrake([]);
		chartSpeedGearBatch.current = [];
		setChartSpeedGear([]);
		chartGForceBatch.current = [];
		setChartGForce([]);
		setSessionInfo(undefined);
		setDriverSelect(e);
	};


	return (
		<div className="w-dvw h-dvh flex p-8 pl-20 items-center justify-center flex-col gap-2">
			<div className="w-full flex gap-3 items-end">
				<span className="text-2xl font-black tracking-widest">Live Telemetry</span>
				<Select onValueChange={(e) => changeDriver(e)} value={driverSelect}>
					<SelectTrigger className="w-[130px]">
						<SelectValue placeholder="Wybierz kierowce" />
					</SelectTrigger>
					<SelectContent>
						{ user && <SelectItem value={user.login}>{user.login}</SelectItem> }
						{/* <SelectItem value="sotiio">sotiio</SelectItem>
						<SelectItem value="konyu">konyu</SelectItem>
						<SelectItem value="kieszu">kieszu</SelectItem> */}
					</SelectContent>
				</Select>
			</div>
			<div className="w-full flex h-full gap-2 relative p-2">
				<div className="flex flex-col min-w-96 max-w-1/2 grow h-full gap-2">
					<div className="bg-card text-card-foreground p-3 rounded-xl border max-h-[160px] grow">
						<CardHeader>
							<CardTitle>Throttle & Brake</CardTitle>
							<CardAction>
								<Select onValueChange={(e) => e === "current" ? setViewLapNum("") : setViewLapNum(e) } value={viewLapNum}>
									<SelectTrigger className="w-[200px]">
										<SelectValue placeholder="Current Lap" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="current">Current Lap</SelectItem>
										{ chartGForce.map(x => <SelectItem key={"gforce_lap"+x.lapNumber.toString()} value={x.lapNumber.toString()}>Lap {x.lapNumber} {x.lapNumber === lapNumber.current.current && "(Current)"}</SelectItem>) }
									</SelectContent>
								</Select>
							</CardAction>
						</CardHeader>
						<ChartGasBrake
							data={chartGasBrake.find(lap => lap.lapNumber === (Number(viewLapNum) || lapNumber.current.current) )?.data || []}
							trackLength={sessionInfo?.trackLength} sector2={sessionInfo?.sector2} sector3={sessionInfo?.sector3}
						/>	
					</div>
					<div className="bg-card text-card-foreground p-3 rounded-xl border max-h-[160px] grow">
						<CardTitle>Speed & Gear</CardTitle>
						<ChartSpeedGear
							data={chartSpeedGear.find(lap => lap.lapNumber === (Number(viewLapNum) || lapNumber.current.current) )?.data || []}
							trackLength={sessionInfo?.trackLength} sector2={sessionInfo?.sector2} sector3={sessionInfo?.sector3}
						/>
					</div>
					<div className="bg-card text-card-foreground p-3 rounded-xl border grow overflow-hidden">
						<CardHeader>
							<CardTitle>G-Force</CardTitle>
						</CardHeader>
						<ChartGForce
							data={chartGForce.find(lap => lap.lapNumber === (Number(viewLapNum) || lapNumber.current.current) )?.data || []}
							trackLength={sessionInfo?.trackLength} sector2={sessionInfo?.sector2} sector3={sessionInfo?.sector3}
						/>
					</div>
					<div className="bg-card text-card-foreground p-3 rounded-xl border grow overflow-hidden">
						<CardTitle>Wheel Slip Ratio</CardTitle>
						<ChartWheelSlipRatio
							data={chartWheelSlipRatio.find(lap => lap.lapNumber === (Number(viewLapNum) || lapNumber.current.current) )?.data || []}
							trackLength={sessionInfo?.trackLength} sector2={sessionInfo?.sector2} sector3={sessionInfo?.sector3}
						/>
					</div>
					<div className="bg-card text-card-foreground p-3 rounded-xl border grow overflow-hidden">
						<CardTitle>Floor Height</CardTitle>
						<ChartFloorHeight
							data={chartFloorHeight.find(lap => lap.lapNumber === (Number(viewLapNum) || lapNumber.current.current) )?.data || []}
							trackLength={sessionInfo?.trackLength} sector2={sessionInfo?.sector2} sector3={sessionInfo?.sector3}
						/>
					</div>
				</div>
				<div className="flex grow flex-col gap-2">
					<div className="flex gap-2">
						<ActiveCarCard
							carStatus={carStatus} carTelemetry={carTelemetry}
							maxLaps={sessionInfo?.totalLaps} lapData={lapData}
							myIndex={myIndex} refreshRate={20}
						/>
						<TrackCard
							refreshRate={30} weather={sessionInfo?.weather} carColors={carColors}
							airTemp={sessionInfo?.airTemperature} trackTemp={sessionInfo?.trackTemperature}
							trackId={sessionInfo?.trackId} carMotion={carMotion} myIndex={myIndex}
						/>
						<DamageCard carDamage={carDamage} myIndex={myIndex} refreshRate={2} carTelemetry={carTelemetry} />
					</div>
					<ParticipantsCard
						refreshRate={2} bestLapTimes={bestLapTimes} participants={participants}
						lapData={lapData} myIndex={myIndex} carDamage={carDamage} carStatus={carStatus}
					/>
				</div>
				{
				myIndex === undefined &&
				<div className="absolute -left-1 -top-1 -bottom-1 -right-1 rounded-2xl bg-zinc-950/50 grid place-content-center backdrop-blur-md z-[1]">
					<CustomLoading children={<div className="text-center text-amber-400 text-2xl"><p>No data received yet {driverSelect !== user?.login && "from " + driverSelect} 🙄</p><p className="text-sm text-amber-200">{driverSelect !== user?.login ? "Wait for user to start driving..." : "Start driving or check your in-game telemetry settings"}</p></div>} />
				</div>
				}
			</div>
		</div>
	)
};

export default Realtime;