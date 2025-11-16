export interface PacketHeader {
	packetFormat: number;
    gameYear: number;
	gameMajorVersion: number;
	gameMinorVersion: number;
	packetVersion: number;
	packetId: number;
	sessionUID: bigint;
	sessionTime: number;
	frameIdentifier: number;
    overallFrameIdentifier: number;
	playerCarIndex: number;
	secondaryPlayerCarIndex: number;
};

export function parseHeader(view: DataView): PacketHeader{
    let offset = 0;
    return {
        packetFormat: view.getUint16(offset, true),
        gameYear: view.getUint8(offset + 2),
        gameMajorVersion: view.getUint8(offset + 3),
        gameMinorVersion: view.getUint8(offset + 4),
        packetVersion: view.getUint8(offset + 5),
        packetId: view.getUint8(offset + 6),
        sessionUID: view.getBigUint64(offset + 7, true),
        sessionTime: view.getFloat32(offset + 15, true),
        frameIdentifier: view.getUint32(offset + 19, true),
        overallFrameIdentifier: view.getUint32(offset + 23, true),
        playerCarIndex: view.getUint8(offset + 27),
        secondaryPlayerCarIndex: view.getUint8(offset + 28)
    }
}

export interface CarMotionData {
	worldPositionX: number;
	worldPositionY: number;
	worldPositionZ: number;
	worldVelocityX: number;
	worldVelocityY: number;
	worldVelocityZ: number;
	worldForwardDirX: number;
	worldForwardDirY: number;
	worldForwardDirZ: number;
	worldRightDirX: number;
	worldRightDirY: number;
	worldRightDirZ: number;
	gForceLateral: number;
	gForceLongitudinal: number;
	gForceVertical: number;
	yaw: number;
	pitch: number;
	roll: number;
};

export interface PacketMotionData {
	header: PacketHeader;
	carMotionData: CarMotionData[];
};

export function parsePacketMotionData(buffer: Uint8Array): PacketMotionData {
	const view = new DataView(buffer.buffer);
	const header = parseHeader(view);
	let offset = 29;

	const carMotionData: CarMotionData[] = [];
	for (let i = 0; i < 22; i++) {
		const car: CarMotionData = {
			worldPositionX: 		view.getFloat32(offset, true),
			worldPositionY: 		view.getFloat32(offset + 4, true),
			worldPositionZ: 		view.getFloat32(offset + 8, true),
			worldVelocityX: 		view.getFloat32(offset + 12, true),
			worldVelocityY: 		view.getFloat32(offset + 16, true),
			worldVelocityZ: 		view.getFloat32(offset + 20, true),
			worldForwardDirX: 	    view.getInt16(offset + 24, true),
			worldForwardDirY: 	    view.getInt16(offset + 26, true),
			worldForwardDirZ: 	    view.getInt16(offset + 28, true),
			worldRightDirX: 		view.getInt16(offset + 30, true),
			worldRightDirY: 		view.getInt16(offset + 32, true),
			worldRightDirZ: 		view.getInt16(offset + 34, true),
			gForceLateral: 		    view.getFloat32(offset + 36, true),
			gForceLongitudinal: 	view.getFloat32(offset + 40, true),
			gForceVertical: 		view.getFloat32(offset + 44, true),
			yaw: 					view.getFloat32(offset + 48, true),
			pitch: 				    view.getFloat32(offset + 52, true),
			roll: 				    view.getFloat32(offset + 56, true),
		};
		carMotionData.push(car);
		offset += 60;
	}

	return { header, carMotionData };
};

export interface PacketCarMotionExtra {
    header: PacketHeader,
    suspensionPosition: number[],
    suspensionVelocity: number[],
    suspensionAcceleration: number[],
    wheelSpeed: number[],
    wheelSlipRatio: number[],
    wheelSlipAngle: number[],
    wheelLatForce: number[],
    wheelLongForce: number[],
    heightOfCOGAboveGround: number,
    localVelocityX: number,
    localVelocityY: number,
    localVelocityZ: number,
    angularVelocityX: number,
    angularVelocityY: number,
    angularVelocityZ: number,
    angularAccelerationX: number,
    angularAccelerationY: number,
    angularAccelerationZ: number,
    frontWheelsAngle: number,
    wheelVertForce: number[],
    frontAeroHeight: number,
    rearAeroHeight: number,
    frontRollAngle: number,
    rearRollAngle: number,
    chassisYaw: number,
    chassisPitch: number,
    wheelCamber: number[],
    wheelCamberGain: number[]
};

