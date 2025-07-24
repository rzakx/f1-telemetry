export interface PacketHeader {
	m_packetFormat: number;
	m_gameMajorVersion: number;
	m_gameMinorVersion: number;
	m_packetVersion: number;
	m_packetId: number;
	m_sessionUID: bigint;
	m_sessionTime: number;
	m_frameIdentifier: number;
	m_playerCarIndex: number;
	m_secondaryPlayerCarIndex: number;
};

export interface CarMotionData {
	m_worldPositionX: number;
	m_worldPositionY: number;
	m_worldPositionZ: number;
	m_worldVelocityX: number;
	m_worldVelocityY: number;
	m_worldVelocityZ: number;
	m_worldForwardDirX: number;
	m_worldForwardDirY: number;
	m_worldForwardDirZ: number;
	m_worldRightDirX: number;
	m_worldRightDirY: number;
	m_worldRightDirZ: number;
	m_gForceLateral: number;
	m_gForceLongitudinal: number;
	m_gForceVertical: number;
	m_yaw: number;
	m_pitch: number;
	m_roll: number;
};

export interface PacketMotionData {
	header: PacketHeader;
	carMotionData: CarMotionData[];
	extras: Record<string, number[] | number>;
};

export interface MarshalZone {
	m_zoneStart: number;
	m_zoneFlag: number;
};

export interface WeatherForecastSample {
	m_sessionType: number;
	m_timeOffset: number;
	m_weather: number;
	m_trackTemperature: number;
	m_trackTemperatureChange: number;
	m_airTemperature: number;
	m_airTemperatureChange: number;
	m_rainPercentage: number;
};

export interface PacketSessionData {
	header: PacketHeader;
	m_weather: number;
	m_trackTemperature: number;
	m_airTemperature: number;
	m_totalLaps: number;
	m_trackLength: number;
	m_sessionType: number;
	m_trackId: number;
	m_formula: number;
	m_sessionTimeLeft: number;
	m_sessionDuration: number;
	m_pitSpeedLimit: number;
	m_gamePaused: number;
	m_isSpectating: number;
	m_spectatorCarIndex: number;
	m_sliProNativeSupport: number;
	m_numMarshalZones: number;
	m_marshalZones: MarshalZone[];
	m_safetyCarStatus: number;
	m_networkGame: number;
	m_numWeatherForecastSamples: number;
	m_weatherForecastSamples: WeatherForecastSample[];
	m_forecastAccuracy: number;
	m_aiDifficulty: number;
	m_seasonLinkIdentifier: number;
	m_weekendLinkIdentifier: number;
	m_sessionLinkIdentifier: number;
	m_pitStopWindowIdealLap: number;
	m_pitStopWindowLatestLap: number;
	m_pitStopRejoinPosition: number;
	m_steeringAssist: number;
	m_brakingAssist: number;
	m_gearboxAssist: number;
	m_pitAssist: number;
	m_pitReleaseAssist: number;
	m_ERSAssist: number;
	m_DRSAssist: number;
	m_dynamicRacingLine: number;
	m_dynamicRacingLineType: number;
	m_gameMode: number;
	m_ruleSet: number;
	m_timeOfDay: number;
	m_sessionLength: number;
};

export interface CarDamageData {
	m_tyresWear: number[];
	m_tyresDamage: number[];
	m_brakesDamage: number[];
	m_frontLeftWingDamage: number;
	m_frontRightWingDamage: number;
	m_rearWingDamage: number;
	m_floorDamage: number;
	m_diffuserDamage: number;
	m_sidepodDamage: number;
	m_drsFault: number;
	m_ersFault: number;
	m_gearBoxDamage: number;
	m_engineDamage: number;
	m_engineMGUHWear: number;
	m_engineESWear: number;
	m_engineCEWear: number;
	m_engineICEWear: number;
	m_engineMGUKWear: number;
	m_engineTCWear: number;
	m_engineBlown: number;
	m_engineSeized: number;
};

