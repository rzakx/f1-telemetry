export interface IHeader {
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

export interface ICarMotion {
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

export interface ICarMotionExtra {
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

export interface IMarshalZone {
	zoneStart: number;
	zoneFlag: number;
};

export interface IWeatherForecastSample {
	sessionType: number;
	timeOffset: number;
	weather: number;
	trackTemperature: number;
	trackTemperatureChange: number;
	airTemperature: number;
	airTemperatureChange: number;
	rainPercentage: number;
};

export interface ISessionData {
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
	marshalZones: IMarshalZone[];
	safetyCarStatus: number;
	networkGame: number;
	numWeatherForecastSamples: number;
	weatherForecastSamples: IWeatherForecastSample[];
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

export interface ILapData {
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

export interface ILiveryColour {
    red: number;
    green: number;
    blue: number;
}

export interface IParticipantData {
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
    liveryColours: ILiveryColour[];
};

export interface ICustomParticipants {
	carId: number,
	name: string,
	ai: boolean,
	networkId: number,
	platform: number,
    teamId: number,
    raceNumber: number,
    driverId: number,
    liveryColours: ILiveryColour[]
};

export interface ICarSetupData {
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

export interface ICarTelemetryData {
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

export interface ICarStatusData {
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

export interface IFinalClassificationData {
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

export interface ILobbyInfoData {
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

export interface ICarDamageData {
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

export interface ILapHistoryData {
    lapTimeInMS: number;
    sector1TimeMSPart: number;
    sector1TimeMinutesPart: number;
    sector2TimeMSPart: number;
    sector2TimeMinutesPart: number;
    sector3TimeMSPart: number;
    sector3TimeMinutesPart: number;
    lapValidBitFlags: number;
};

export interface ITyreStintHistoryData {
    endLap: number;
    tyreActualCompound: number;
    tyreVisualCompound: number;
};

export interface IPacketSessionHistoryData {
    carIdx: number;
    numLaps: number;
    numTyreStints: number;
    bestLapTimeLapNum: number;
    bestSector1LapNum: number;
    bestSector2LapNum: number;
    bestSector3LapNum: number;
    lapHistoryData: ILapHistoryData[];
    tyreStintsHistoryData: ITyreStintHistoryData[];
};

export interface ITyreSetData {
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
    carIdx: number;
    tyreSetData: ITyreSetData[];
    fittedIdx: number;
};

export interface ITimeTrialDataSet {
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
    playerSessionBestDataSet: ITimeTrialDataSet;
    personalBestDataSet: ITimeTrialDataSet;
    rivalDataSet: ITimeTrialDataSet;
};