export function parsePacketCarMotionExtra(buffer: Uint8Array): PacketCarMotionExtra {
    const view = new DataView(buffer.buffer);
    const header = parseHeader(view);
    let offset = 29;
    return {
        header,
        suspensionPosition: [
            view.getFloat32(offset, true),
            view.getFloat32(offset + 4, true),
            view.getFloat32(offset + 8, true),
            view.getFloat32(offset + 12, true),
        ],
        suspensionVelocity: [
            view.getFloat32(offset + 16, true),
            view.getFloat32(offset + 20, true),
            view.getFloat32(offset + 24, true),
            view.getFloat32(offset + 28, true),
        ],
        suspensionAcceleration: [
            view.getFloat32(offset + 32, true),
            view.getFloat32(offset + 36, true),
            view.getFloat32(offset + 40, true),
            view.getFloat32(offset + 44, true),
        ],
        wheelSpeed: [
            view.getFloat32(offset + 48, true),
            view.getFloat32(offset + 52, true),
            view.getFloat32(offset + 56, true),
            view.getFloat32(offset + 60, true),
        ],
        wheelSlipRatio: [
            view.getFloat32(offset + 64, true),
            view.getFloat32(offset + 68, true),
            view.getFloat32(offset + 72, true),
            view.getFloat32(offset + 76, true),
        ],
        wheelSlipAngle: [
            view.getFloat32(offset + 80, true),
            view.getFloat32(offset + 84, true),
            view.getFloat32(offset + 88, true),
            view.getFloat32(offset + 92, true),
        ],
        wheelLatForce: [
            view.getFloat32(offset + 96, true),
            view.getFloat32(offset + 100, true),
            view.getFloat32(offset + 104, true),
            view.getFloat32(offset + 108, true),
        ],
        wheelLongForce: [
            view.getFloat32(offset + 112, true),
            view.getFloat32(offset + 116, true),
            view.getFloat32(offset + 120, true),
            view.getFloat32(offset + 124, true),
        ],
        heightOfCOGAboveGround: view.getFloat32(offset + 128, true),
        localVelocityX: view.getFloat32(offset + 132, true),
        localVelocityY: view.getFloat32(offset + 136, true),
        localVelocityZ: view.getFloat32(offset + 140, true),
        angularVelocityX: view.getFloat32(offset + 144, true),
        angularVelocityY: view.getFloat32(offset + 148, true),
        angularVelocityZ: view.getFloat32(offset + 152, true),
        angularAccelerationX: view.getFloat32(offset + 156, true),
        angularAccelerationY: view.getFloat32(offset + 160, true),
        angularAccelerationZ: view.getFloat32(offset + 164, true),
        frontWheelsAngle: view.getFloat32(offset + 168, true),
        wheelVertForce: [
            view.getFloat32(offset + 172, true),
            view.getFloat32(offset + 176, true),
            view.getFloat32(offset + 180, true),
            view.getFloat32(offset + 184, true),
        ],
        frontAeroHeight: view.getFloat32(offset + 188, true),
        rearAeroHeight: view.getFloat32(offset + 192, true),
        frontRollAngle: view.getFloat32(offset + 196, true),
        rearRollAngle: view.getFloat32(offset + 200, true),
        chassisYaw: view.getFloat32(offset + 204, true),
        chassisPitch: view.getFloat32(offset + 208, true),
        wheelCamber: [
            view.getFloat32(offset + 212, true),
            view.getFloat32(offset + 216, true),
            view.getFloat32(offset + 220, true),
            view.getFloat32(offset + 224, true),
        ],
        wheelCamberGain: [
            view.getFloat32(offset + 228, true),
            view.getFloat32(offset + 232, true),
            view.getFloat32(offset + 236, true),
            view.getFloat32(offset + 240, true),
        ]
    };
};

export interface MarshalZone {
	zoneStart: number;
	zoneFlag: number;
};

export interface WeatherForecastSample {
	sessionType: number;
	timeOffset: number;
	weather: number;
	trackTemperature: number;
	trackTemperatureChange: number;
	airTemperature: number;
	airTemperatureChange: number;
	rainPercentage: number;
};

export interface PacketSessionData {
	header: PacketHeader;
	weather: number;
	trackTemperature: number;
	airTemperature: number;
	totalLaps: number;
	trackLength: number;
	sessionType: number;
	trackId: number;
	formula: number;
	sessionTimeLeft: number;
	sessionDuration: number;
	pitSpeedLimit: number;
	gamePaused: number;
	isSpectating: number;
	spectatorCarIndex: number;
	sliProNativeSupport: number;
	numMarshalZones: number;
	marshalZones: MarshalZone[];
	safetyCarStatus: number;
	networkGame: number;
	numWeatherForecastSamples: number;
	weatherForecastSamples: WeatherForecastSample[];
	forecastAccuracy: number;
	aiDifficulty: number;
	seasonLinkIdentifier: number;
	weekendLinkIdentifier: number;
	sessionLinkIdentifier: number;
	pitStopWindowIdealLap: number;
	pitStopWindowLatestLap: number;
	pitStopRejoinPosition: number;
	steeringAssist: number;
	brakingAssist: number;
	gearboxAssist: number;
	pitAssist: number;
	pitReleaseAssist: number;
	ERSAssist: number;
	DRSAssist: number;
	dynamicRacingLine: number;
	dynamicRacingLineType: number;
	gameMode: number;
	ruleSet: number;
	timeOfDay: number;
	sessionLength: number;
    speedUnitsLeadPlayer: number;
    temperatureUnitsLeadPlayer: number;
    speedUnitsSecondaryPlayer: number;
    temperatureUnitsSecondaryPlayer: number;
    numSafetyCarPeriods: number;
    numVirtualSafetyCarPeriods: number;
    numRedFlagPeriods: number;
    equalCarPerformance: number;
    recoveryMode: number;
    flashbackLimit: number;
    surfaceType: number;
    lowFuelMode: number;
    raceStarts: number;
    tyreTemperature: number;
    pitLaneTyreSim: number;
    carDamage: number;
    carDamageRate: number;
    collisions: number;
    collisionsOffForFirstLapOnly: number;
    mpUnsafePitRelease: number;
    mpOffForGriefing: number;
    cornerCuttingStringency: number;
    parcFermeRules: number;
    pitStopExperience: number;
    safetyCar: number;
    safetyCarExperience: number;
    formationLap: number;
    formationLapExperience: number;
    redFlags: number;
    affectsLicenceLevelSolo: number;
    affectsLicenceLevelMP: number;
    numSessionsInWeekend: number;
    weekendStructure: number[];
    sector2LapDistanceStart: number;
    sector3LapDistanceStart: number;
};