export interface PacketCarDamageData {
	header: PacketHeader;
	carDamageData: CarDamageData[];
};

export interface CarStatusData {
	m_tractionControl: number;
	m_antiLockBrakes: number;
	m_fuelMix: number;
	m_frontBrakeBias: number;
	m_pitLimiterStatus: number;
	m_fuelInTank: number;
	m_fuelCapacity: number;
	m_fuelRemainingLaps: number;
	m_maxRPM: number;
	m_idleRPM: number;
	m_maxGears: number;
	m_drsAllowed: number;
	m_drsActivationDistance: number;
	m_actualTyreCompound: number;
	m_visualTyreCompound: number;
	m_tyresAgeLaps: number;
	m_vehicleFiaFlags: number;
	m_ersStoreEnergy: number;
	m_ersDeployMode: number;
	m_ersHarvestedThisLapMGUK: number;
	m_ersHarvestedThisLapMGUH: number;
	m_ersDeployedThisLap: number;
	m_networkPaused: number;
};

export interface PacketCarStatusData {
	header: PacketHeader;
	carStatusData: CarStatusData[];
};

export interface CarTelemetryData {
	m_speed: number;
	m_throttle: number;
	m_steer: number;
	m_brake: number;
	m_clutch: number;
	m_gear: number;
	m_engineRPM: number;
	m_drs: number;
	m_revLightsPercent: number;
	m_revLightsBitValue: number;
	m_brakesTemperature: number[];
	m_tyresSurfaceTemperature: number[];
	m_tyresInnerTemperature: number[];
	m_engineTemperature: number;
	m_tyresPressure: number[];
	m_surfaceType: number[];
};

export interface PacketCarTelemetryData {
	header: PacketHeader;
	carTelemetryData: CarTelemetryData[];
	m_mfdPanelIndex: number;
	m_mfdPanelIndexSecondaryPlayer: number;
	m_suggestedGear: number;
};

export interface ParticipantData {
	m_aiControlled: number;
	m_driverId: number;
	m_networkId: number;
	m_teamId: number;
	m_myTeam: number;
	m_raceNumber: number;
	m_nationality: number;
	m_name: string;
	m_yourTelemetry: number;
};

export interface PacketParticipantsData {
	header: PacketHeader;
	m_numActiveCars: number;
	participants: ParticipantData[];
};

export interface LapData {
	m_lastLapTimeInMS: number;
	m_currentLapTimeInMS: number;
	m_sector1TimeInMS: number;
	m_sector2TimeInMS: number;
	m_lapDistance: number;
	m_totalDistance: number;
	m_safetyCarDelta: number;
	m_carPosition: number;
	m_currentLapNum: number;
	m_pitStatus: number;
	m_numPitStops: number;
	m_sector: number;
	m_currentLapInvalid: number;
	m_penalties: number;
	m_warnings: number;
	m_numUnservedDriveThroughPens: number;
	m_numUnservedStopGoPens: number;
	m_gridPosition: number;
	m_driverStatus: number;
	m_resultStatus: number;
	m_pitLaneTimerActive: number;
	m_pitLaneTimeInLaneInMS: number;
	m_pitStopTimerInMS: number;
	m_pitStopShouldServePen: number;
};

export interface PacketLapData {
	header: PacketHeader;
	lapData: LapData[];
	m_timeTrialPBCarIdx: number;
	m_timeTrialRivalCarIdx: number;
};

export function parseMotion(buffer: Uint8Array): PacketMotionData {
	const view = new DataView(buffer.buffer);
	let offset = 0;

	const header: PacketHeader = {
		m_packetFormat: 			view.getUint16(offset, true),
		m_gameMajorVersion: 		view.getUint8(offset + 2),
		m_gameMinorVersion: 		view.getUint8(offset + 3),
		m_packetVersion: 			view.getUint8(offset + 4),
		m_packetId: 				view.getUint8(offset + 5),
		m_sessionUID: 				view.getBigUint64(offset + 6, true),
		m_sessionTime: 				view.getFloat32(offset + 14, true),
		m_frameIdentifier: 			view.getUint32(offset + 18, true),
		m_playerCarIndex: 			view.getUint8(offset + 22),
		m_secondaryPlayerCarIndex: 	view.getUint8(offset + 23),
	};
	offset += 24;

	const carMotionData: CarMotionData[] = [];
	for (let i = 0; i < 22; i++) {
		const car: CarMotionData = {
			m_worldPositionX: 		view.getFloat32(offset, true),
			m_worldPositionY: 		view.getFloat32(offset + 4, true),
			m_worldPositionZ: 		view.getFloat32(offset + 8, true),
			m_worldVelocityX: 		view.getFloat32(offset + 12, true),
			m_worldVelocityY: 		view.getFloat32(offset + 16, true),
			m_worldVelocityZ: 		view.getFloat32(offset + 20, true),
			m_worldForwardDirX: 	view.getInt16(offset + 24, true),
			m_worldForwardDirY: 	view.getInt16(offset + 26, true),
			m_worldForwardDirZ: 	view.getInt16(offset + 28, true),
			m_worldRightDirX: 		view.getInt16(offset + 30, true),
			m_worldRightDirY: 		view.getInt16(offset + 32, true),
			m_worldRightDirZ: 		view.getInt16(offset + 34, true),
			m_gForceLateral: 		view.getFloat32(offset + 36, true),
			m_gForceLongitudinal: 	view.getFloat32(offset + 40, true),
			m_gForceVertical: 		view.getFloat32(offset + 44, true),
			m_yaw: 					view.getFloat32(offset + 48, true),
			m_pitch: 				view.getFloat32(offset + 52, true),
			m_roll: 				view.getFloat32(offset + 56, true),
		};
		carMotionData.push(car);
		offset += 60;
	}

	function readFloatArray(len: number): number[] {
		const arr: number[] = [];
		for (let i = 0; i < len; i++) {
			arr.push(view.getFloat32(offset, true));
			offset += 4;
		}
		return arr;
	}

	const extras = {
		m_suspensionPosition:		readFloatArray(4),
		m_suspensionVelocity:		readFloatArray(4),
		m_suspensionAcceleration:	readFloatArray(4),
		m_wheelSpeed:				readFloatArray(4),
		m_wheelSlip:				readFloatArray(4),
		m_localVelocityX:			view.getFloat32(offset, true),
		m_localVelocityY:			view.getFloat32(offset + 4, true),
		m_localVelocityZ:			view.getFloat32(offset + 8, true),
		m_angularVelocityX:			view.getFloat32(offset + 12, true),
		m_angularVelocityY:			view.getFloat32(offset + 16, true),
		m_angularVelocityZ:			view.getFloat32(offset + 20, true),
		m_angularAccelerationX:		view.getFloat32(offset + 24, true),
		m_angularAccelerationY:		view.getFloat32(offset + 28, true),
		m_angularAccelerationZ:		view.getFloat32(offset + 32, true),
		m_frontWheelsAngle:			view.getFloat32(offset + 36, true),
	};
	offset += 40;

	return { header, carMotionData, extras };
};