export function parsePacketSessionData(buffer: Uint8Array): PacketSessionData {
	const view = new DataView(buffer.buffer);
	const header = parseHeader(view);
	let offset = 29;
    let marshalOffset = 48; // 29 + 19;

    const marshalZones: MarshalZone[] = [];
	for (let i = 0; i < 21; i++) {
		marshalZones.push({
            zoneStart: view.getFloat32(marshalOffset, true),
            zoneFlag: view.getInt8(marshalOffset + 4)
        });
		marshalOffset += 5;
	}
    let forecastOffset = 156; // 48 + 21*5 + 3;
    const forecastSample: WeatherForecastSample[] = [];
    for (let i = 0; i < 64; i++){
        forecastSample.push({
            sessionType: view.getUint8(forecastOffset),
            timeOffset: view.getUint8(forecastOffset + 1),
            weather: view.getUint8(forecastOffset + 2),
            trackTemperature: view.getInt8(forecastOffset + 3),
            trackTemperatureChange: view.getInt8(forecastOffset + 4),
            airTemperature: view.getInt8(forecastOffset + 5),
            airTemperatureChange: view.getInt8(forecastOffset + 6),
            rainPercentage: view.getUint8(forecastOffset + 7)
        });
        forecastOffset += 8;
    }

	return {
        header,
        weather: view.getUint8(offset),
        trackTemperature: view.getInt8(offset + 1),
        airTemperature: view.getInt8(offset + 2),
        totalLaps: view.getUint8(offset + 3),
        trackLength: view.getUint16(offset + 4, true),
        sessionType: view.getUint8(offset + 6),
        trackId: view.getInt8(offset + 7),
        formula: view.getUint8(offset + 8),
        sessionTimeLeft: view.getUint16(offset + 9, true),
        sessionDuration: view.getUint16(offset + 11, true),
        pitSpeedLimit: view.getUint8(offset + 13),
        gamePaused: view.getUint8(offset + 14),
        isSpectating: view.getUint8(offset + 15),
        spectatorCarIndex: view.getUint8(offset + 16),
        sliProNativeSupport: view.getUint8(offset + 17),
        numMarshalZones: view.getUint8(offset + 18),
        marshalZones: marshalZones,
        safetyCarStatus: view.getUint8(marshalOffset),
        networkGame: view.getUint8(marshalOffset + 1),
        numWeatherForecastSamples: view.getUint8(marshalOffset + 2),
        weatherForecastSamples: forecastSample,
        forecastAccuracy: view.getUint8(forecastOffset),
        aiDifficulty: view.getUint8(forecastOffset + 1),
        seasonLinkIdentifier: view.getUint32(forecastOffset + 2, true),
        weekendLinkIdentifier: view.getUint32(forecastOffset + 6, true),
        sessionLinkIdentifier: view.getUint32(forecastOffset + 10, true),
        pitStopWindowIdealLap: view.getUint8(forecastOffset + 14),
        pitStopWindowLatestLap: view.getUint8(forecastOffset + 15),
        pitStopRejoinPosition: view.getUint8(forecastOffset + 16),
        steeringAssist: view.getUint8(forecastOffset + 17),
        brakingAssist: view.getUint8(forecastOffset + 18),
        gearboxAssist: view.getUint8(forecastOffset + 19),
        pitAssist: view.getUint8(forecastOffset + 20),
        pitReleaseAssist: view.getUint8(forecastOffset + 21),
        ERSAssist: view.getUint8(forecastOffset + 22),
        DRSAssist: view.getUint8(forecastOffset + 23),
        dynamicRacingLine: view.getUint8(forecastOffset + 24),
        dynamicRacingLineType: view.getUint8(forecastOffset + 25),
        gameMode: view.getUint8(forecastOffset + 26),
        ruleSet: view.getUint8(forecastOffset + 27),
        timeOfDay: view.getUint32(forecastOffset + 28, true),
        sessionLength: view.getUint8(forecastOffset + 32),
        speedUnitsLeadPlayer: view.getUint8(forecastOffset + 33),
        temperatureUnitsLeadPlayer: view.getUint8(forecastOffset + 34),
        speedUnitsSecondaryPlayer: view.getUint8(forecastOffset + 35),
        temperatureUnitsSecondaryPlayer: view.getUint8(forecastOffset + 36),
        numSafetyCarPeriods: view.getUint8(forecastOffset + 37),
        numVirtualSafetyCarPeriods: view.getUint8(forecastOffset + 38),
        numRedFlagPeriods: view.getUint8(forecastOffset + 39),
        equalCarPerformance: view.getUint8(forecastOffset + 40),
        recoveryMode: view.getUint8(forecastOffset + 41),
        flashbackLimit: view.getUint8(forecastOffset + 42),
        surfaceType: view.getUint8(forecastOffset + 43),
        lowFuelMode: view.getUint8(forecastOffset + 44),
        raceStarts: view.getUint8(forecastOffset + 45),
        tyreTemperature: view.getUint8(forecastOffset + 46),
        pitLaneTyreSim: view.getUint8(forecastOffset + 47),
        carDamage: view.getUint8(forecastOffset + 48),
        carDamageRate: view.getUint8(forecastOffset + 49),
        collisions: view.getUint8(forecastOffset + 50),
        collisionsOffForFirstLapOnly: view.getUint8(forecastOffset + 51),
        mpUnsafePitRelease: view.getUint8(forecastOffset + 52),
        mpOffForGriefing: view.getUint8(forecastOffset + 53),
        cornerCuttingStringency: view.getUint8(forecastOffset + 54),
        parcFermeRules: view.getUint8(forecastOffset + 55),
        pitStopExperience: view.getUint8(forecastOffset + 56),
        safetyCar: view.getUint8(forecastOffset + 57),
        safetyCarExperience: view.getUint8(forecastOffset + 58),
        formationLap: view.getUint8(forecastOffset + 59),
        formationLapExperience: view.getUint8(forecastOffset + 60),
        redFlags: view.getUint8(forecastOffset + 61),
        affectsLicenceLevelSolo: view.getUint8(forecastOffset + 62),
        affectsLicenceLevelMP: view.getUint8(forecastOffset + 63),
        numSessionsInWeekend: view.getUint8(forecastOffset + 64),
        weekendStructure: [
            view.getUint8(forecastOffset + 65),
            view.getUint8(forecastOffset + 66),
            view.getUint8(forecastOffset + 67),
            view.getUint8(forecastOffset + 68),
            view.getUint8(forecastOffset + 69),
            view.getUint8(forecastOffset + 70),
            view.getUint8(forecastOffset + 71),
            view.getUint8(forecastOffset + 72),
            view.getUint8(forecastOffset + 73),
            view.getUint8(forecastOffset + 74),
            view.getUint8(forecastOffset + 75),
            view.getUint8(forecastOffset + 76)
        ],
        sector2LapDistanceStart: view.getFloat32(forecastOffset + 77, true),
        sector3LapDistanceStart: view.getFloat32(forecastOffset + 81, true),
    };
};