export function parseParticipants(buffer: Uint8Array): PacketParticipantsData {
	const view = new DataView(buffer.buffer);
	let offset = 0;

	const header: PacketHeader = {
		m_packetFormat:				view.getUint16(offset, true),
		m_gameMajorVersion:			view.getUint8(offset + 2),
		m_gameMinorVersion:			view.getUint8(offset + 3),
		m_packetVersion:			view.getUint8(offset + 4),
		m_packetId:					view.getUint8(offset + 5),
		m_sessionUID:				view.getBigUint64(offset + 6, true),
		m_sessionTime:				view.getFloat32(offset + 14, true),
		m_frameIdentifier:			view.getUint32(offset + 18, true),
		m_playerCarIndex:			view.getUint8(offset + 22),
		m_secondaryPlayerCarIndex:	view.getUint8(offset + 23),
	};
	offset = 24;

	const m_numActiveCars = view.getUint8(offset++);
	const participants: ParticipantData[] = [];
	for (let i = 0; i < 22; i++) {
		const m_aiControlled =	view.getUint8(offset++);
		const m_driverId =		view.getUint8(offset++);
		const m_networkId =		view.getUint8(offset++);
		const m_teamId =		view.getUint8(offset++);
		const m_myTeam =		view.getUint8(offset++);
		const m_raceNumber =	view.getUint8(offset++);
		const m_nationality =	view.getUint8(offset++);

		// participants nicknames or game platform ids
		const nameBytes = buffer.slice(offset, offset + 48);
		offset += 48;
		const nullIndex = nameBytes.indexOf(0);
		const trim = nullIndex >= 0 ? nameBytes.slice(0, nullIndex) : nameBytes;
		const m_name = new TextDecoder("utf-8").decode(trim);
		const m_yourTelemetry = view.getUint8(offset++);
		participants.push({ m_aiControlled, m_driverId, m_networkId, m_teamId, m_myTeam, m_raceNumber, m_nationality, m_name, m_yourTelemetry });
	}

	return { header, m_numActiveCars, participants };
};

export function parseLap(buffer: Uint8Array): PacketLapData {
	const view = new DataView(buffer.buffer);
	let offset = 0;

	const header: PacketHeader = {
		m_packetFormat:				view.getUint16(offset, true),
		m_gameMajorVersion:			view.getUint8(offset + 2),
		m_gameMinorVersion:			view.getUint8(offset + 3),
		m_packetVersion:			view.getUint8(offset + 4),
		m_packetId:					view.getUint8(offset + 5),
		m_sessionUID:				view.getBigUint64(offset + 6, true),
		m_sessionTime:				view.getFloat32(offset + 14, true),
		m_frameIdentifier:			view.getUint32(offset + 18, true),
		m_playerCarIndex:			view.getUint8(offset + 22),
		m_secondaryPlayerCarIndex:	view.getUint8(offset + 23),
	};
	offset = 24;

	const lapData: LapData[] = [];
	for (let i = 0; i < 22; i++) {
		const m_lastLapTimeInMS =				view.getUint32(offset, true); offset += 4;
		const m_currentLapTimeInMS =			view.getUint32(offset, true); offset += 4;
		const m_sector1TimeInMS =				view.getUint16(offset, true); offset += 2;
		const m_sector2TimeInMS =				view.getUint16(offset, true); offset += 2;
		const m_lapDistance =					view.getFloat32(offset, true); offset += 4;
		const m_totalDistance =					view.getFloat32(offset, true); offset += 4;
		const m_safetyCarDelta =				view.getFloat32(offset, true); offset += 4;
		const m_carPosition =					view.getUint8(offset++);
		const m_currentLapNum =					view.getUint8(offset++);
		const m_pitStatus =						view.getUint8(offset++);
		const m_numPitStops =					view.getUint8(offset++);
		const m_sector =						view.getUint8(offset++);
		const m_currentLapInvalid =				view.getUint8(offset++);
		const m_penalties =						view.getUint8(offset++);
		const m_warnings =						view.getUint8(offset++);
		const m_numUnservedDriveThroughPens =	view.getUint8(offset++);
		const m_numUnservedStopGoPens =			view.getUint8(offset++);
		const m_gridPosition =					view.getUint8(offset++);
		const m_driverStatus =					view.getUint8(offset++);
		const m_resultStatus =					view.getUint8(offset++);
		const m_pitLaneTimerActive =			view.getUint8(offset++);
		const m_pitLaneTimeInLaneInMS =			view.getUint16(offset, true); offset += 2;
		const m_pitStopTimerInMS =				view.getUint16(offset, true); offset += 2;
		const m_pitStopShouldServePen =			view.getUint8(offset++);

		lapData.push({
			m_lastLapTimeInMS, m_currentLapTimeInMS, m_sector1TimeInMS, m_sector2TimeInMS, m_lapDistance, m_totalDistance,
			m_safetyCarDelta, m_carPosition, m_currentLapNum, m_pitStatus, m_numPitStops, m_sector, m_currentLapInvalid,
			m_penalties, m_warnings, m_numUnservedDriveThroughPens, m_numUnservedStopGoPens, m_gridPosition, m_driverStatus,
			m_resultStatus, m_pitLaneTimerActive, m_pitLaneTimeInLaneInMS, m_pitStopTimerInMS, m_pitStopShouldServePen
		});
	}
	const m_timeTrialPBCarIdx = view.getUint8(offset++);
	const m_timeTrialRivalCarIdx = view.getUint8(offset++);
	return { header, lapData, m_timeTrialPBCarIdx, m_timeTrialRivalCarIdx };
};