export interface LapData {
	lastLapTimeInMS: number;
	currentLapTimeInMS: number;
	sector1TimeMSPart: number;
    sector1TimeMinutesPart: number;
	sector2TimeMSPart: number;
    sector2TimeMinutesPart: number;
    deltaToCarInFrontMSPart: number;
    deltaToCarInFrontMinutesPart: number;
    deltaToRaceLeaderMSPart: number;
    deltaToRaceLeaderMinutesPart: number;
	lapDistance: number;
	totalDistance: number;
	safetyCarDelta: number;
	carPosition: number;
	currentLapNum: number;
	pitStatus: number;
	numPitStops: number;
	sector: number;
	currentLapInvalid: number;
	penalties: number;
	totalWarnings: number;
    cornerCuttingWarnings: number;
	numUnservedDriveThroughPens: number;
	numUnservedStopGoPens: number;
	gridPosition: number;
	driverStatus: number;
	resultStatus: number;
	pitLaneTimerActive: number;
	pitLaneTimeInLaneInMS: number;
	pitStopTimerInMS: number;
	pitStopShouldServePen: number;
    speedTrapFastestSpeed: number;
    speedTrapFastestLap: number;
};

export interface PacketLapData {
	header: PacketHeader;
	lapData: LapData[];
	timeTrialPBCarIdx: number;
	timeTrialRivalCarIdx: number;
};

export function parsePacketLapData(buffer: Uint8Array): PacketLapData {
	const view = new DataView(buffer.buffer);
	const header = parseHeader(view);
	let offset = 29;

	const lapData: LapData[] = [];
	for (let i = 0; i < 22; i++) {
		lapData.push({
			lastLapTimeInMS:                view.getUint32(offset, true),
            currentLapTimeInMS:             view.getUint32(offset + 4, true),
            sector1TimeMSPart:              view.getUint16(offset + 8, true),
            sector1TimeMinutesPart:         view.getUint8(offset + 10),
            sector2TimeMSPart:              view.getUint16(offset + 11, true),
            sector2TimeMinutesPart:         view.getUint8(offset + 13),
            deltaToCarInFrontMSPart:        view.getUint16(offset + 14, true),
            deltaToCarInFrontMinutesPart:   view.getUint8(offset + 16),
            deltaToRaceLeaderMSPart:        view.getUint16(offset + 17, true),
            deltaToRaceLeaderMinutesPart:   view.getUint8(offset + 19),
            lapDistance:                    view.getFloat32(offset + 20, true),
            totalDistance:                  view.getFloat32(offset + 24, true),
            safetyCarDelta:                 view.getFloat32(offset + 28, true),
            carPosition:                    view.getUint8(offset + 32),
            currentLapNum:                  view.getUint8(offset + 33),
            pitStatus:                      view.getUint8(offset + 34),
            numPitStops:                    view.getUint8(offset + 35),
            sector:                         view.getUint8(offset + 36),
            currentLapInvalid:              view.getUint8(offset + 37),
            penalties:                      view.getUint8(offset + 38),
            totalWarnings:                  view.getUint8(offset + 39),
            cornerCuttingWarnings:          view.getUint8(offset + 40),
            numUnservedDriveThroughPens:    view.getUint8(offset + 41),
            numUnservedStopGoPens:          view.getUint8(offset + 42),
            gridPosition:                   view.getUint8(offset + 43),
            driverStatus:                   view.getUint8(offset + 44),
            resultStatus:                   view.getUint8(offset + 45),
            pitLaneTimerActive:             view.getUint8(offset + 46),
            pitLaneTimeInLaneInMS:          view.getUint16(offset + 47, true),
            pitStopTimerInMS:               view.getUint16(offset + 49, true),
            pitStopShouldServePen:          view.getUint8(offset + 51),
            speedTrapFastestSpeed:          view.getFloat32(offset + 52, true),
            speedTrapFastestLap:            view.getUint8(offset + 56),
		});
		offset += 57;
	}

	return { header, lapData, timeTrialPBCarIdx: view.getUint8(offset), timeTrialRivalCarIdx: view.getUint8(offset + 1) };
};

export interface LiveryColour {
    red: number;
    green: number;
    blue: number;
}

export interface ParticipantData {
	aiControlled: number;
	driverId: number;
	networkId: number;
	teamId: number;
	myTeam: number;
	raceNumber: number;
	nationality: number;
	name: string;
	yourTelemetry: number;
    showOnlineNames: number;
    techLevel: number;
    platform: number;
    numColours: number;
    liveryColours: LiveryColour[];
};

export interface PacketParticipantsData {
	header: PacketHeader;
	numActiveCars: number;
	participants: ParticipantData[];
};

export function parsePacketParticipantsData(buffer: Uint8Array): PacketParticipantsData {
	const view = new DataView(buffer.buffer);
	const header: PacketHeader = parseHeader(view);
    let offset = 29;

	const numActiveCars = view.getUint8(offset++);
	const participants: ParticipantData[] = [];
	for (let i = 0; i < 22; i++) {
		const aiControlled =	view.getUint8(offset++);
		const driverId =		view.getUint8(offset++);
		const networkId =		view.getUint8(offset++);
		const teamId =		view.getUint8(offset++);
		const myTeam =		view.getUint8(offset++);
		const raceNumber =	view.getUint8(offset++);
		const nationality =	view.getUint8(offset++);
		const nameBytes = new Uint8Array(buffer.buffer, offset, 32);
		offset += 32;
		const nullIndex = nameBytes.indexOf(0);
		const trim = nullIndex === -1 ? nameBytes : nameBytes.subarray(0, nullIndex);
		const name = new TextDecoder("utf-8").decode(trim);
		const yourTelemetry = view.getUint8(offset++);
        const showOnlineNames = view.getUint8(offset++);
        const techLevel = view.getUint16(offset); offset += 2;
        const platform = view.getUint8(offset++);
        const numColours = view.getUint8(offset++);
        const liveryColours: LiveryColour[] = [];
        for(let j = 0; j < 4; j++){
            liveryColours.push({
                red: view.getUint8(offset++),
                green: view.getUint8(offset++),
                blue: view.getUint8(offset++),
            });
        }

		participants.push({ aiControlled, driverId, networkId, teamId, myTeam, raceNumber, nationality, name, yourTelemetry, showOnlineNames, techLevel, platform, numColours, liveryColours });
	}
	return { header, numActiveCars, participants };
};

export interface CarSetupData {
    frontWing: number;
    rearWing: number;
    onThrottle: number;
    offThrottle: number;
    frontCamber: number;
    rearCamber: number;
    frontToe: number;
    rearToe: number;
    frontSuspension: number;
    rearSuspension: number;
    frontAntiRollBar: number;
    rearAntiRollBar: number;
    frontSuspensionHeight: number;
    rearSuspensionHeight: number;
    brakePressure: number;
    brakeBias: number;
    engineBraking: number;
    rearLeftTyrePressure: number;
    rearRightTyrePressure: number;
    frontLeftTyrePressure: number;
    frontRightTyrePressure: number;
    ballast: number;
    fuelLoad: number;
};

export interface PacketCarSetupData {
    header: PacketHeader;
    carSetupData: CarSetupData[];
    nextFrontWingValue: number;
};

export function parsePacketCarSetupData(buffer: Uint8Array): PacketCarSetupData {
    const view = new DataView(buffer.buffer);
    const header: PacketHeader = parseHeader(view);
    let offset = 29;
    const carSetupData: CarSetupData[] = [];
    for(let i = 0; i < 22; i++){
        carSetupData.push({
            frontWing: view.getUint8(offset),
            rearWing: view.getUint8(offset + 1),
            onThrottle: view.getUint8(offset + 2),
            offThrottle: view.getUint8(offset + 3),
            frontCamber: view.getFloat32(offset + 4, true),
            rearCamber: view.getFloat32(offset + 8, true),
            frontToe: view.getFloat32(offset + 12, true),
            rearToe: view.getFloat32(offset + 16, true),
            frontSuspension: view.getUint8(offset + 20),
            rearSuspension: view.getUint8(offset + 21),
            frontAntiRollBar: view.getUint8(offset + 22),
            rearAntiRollBar: view.getUint8(offset + 23),
            frontSuspensionHeight: view.getUint8(offset + 24),
            rearSuspensionHeight: view.getUint8(offset + 25),
            brakePressure: view.getUint8(offset + 26),
            brakeBias: view.getUint8(offset + 27),
            engineBraking: view.getUint8(offset + 28),
            rearLeftTyrePressure: view.getFloat32(offset + 29, true),
            rearRightTyrePressure: view.getFloat32(offset + 33, true),
            frontLeftTyrePressure: view.getFloat32(offset + 37, true),
            frontRightTyrePressure: view.getFloat32(offset + 41, true),
            ballast: view.getUint8(offset + 45),
            fuelLoad: view.getFloat32(offset + 46, true),
        })
        offset += 50;
    }
    return {
        header, carSetupData, nextFrontWingValue: view.getFloat32(offset, true)
    }
};

export interface CarTelemetryData {
	speed: number;
	throttle: number;
	steer: number;
	brake: number;
	clutch: number;
	gear: number;
	engineRPM: number;
	drs: number;
	revLightsPercent: number;
	revLightsBitValue: number;
	brakesTemperature: number[];
	tyresSurfaceTemperature: number[];
	tyresInnerTemperature: number[];
	engineTemperature: number;
	tyresPressure: number[];
	surfaceType: number[];
};

export interface PacketCarTelemetryData {
	header: PacketHeader;
	carTelemetryData: CarTelemetryData[];
	mfdPanelIndex: number;
	mfdPanelIndexSecondaryPlayer: number;
	suggestedGear: number;
};

export function parsePacketCarTelemetryData(buffer: Uint8Array): PacketCarTelemetryData {
	const view = new DataView(buffer.buffer);
	const header: PacketHeader = parseHeader(view);
    let offset = 29;

	const carTelemetryData: CarTelemetryData[] = [];
	for (let i = 0; i < 22; i++) {
		carTelemetryData.push({
			speed: view.getUint16(offset, true),
            throttle: view.getFloat32(offset + 2, true),
            steer: view.getFloat32(offset + 6, true),
            brake: view.getFloat32(offset + 10, true),
            clutch: view.getUint8(offset + 14),
            gear: view.getInt8(offset + 15),
            engineRPM: view.getUint16(offset + 16, true),
            drs: view.getUint8(offset + 18),
			revLightsPercent: view.getUint8(offset + 19),
            revLightsBitValue: view.getUint16(offset + 20, true),
            brakesTemperature: [
                view.getUint16(offset + 22, true),
                view.getUint16(offset + 24, true),
                view.getUint16(offset + 26, true),
                view.getUint16(offset + 28, true)
            ],
            tyresSurfaceTemperature: [
                view.getUint8(offset + 30),
                view.getUint8(offset + 31),
                view.getUint8(offset + 32),
                view.getUint8(offset + 33)
            ],
			tyresInnerTemperature: [
                view.getUint8(offset + 34),
                view.getUint8(offset + 35),
                view.getUint8(offset + 36),
                view.getUint8(offset + 37)
            ],
            engineTemperature: view.getUint16(offset + 38, true),
            tyresPressure: [
                view.getFloat32(offset + 40, true),
                view.getFloat32(offset + 44, true),
                view.getFloat32(offset + 48, true),
                view.getFloat32(offset + 52, true)
            ],
            surfaceType: [
                view.getUint8(offset + 56),
                view.getUint8(offset + 57),
                view.getUint8(offset + 58),
                view.getUint8(offset + 59)
            ]
		});
        offset += 60;
	}

	const mfdPanelIndex = view.getUint8(offset++);
	const mfdPanelIndexSecondaryPlayer = view.getUint8(offset++);
	const suggestedGear = view.getInt8(offset++);

	return { header, carTelemetryData, mfdPanelIndex, mfdPanelIndexSecondaryPlayer, suggestedGear };
};