export function parseTelemetry(buffer: Uint8Array): PacketCarTelemetryData {
	const view = new DataView(buffer.buffer);
	let offset = 0;

	const header: PacketHeader = {
		m_packetFormat:				view.getUint16(offset, true),
		m_gameMajorVersion:			view.getUint8(offset + 2),
		m_gameMinorVersion:			view.getUint8(offset + 3),
		m_packetVersion:			view.getUint8(offset + 4),
		m_packetId:					view.getUint8(offset + 5),
		m_sessionUID:				view.getBigUint64(offset + 6, true),
		m_sessionTime:				view.getFloat32(offset + 14, true),
		m_frameIdentifier:			view.getUint32(offset + 18, true),
		m_playerCarIndex:			view.getUint8(offset + 22),
		m_secondaryPlayerCarIndex:	view.getUint8(offset + 23),
	};
	offset = 24;

	const carTelemetryData: CarTelemetryData[] = [];
	for (let i = 0; i < 22; i++) {
		const m_speed = view.getUint16(offset, true); offset += 2;
		const m_throttle = view.getFloat32(offset, true); offset += 4;
		const m_steer = view.getFloat32(offset, true); offset += 4;
		const m_brake = view.getFloat32(offset, true); offset += 4;
		const m_clutch = view.getUint8(offset++);
		const m_gear = view.getInt8(offset++);
		const m_engineRPM = view.getUint16(offset, true); offset += 2;
		const m_drs = view.getUint8(offset++);
		const m_revLightsPercent = view.getUint8(offset++);
		const m_revLightsBitValue = view.getUint16(offset, true); offset += 2;

		const m_brakesTemperature: number[] = [];
		const m_tyresSurfaceTemperature: number[] = [];
		const m_tyresInnerTemperature: number[] = [];
		for (let j = 0; j < 4; j++) { m_brakesTemperature.push(view.getUint16(offset, true)); offset += 2; }
		for (let j = 0; j < 4; j++) { m_tyresSurfaceTemperature.push(view.getUint8(offset++)); }
		for (let j = 0; j < 4; j++) { m_tyresInnerTemperature.push(view.getUint8(offset++)); }
		const m_engineTemperature = view.getUint16(offset, true); offset += 2;
		const m_tyresPressure: number[] = [];
		for (let j = 0; j < 4; j++) { m_tyresPressure.push(view.getFloat32(offset, true)); offset += 4; }
		const m_surfaceType: number[] = [];
		for (let j = 0; j < 4; j++) { m_surfaceType.push(view.getUint8(offset++)); }

		carTelemetryData.push({
			m_speed, m_throttle, m_steer, m_brake, m_clutch, m_gear, m_engineRPM, m_drs,
			m_revLightsPercent, m_revLightsBitValue, m_brakesTemperature, m_tyresSurfaceTemperature,
			m_tyresInnerTemperature, m_engineTemperature, m_tyresPressure, m_surfaceType
		});
	}

	const m_mfdPanelIndex = view.getUint8(offset++);
	const m_mfdPanelIndexSecondaryPlayer = view.getUint8(offset++);
	const m_suggestedGear = view.getInt8(offset++);

	return { header, carTelemetryData, m_mfdPanelIndex, m_mfdPanelIndexSecondaryPlayer, m_suggestedGear };
};