export interface CarStatusData {
	tractionControl: number;
	antiLockBrakes: number;
	fuelMix: number;
	frontBrakeBias: number;
	pitLimiterStatus: number;
	fuelInTank: number;
	fuelCapacity: number;
	fuelRemainingLaps: number;
	maxRPM: number;
	idleRPM: number;
	maxGears: number;
	drsAllowed: number;
	drsActivationDistance: number;
	actualTyreCompound: number;
	visualTyreCompound: number;
	tyresAgeLaps: number;
	vehicleFIAFlags: number;
    enginePowerICE: number;
    enginePowerMGUK: number;
	ersStoreEnergy: number;
	ersDeployMode: number;
	ersHarvestedThisLapMGUK: number;
	ersHarvestedThisLapMGUH: number;
	ersDeployedThisLap: number;
	networkPaused: number;
};

export interface PacketCarStatusData {
	header: PacketHeader;
	carStatusData: CarStatusData[];
};

export function parsePacketCarStatusData(buffer: Uint8Array): PacketCarStatusData {
	const view = new DataView(buffer.buffer);
	const header: PacketHeader = parseHeader(view);
    let offset = 29;
	const carStatusData: CarStatusData[] = [];
	for (let i = 0; i < 22; i++) {
		carStatusData.push({
			tractionControl:            view.getUint8(offset),
            antiLockBrakes:             view.getUint8(offset + 1),
            fuelMix:                    view.getUint8(offset + 2),
            frontBrakeBias:             view.getUint8(offset + 3),
            pitLimiterStatus:           view.getUint8(offset + 4),
            fuelInTank:                 view.getFloat32(offset + 5, true),
            fuelCapacity:               view.getFloat32(offset + 9, true),
            fuelRemainingLaps:          view.getFloat32(offset + 13, true),
			maxRPM:                     view.getUint16(offset + 17, true),
            idleRPM:                    view.getUint16(offset + 19, true),
            maxGears:                   view.getUint8(offset + 21),
            drsAllowed:                 view.getUint8(offset + 22),
            drsActivationDistance:      view.getUint16(offset + 23, true),
            actualTyreCompound:         view.getUint8(offset+ 25),
            visualTyreCompound:         view.getUint8(offset + 26),
            tyresAgeLaps:               view.getUint8(offset + 27),
			vehicleFIAFlags:            view.getInt8(offset + 28),
            enginePowerICE:             view.getFloat32(offset + 29, true),
            enginePowerMGUK:            view.getFloat32(offset + 33, true),
            ersStoreEnergy:             view.getFloat32(offset + 37, true),
            ersDeployMode:              view.getUint8(offset + 41),
            ersHarvestedThisLapMGUK:    view.getFloat32(offset + 42, true),
            ersHarvestedThisLapMGUH:    view.getFloat32(offset + 46, true),
            ersDeployedThisLap:         view.getFloat32(offset + 50, true),
            networkPaused:              view.getUint8(offset + 54)
		});
        offset += 55;
	}

	return { header, carStatusData };
};

export interface FinalClassificationData {
    position: number;
    numLaps: number;
    gridPosition: number;
    points: number;
    numPitStops: number;
    resultStatus: number;
    resultReason: number;
    bestLapTimeInMS: number;
    totalRaceTime: number;
    penaltiesTime: number;
    numPenalties: number;
    numTyreStints: number;
    tyreStintsActual: number[];
    tyreStintsVisual: number[];
    tyreStintsEndLaps: number[];
};

export interface PacketFinalClassificationData {
    header: PacketHeader;
    numCars: number;
    classificationData: FinalClassificationData[];
};

export function parsePacketClassificationData(buffer: Uint8Array): PacketFinalClassificationData {
    const view = new DataView(buffer.buffer);
    const header: PacketHeader = parseHeader(view);
    let offset = 29;
    const numCars = view.getUint8(offset++);
    const classificationData: FinalClassificationData[] = [];
    for(let i = 0; i < 22; i++){
        classificationData.push({
            position:           view.getUint8(offset),
            numLaps:            view.getUint8(offset + 1),
            gridPosition:       view.getUint8(offset + 2),
            points:             view.getUint8(offset + 3),
            numPitStops:        view.getUint8(offset + 4),
            resultStatus:       view.getUint8(offset + 5),
            resultReason:       view.getUint8(offset + 6),
            bestLapTimeInMS:    view.getUint32(offset + 7, true),
            totalRaceTime:      view.getFloat64(offset + 11, true),
            penaltiesTime:      view.getUint8(offset + 19),
            numPenalties:       view.getUint8(offset + 20),
            numTyreStints:      view.getUint8(offset + 21),
            tyreStintsActual: [
                view.getUint8(offset + 22),
                view.getUint8(offset + 23),
                view.getUint8(offset + 24),
                view.getUint8(offset + 25),
                view.getUint8(offset + 26),
                view.getUint8(offset + 27),
                view.getUint8(offset + 28),
                view.getUint8(offset + 29),
            ],
            tyreStintsVisual: [
                view.getUint8(offset + 30),
                view.getUint8(offset + 31),
                view.getUint8(offset + 32),
                view.getUint8(offset + 33),
                view.getUint8(offset + 34),
                view.getUint8(offset + 35),
                view.getUint8(offset + 36),
                view.getUint8(offset + 37),
            ],
            tyreStintsEndLaps: [
                view.getUint8(offset + 38),
                view.getUint8(offset + 39),
                view.getUint8(offset + 40),
                view.getUint8(offset + 41),
                view.getUint8(offset + 42),
                view.getUint8(offset + 43),
                view.getUint8(offset + 44),
                view.getUint8(offset + 45),
            ]
        })
        offset += 46;
    }
    return { header, numCars, classificationData }

};

export interface LobbyInfoData {
    aiControlled: number;
    teamId: number;
    nationality: number;
    platform: number;
    name: string;
    carNumber: number;
    yourTelemetry: number;
    showOnlineNames: number;
    techLevel: number;
    readyStatus: number;
};

export interface PacketLobbyInfoData {
    header: PacketHeader;
    numPlayers: number;
    lobbyPlayers: LobbyInfoData[];
};

export function parsePacketLobbyInfoData(buffer: Uint8Array): PacketLobbyInfoData {
    const view = new DataView(buffer.buffer);
    const header: PacketHeader = parseHeader(view);
    let offset = 30;
    const lobbyPlayers: LobbyInfoData[] = [];
    for(let i = 0; i < 22; i++){
        const nameBytes = new Uint8Array(buffer.buffer, offset + 4, 32);
		const nullIndex = nameBytes.indexOf(0);
		const trim = nullIndex === -1 ? nameBytes : nameBytes.subarray(0, nullIndex);
		const name = new TextDecoder("utf-8").decode(trim);
        lobbyPlayers.push({
            aiControlled:       view.getUint8(offset),
            teamId:             view.getUint8(offset + 1),
            nationality:        view.getUint8(offset + 2),
            platform:           view.getUint8(offset + 3),
            name,
            carNumber:          view.getUint8(offset + 36),
            yourTelemetry:      view.getUint8(offset + 37),
            showOnlineNames:    view.getUint8(offset + 38),
            techLevel:          view.getUint16(offset + 39, true),
            readyStatus:        view.getUint8(offset + 41),
        })
        offset += 42;
    }
    return { header, numPlayers: view.getUint8(29), lobbyPlayers };
};

export interface CarDamageData {
    tyresWear: number[];
    tyresDamage: number[];
    brakesDamage: number[];
    tyreBlisters: number[];
    frontLeftWingDamage: number;
    frontRightWingDamage:number;
    rearWingDamage:number;
    floorDamage:number;
    diffuserDamage:number;
    sidepodDamage:number;
    drsFault:number;
    ersFault:number;
    gearBoxDamage:number;
    engineDamage:number;
    engineMGUHWear:number;
    engineESWear:number;
    engineCEWear:number;
    engineICEWear:number;
    engineMGUKWear:number;
    engineTCWear:number;
    engineBlown:number;
    engineSeized: number;
}

export interface PacketCarDamageData {
    header: PacketHeader;
    carDamageData: CarDamageData[];
};

export function parsePacketCarDamageData(buffer: Uint8Array): PacketCarDamageData {
    const view = new DataView(buffer.buffer);
    const header: PacketHeader = parseHeader(view);
    let offset = 29;
    const carDamageData: CarDamageData[] = [];
    for(let i = 0; i < 22; i++){
        carDamageData.push({
            tyresWear: [
                view.getFloat32(offset, true),
                view.getFloat32(offset + 4, true),
                view.getFloat32(offset + 8, true),
                view.getFloat32(offset + 12, true),
            ],
            tyresDamage: [
                view.getUint8(offset + 16),
                view.getUint8(offset + 17),
                view.getUint8(offset + 18),
                view.getUint8(offset + 19),
            ],
            brakesDamage: [
                view.getUint8(offset + 20),
                view.getUint8(offset + 21),
                view.getUint8(offset + 22),
                view.getUint8(offset + 23),
            ],
            tyreBlisters: [
                view.getUint8(offset + 24),
                view.getUint8(offset + 25),
                view.getUint8(offset + 26),
                view.getUint8(offset + 27),
            ],
            frontLeftWingDamage:    view.getUint8(offset + 28),
            frontRightWingDamage:   view.getUint8(offset + 29),
            rearWingDamage:         view.getUint8(offset + 30),
            floorDamage:            view.getUint8(offset + 31),
            diffuserDamage:         view.getUint8(offset + 32),
            sidepodDamage:          view.getUint8(offset + 33),
            drsFault:               view.getUint8(offset + 34),
            ersFault:               view.getUint8(offset + 35),
            gearBoxDamage:          view.getUint8(offset + 36),
            engineDamage:           view.getUint8(offset + 37),
            engineMGUHWear:         view.getUint8(offset + 38),
            engineESWear:           view.getUint8(offset + 39),
            engineCEWear:           view.getUint8(offset + 40),
            engineICEWear:          view.getUint8(offset + 41),
            engineMGUKWear:         view.getUint8(offset + 42),
            engineTCWear:           view.getUint8(offset + 43),
            engineBlown:            view.getUint8(offset + 44),
            engineSeized:           view.getUint8(offset + 45)
        });
        offset += 46;
    }
    return { header, carDamageData }
};

export interface LapHistoryData {
    lapTimeInMS: number;
    sector1TimeMSPart: number;
    sector1TimeMinutesPart: number;
    sector2TimeMSPart: number;
    sector2TimeMinutesPart: number;
    sector3TimeMSPart: number;
    sector3TimeMinutesPart: number;
    lapValidBitFlags: number;
};

export interface TyreStintHistoryData {
    endLap: number;
    tyreActualCompound: number;
    tyreVisualCompound: number;
};

export interface PacketSessionHistoryData {
    header: PacketHeader;
    carIdx: number;
    numLaps: number;
    numTyreStints: number;
    bestLapTimeLapNum: number;
    bestSector1LapNum: number;
    bestSector2LapNum: number;
    bestSector3LapNum: number;
    lapHistoryData: LapHistoryData[];
    tyreStintsHistoryData: TyreStintHistoryData[];
};