export function parseCarStatus(buffer: Uint8Array): PacketCarStatusData {
	const view = new DataView(buffer.buffer);
	let offset = 0;

	const header: PacketHeader = {
		m_packetFormat:				view.getUint16(offset, true),
		m_gameMajorVersion:			view.getUint8(offset + 2),
		m_gameMinorVersion:			view.getUint8(offset + 3),
		m_packetVersion:			view.getUint8(offset + 4),
		m_packetId:					view.getUint8(offset + 5),
		m_sessionUID:				view.getBigUint64(offset + 6, true),
		m_sessionTime:				view.getFloat32(offset + 14, true),
		m_frameIdentifier:			view.getUint32(offset + 18, true),
		m_playerCarIndex:			view.getUint8(offset + 22),
		m_secondaryPlayerCarIndex:	view.getUint8(offset + 23),
	};
	offset = 24;

	const carStatusData: CarStatusData[] = [];
	for (let i = 0; i < 22; i++) {
		const m_tractionControl =			view.getUint8(offset++);
		const m_antiLockBrakes =			view.getUint8(offset++);
		const m_fuelMix =					view.getUint8(offset++);
		const m_frontBrakeBias =			view.getUint8(offset++);
		const m_pitLimiterStatus =			view.getUint8(offset++);
		const m_fuelInTank =				view.getFloat32(offset, true); offset += 4;
		const m_fuelCapacity =				view.getFloat32(offset, true); offset += 4;
		const m_fuelRemainingLaps =			view.getFloat32(offset, true); offset += 4;
		const m_maxRPM =					view.getUint16(offset, true); offset += 2;
		const m_idleRPM =					view.getUint16(offset, true); offset += 2;
		const m_maxGears =					view.getUint8(offset++);
		const m_drsAllowed =				view.getUint8(offset++);
		const m_drsActivationDistance =		view.getUint16(offset, true); offset += 2;
		const m_actualTyreCompound =		view.getUint8(offset++);
		const m_visualTyreCompound =		view.getUint8(offset++);
		const m_tyresAgeLaps =				view.getUint8(offset++);
		const m_vehicleFiaFlags =			view.getInt8(offset++);
		const m_ersStoreEnergy =			view.getFloat32(offset, true); offset += 4;
		const m_ersDeployMode =				view.getUint8(offset++);
		const m_ersHarvestedThisLapMGUK =	view.getFloat32(offset, true); offset += 4;
		const m_ersHarvestedThisLapMGUH =	view.getFloat32(offset, true); offset += 4;
		const m_ersDeployedThisLap =		view.getFloat32(offset, true); offset += 4;
		const m_networkPaused =				view.getUint8(offset++);

		carStatusData.push({
			m_tractionControl, m_antiLockBrakes, m_fuelMix, m_frontBrakeBias, m_pitLimiterStatus, m_fuelInTank, m_fuelCapacity, m_fuelRemainingLaps,
			m_maxRPM, m_idleRPM, m_maxGears, m_drsAllowed, m_drsActivationDistance, m_actualTyreCompound, m_visualTyreCompound, m_tyresAgeLaps,
			m_vehicleFiaFlags, m_ersStoreEnergy, m_ersDeployMode, m_ersHarvestedThisLapMGUK, m_ersHarvestedThisLapMGUH, m_ersDeployedThisLap, m_networkPaused
		});
	}

	return { header, carStatusData };
};