export function parsePacketSessionHistoryData(buffer: Uint8Array): PacketSessionHistoryData {
    const view = new DataView(buffer.buffer);
    const header: PacketHeader = parseHeader(view);
    let offset = 36;
    const lapHistoryData: LapHistoryData[] = [];
    for(let i = 0; i < 100; i++){
        lapHistoryData.push({
            lapTimeInMS:            view.getUint32(offset, true),
            sector1TimeMSPart:      view.getUint16(offset + 4, true),
            sector1TimeMinutesPart: view.getUint8(offset + 6),
            sector2TimeMSPart:      view.getUint16(offset + 7, true),
            sector2TimeMinutesPart: view.getUint8(offset + 9),
            sector3TimeMSPart:      view.getUint16(offset + 10, true),
            sector3TimeMinutesPart: view.getUint8(offset + 12),
            lapValidBitFlags:       view.getUint8(offset + 13),
        });
        offset += 14;
    };
    const tyreStintsHistoryData: TyreStintHistoryData[] = [];
    for(let i = 0; i < 8; i++){
        tyreStintsHistoryData.push({
            endLap: view.getUint8(offset),
            tyreActualCompound: view.getUint8(offset + 1),
            tyreVisualCompound: view.getUint8(offset + 2),
        })
        offset += 3;
    };

    return {
        header,
        carIdx: view.getUint8(29),
        numLaps: view.getUint8(30),
        numTyreStints: view.getUint8(31),
        bestLapTimeLapNum: view.getUint8(32),
        bestSector1LapNum: view.getUint8(33),
        bestSector2LapNum: view.getUint8(34),
        bestSector3LapNum: view.getUint8(35),
        lapHistoryData,
        tyreStintsHistoryData
    };
};

export interface TyreSetData {
    actualTyreCompound: number;
    visualTyreCompound: number;
    wear: number;
    available: number;
    recommendedSession: number;
    lifeSpan: number;
    usableLife: number;
    lapDeltaTime: number;
    fitted: number;
};

export interface PacketTyreSetsData {
    header: PacketHeader;
    carIdx: number;
    tyreSetData: TyreSetData[];
    fittedIdx: number;
};

export function parsePacketTyreSetsData(buffer: Uint8Array): PacketTyreSetsData {
    const view = new DataView(buffer.buffer);
    const header: PacketHeader = parseHeader(view);
    let offset = 30;
    const tyreSetData: TyreSetData[] = [];
    for(let i = 0; i < 20; i++){
        tyreSetData.push({
            actualTyreCompound: view.getUint8(offset),
            visualTyreCompound: view.getUint8(offset + 1),
            wear:               view.getUint8(offset + 2),
            available:          view.getUint8(offset + 3),
            recommendedSession: view.getUint8(offset + 4),
            lifeSpan:           view.getUint8(offset + 5),
            usableLife:         view.getUint8(offset + 6),
            lapDeltaTime:       view.getUint16(offset + 7, true),
            fitted:             view.getUint8(offset + 9),
        })
        offset += 10;
    }

    return {
        header,
        carIdx: view.getUint8(29),
        tyreSetData,
        fittedIdx: view.getUint8(offset)
    }
};

// Motion Ex Packet (???) for now not needed

export interface TimeTrialDataSet {
    carIdx: number;
    teamId: number;
    lapTimeInMS: number;
    sector1TimeInMS: number;
    sector2TimeInMS: number;
    sector3TimeInMS: number;
    tractionControl: number;
    gearboxAssist: number;
    antiLockBrakes: number;
    equalCarPerformance: number;
    customSetup: number;
    valid: number;
};

export interface PacketTimeTrialData {
    header: PacketHeader;
    playerSessionBestDataSet: TimeTrialDataSet;
    personalBestDataSet: TimeTrialDataSet;
    rivalDataSet: TimeTrialDataSet;
};

export function parsePacketTimeTrialData(buffer: Uint8Array): PacketTimeTrialData {
    const view = new DataView(buffer.buffer);
    const header = parseHeader(view);
    let offset = 29;

    return {
        header,
        playerSessionBestDataSet: {
            carIdx:                 view.getUint8(offset),
            teamId:                 view.getUint8(offset + 1),
            lapTimeInMS:            view.getUint32(offset + 2, true),
            sector1TimeInMS:        view.getUint32(offset + 6, true),
            sector2TimeInMS:        view.getUint32(offset + 10, true),
            sector3TimeInMS:        view.getUint32(offset + 14, true),
            tractionControl:        view.getUint8(offset + 18),
            gearboxAssist:          view.getUint8(offset + 19),
            antiLockBrakes:         view.getUint8(offset + 20),
            equalCarPerformance:    view.getUint8(offset + 21),
            customSetup:            view.getUint8(offset + 22),
            valid:                  view.getUint8(offset + 23),
        },
        personalBestDataSet: {
            carIdx:                 view.getUint8(offset + 24),
            teamId:                 view.getUint8(offset + 25),
            lapTimeInMS:            view.getUint32(offset + 26, true),
            sector1TimeInMS:        view.getUint32(offset + 30, true),
            sector2TimeInMS:        view.getUint32(offset + 34, true),
            sector3TimeInMS:        view.getUint32(offset + 38, true),
            tractionControl:        view.getUint8(offset + 42),
            gearboxAssist:          view.getUint8(offset + 43),
            antiLockBrakes:         view.getUint8(offset + 44),
            equalCarPerformance:    view.getUint8(offset + 45),
            customSetup:            view.getUint8(offset + 46),
            valid:                  view.getUint8(offset + 47),
        },
        rivalDataSet: {
            carIdx:                 view.getUint8(offset + 48),
            teamId:                 view.getUint8(offset + 49),
            lapTimeInMS:            view.getUint32(offset + 50, true),
            sector1TimeInMS:        view.getUint32(offset + 54, true),
            sector2TimeInMS:        view.getUint32(offset + 58, true),
            sector3TimeInMS:        view.getUint32(offset + 62, true),
            tractionControl:        view.getUint8(offset + 66),
            gearboxAssist:          view.getUint8(offset + 67),
            antiLockBrakes:         view.getUint8(offset + 68),
            equalCarPerformance:    view.getUint8(offset + 69),
            customSetup:            view.getUint8(offset + 70),
            valid:                  view.getUint8(offset + 71),
        }
    }
};

// NOT NEEDED

// export interface PacketLapPositionsData {
//     header: PacketHeader;
//     numLaps: number;
//     lapStart: number;
//     positionForVehicleIdx: number[][];
// };