export function parseCarDamage(buffer: Uint8Array): PacketCarDamageData {
	const view = new DataView(buffer.buffer);
	let offset = 0;

	const header: PacketHeader = {
		m_packetFormat:				view.getUint16(offset, true),
		m_gameMajorVersion:			view.getUint8(offset + 2),
		m_gameMinorVersion:			view.getUint8(offset + 3),
		m_packetVersion:			view.getUint8(offset + 4),
		m_packetId:					view.getUint8(offset + 5),
		m_sessionUID:				view.getBigUint64(offset + 6, true),
		m_sessionTime:				view.getFloat32(offset + 14, true),
		m_frameIdentifier:			view.getUint32(offset + 18, true),
		m_playerCarIndex:			view.getUint8(offset + 22),
		m_secondaryPlayerCarIndex:	view.getUint8(offset + 23),
	};
	offset = 24;

	const carDamageData: CarDamageData[] = [];
	for (let i = 0; i < 22; i++) {
		const m_tyresWear: number[] = [];
		for (let j = 0; j < 4; j++) { m_tyresWear.push(view.getFloat32(offset, true)); offset += 4; }
		const m_tyresDamage: number[] = [];
		for (let j = 0; j < 4; j++) { m_tyresDamage.push(view.getUint8(offset++)); }
		const m_brakesDamage: number[] = [];
		for (let j = 0; j < 4; j++) { m_brakesDamage.push(view.getUint8(offset++)); }

		const data: CarDamageData = {
			m_tyresWear,
			m_tyresDamage,
			m_brakesDamage,
			m_frontLeftWingDamage:	view.getUint8(offset++),
			m_frontRightWingDamage:	view.getUint8(offset++),
			m_rearWingDamage:		view.getUint8(offset++),
			m_floorDamage:			view.getUint8(offset++),
			m_diffuserDamage:		view.getUint8(offset++),
			m_sidepodDamage:		view.getUint8(offset++),
			m_drsFault:				view.getUint8(offset++),
			m_ersFault:				view.getUint8(offset++),
			m_gearBoxDamage:		view.getUint8(offset++),
			m_engineDamage:			view.getUint8(offset++),
			m_engineMGUHWear:		view.getUint8(offset++),
			m_engineESWear:			view.getUint8(offset++),
			m_engineCEWear:			view.getUint8(offset++),
			m_engineICEWear:		view.getUint8(offset++),
			m_engineMGUKWear:		view.getUint8(offset++),
			m_engineTCWear:			view.getUint8(offset++),
			m_engineBlown:			view.getUint8(offset++),
			m_engineSeized:			view.getUint8(offset++),
		};
		carDamageData.push(data);
	}

	return { header, carDamageData };
};

export function parseSession(buffer: Uint8Array): PacketSessionData {
	const view = new DataView(buffer.buffer);
	let offset = 0;

	const header: PacketHeader = {
		m_packetFormat:				view.getUint16(offset, true),
		m_gameMajorVersion:			view.getUint8(offset + 2),
		m_gameMinorVersion:			view.getUint8(offset + 3),
		m_packetVersion:			view.getUint8(offset + 4),
		m_packetId:					view.getUint8(offset + 5),
		m_sessionUID:				view.getBigUint64(offset + 6, true),
		m_sessionTime:				view.getFloat32(offset + 14, true),
		m_frameIdentifier:			view.getUint32(offset + 18, true),
		m_playerCarIndex:			view.getUint8(offset + 22),
		m_secondaryPlayerCarIndex:	view.getUint8(offset + 23),
	};
	offset = 24;

	const m_weather =				view.getUint8(offset++);
	const m_trackTemperature =		view.getInt8(offset++);
	const m_airTemperature =		view.getInt8(offset++);
	const m_totalLaps =				view.getUint8(offset++);
	const m_trackLength =			view.getUint16(offset, true); offset += 2;
	const m_sessionType =			view.getUint8(offset++);
	const m_trackId =				view.getInt8(offset++);
	const m_formula =				view.getUint8(offset++);
	const m_sessionTimeLeft =		view.getUint16(offset, true); offset += 2;
	const m_sessionDuration =		view.getUint16(offset, true); offset += 2;
	const m_pitSpeedLimit =			view.getUint8(offset++);
	const m_gamePaused =			view.getUint8(offset++);
	const m_isSpectating =			view.getUint8(offset++);
	const m_spectatorCarIndex =		view.getUint8(offset++);
	const m_sliProNativeSupport =	view.getUint8(offset++);
	const m_numMarshalZones =		view.getUint8(offset++);

	const m_marshalZones: MarshalZone[] = [];
	for (let i = 0; i < 21; i++) {
		const m_zoneStart = view.getFloat32(offset, true); offset += 4;
		const m_zoneFlag = view.getInt8(offset++);
		m_marshalZones.push({ m_zoneStart, m_zoneFlag });
	}

	const m_safetyCarStatus = view.getUint8(offset++);
	const m_networkGame = view.getUint8(offset++);
	const m_numWeatherForecastSamples = view.getUint8(offset++);

	const m_weatherForecastSamples: WeatherForecastSample[] = [];
	for (let i = 0; i < 56; i++) {
		const sample: WeatherForecastSample = {
			m_sessionType:				view.getUint8(offset++),
			m_timeOffset:				view.getUint8(offset++),
			m_weather:					view.getUint8(offset++),
			m_trackTemperature:			view.getInt8(offset++),
			m_trackTemperatureChange:	view.getInt8(offset++),
			m_airTemperature:			view.getInt8(offset++),
			m_airTemperatureChange:		view.getInt8(offset++),
			m_rainPercentage:			view.getUint8(offset++),
		};
		m_weatherForecastSamples.push(sample);
	}

	const m_forecastAccuracy =			view.getUint8(offset++);
	const m_aiDifficulty =				view.getUint8(offset++);
	const m_seasonLinkIdentifier =		view.getUint32(offset, true); offset += 4;
	const m_weekendLinkIdentifier =		view.getUint32(offset, true); offset += 4;
	const m_sessionLinkIdentifier =		view.getUint32(offset, true); offset += 4;
	const m_pitStopWindowIdealLap =		view.getUint8(offset++);
	const m_pitStopWindowLatestLap =	view.getUint8(offset++);
	const m_pitStopRejoinPosition =		view.getUint8(offset++);
	const m_steeringAssist =			view.getUint8(offset++);
	const m_brakingAssist =				view.getUint8(offset++);
	const m_gearboxAssist =				view.getUint8(offset++);
	const m_pitAssist =					view.getUint8(offset++);
	const m_pitReleaseAssist =			view.getUint8(offset++);
	const m_ERSAssist =					view.getUint8(offset++);
	const m_DRSAssist =					view.getUint8(offset++);
	const m_dynamicRacingLine =			view.getUint8(offset++);
	const m_dynamicRacingLineType =		view.getUint8(offset++);
	const m_gameMode =					view.getUint8(offset++);
	const m_ruleSet =					view.getUint8(offset++);
	const m_timeOfDay =					view.getUint32(offset, true); offset += 4;
	const m_sessionLength =				view.getUint8(offset++);

	return {
		header, m_weather, m_trackTemperature, m_airTemperature, m_totalLaps, m_trackLength, m_sessionType, m_trackId, m_formula,
		m_sessionTimeLeft, m_sessionDuration, m_pitSpeedLimit, m_gamePaused, m_isSpectating, m_spectatorCarIndex, m_sliProNativeSupport,
		m_numMarshalZones, m_marshalZones, m_safetyCarStatus, m_networkGame, m_numWeatherForecastSamples, m_weatherForecastSamples, m_forecastAccuracy,
		m_aiDifficulty, m_seasonLinkIdentifier, m_weekendLinkIdentifier, m_sessionLinkIdentifier, m_pitStopWindowIdealLap, m_pitStopWindowLatestLap, m_pitStopRejoinPosition,
		m_steeringAssist, m_brakingAssist, m_gearboxAssist, m_pitAssist, m_pitReleaseAssist, m_ERSAssist, m_DRSAssist,
		m_dynamicRacingLine, m_dynamicRacingLineType, m_gameMode, m_ruleSet, m_timeOfDay, m_sessionLength
	};
};