export const backendURL: string = "https://backendformula.zakrzewski.dev";
export type sessionData = {
    id: number,
    session_id: string,
    user_id: number,
    car_id: number,
    track_id: number,
    sessionType: number,
    lastUpdate: Date,
    ip?: string,
};
export const ersModeNames: Array<string> = ["None", "Medium", "Hotlap", "Overtake"];
export const tireImages = {
    'Soft': 'tiresoft.svg',
    'Medium': 'tiremedium.svg',
    'Hard': 'tirehard.svg',
    'Inter': 'tireinter.svg',
    'Wet': 'tirewet.svg',
    'Ultra Soft': 'tireultrasoft.svg'
};
export const tireNameVisual: Record<number, string> = {
	7: "Inter",
	8: "Wet",
	16: "Soft",
	17: "Medium",
	18: "Hard",
	15: "Wet",
	19: "Ultra Soft",
	20: "Soft",
	21: "Medium",
	22: "Hard"
};

export const tireName: Record<number, string> = {
    7: "Inter",
    8: "Wet",
    16: "C5",
	17: "C4",
	18: "C3",
	19: "C2",
	20: "C1",
};
export const fuelMixture: Array<string> = ["Lean", "Normal", "Rich"];
export const weatherType: Array<string> = ['Clear', 'Light clouds', 'Overcast', 'Light rain', 'Heavy rain', 'Storm', 'Unknown'];
export const carImage: Record<number, string> = {
    0: 'mercedes.png',
    1: 'ferrari.png',
    2: 'redbull.png',
    3: 'williams.png',
    4: 'astonmartin.png',
    5: 'alpine.png',
    6: 'alphatauri.png',
    7: 'haas.png',
    8: 'mclaren.png',
    9: 'alfaromeo.png'
};
export const getTeamById: Record<number, {name: string, color?: string }> = {
        0: { name: 'Mercedes', color: "#35d2d7" },
        1: { name: 'Ferrari', color: "#e11f0f" },
        2: { name: 'Red Bull Racing', color: "#0d106f" },
        3: { name: 'Williams', color: "#096fff" },
        4: { name: 'Aston Martin', color: "#3b9054" },
        5: { name: 'Alpine', color: "#e55fff" },
        6: { name: 'VCARB RB', color: "#d9e2f3" },
        7: { name: 'Haas', color: "#676767" },
        8: { name: 'McLaren', color: "#ff5c04" },
        9: { name: 'KICK Sauber', color: "#00e701" },
        41: { name: "F1 Generic" },
        104: { name: 'F1 Custom Team' },
        129: { name: 'Konnersport' },
        142: { name: "APXGP '24" },
        154: { name: "APXGP '25" },
        155: { name: "Konnersport '24" },
        158: { name: "Art GP '24" },
        159: { name: "Campos '24" },
        160: { name: "Rodin Motorsport '24" },
        161: { name: "AIX Racing '24" },
        162: { name: "DAMS '24" },
        163: { name: "Hitech '24" },
        164: { name: "MP Motorsport '24" },
        165: { name: "Prema '24" },
        166: { name: "Trident '24" },
        167: { name: "Van Amersfoort Racing '24" },
        168: { name: "Invicta '24" },
        185: { name: "Mercedes '24" },
        186: { name: "Ferrari '24" },
        187: { name: "Red Bull Racing '24" },
        188: { name: "Williams '24" },
        189: { name: "Aston Martin '24" },
        190: { name: "Alpine '24" },
        191: { name: "RB '24" },
        192: { name: "Haas '24" },
        193: { name: "McLaren '24" },
        194: { name: "Sauber '24" },
};
export const sessionNameById: Array<string> = ["Unknown", "Practice 1", "Practice 2", "Practice 3", "Short Practice", "Qualification 1", "Qualification 2", "Qualification 3", "Short Qualifying", "One-Shot Qualifying", "Sprint Shootout 1", "Sprint Shootout 2", "Sprint Shootout 3", "Short Sprint Shootout", "One-Shot Sprint Shootout", "Race", "Race 2", "Race 3", "Time Trial"];
export const surfaceNameById: Array<string> = ["Tarmac", "Rumble strip", "Concrete", "Rock", "Gravel", "Mud", "Sand", "Grass", "Water", "Cobblestone", "Metal", "Ridged"];
export const penaltyTypes: Array<string> = [
    "Drive through",
    "Stop Go",
    "Grid penalty",
    "Penalty reminder",
    "Time penalty",
    "Warning",
    "Disqualified",
    "Removed from formation lap",
    "Parked too long timer",
    "Tyre regulations",
    "This lap invalidated",
    "This and next lap invalidated",
    "This lap invalidated without reason",
    "This and next lap invalidated without reason",
    "This and previous lap invalidated",
    "This and previous lap invalidated without reason",
    "Retired",
    "Black flag timer"
];
export const infrigementTypes: Array<string> = [
    "Blocking by slow driving",
    "Blocking by wrong way driving",
    "Reversing off the start line",
    "Big Collision",
    "Small Collision",
    "Collision failed to hand back position single",
    "Collision failed to hand back position multiple",
    "Corner cutting gained time",
    "Corner cutting overtake single",
    "Corner cutting overtake multiple",
    "Crossed pit exit lane",
    "Ignoring blue flags",
    "Ignoring yellow flags",
    "Ignoring drive through",
    "Too many drive throughs",
    "Drive through reminder serve within n laps",
    "Drive through reminder serve this lap",
    "Pit lane speeding",
    "Parked for too long",
    "Ignoring tyre regulations",
    "Too many penalties",
    "Multiple warnings",
    "Approaching disqualification",
    "Tyre regulations select single",
    "Tyre regulations select multiple",
    "Lap invalidated corner cutting",
    "Lap invalidated running wide",
    "Corner cutting ran wide gained time minor",
    "Corner cutting ran wide gained time significant",
    "Corner cutting ran wide gained time extreme",
    "Lap invalidated wall riding",
    "Lap invalidated flashback used",
    "Lap invalidated reset to track",
    "Blocking the pitlane",
    "Jump start",
    "Safety car to car collision",
    "Safety car illegal overtake",
    "Safety car exceeding allowed pace",
    "Virtual safety car exceeding allowed pace",
    "Formation lap below allowed speed",
    "Formation lap parking",
    "Retired mechanical failure",
    "Retired terminally damaged",
    "Safety car falling too far back",
    "Black flag timer",
    "Unserved stop go penalty",
    "Unserved drive through penalty",
    "Engine component change",
    "Gearbox change",
    "Parc Fermé change",
    "League grid penalty",
    "Retry penalty",
    "Illegal time gain",
    "Mandatory pitstop",
    "Attribute assigned"
];

export const trackNameById: Record<number, string> = {
    0: "Melbourne",
    2: "Shanghai",
    3: "Sakhir (Bahrain)",
    4: "Catalunya",
    5: "Monaco",
    6: "Montreal",
    7: "Silverstone",
    9: "Hungaroring",
    10: "Spa",
    11: "Monza",
    12: "Singapore",
    13: "Suzuka",
    14: "Abu Dhabi",
    15: "Texas",
    16: "Brazil",
    17: "Austria",
    19: "Mexico",
    20: "Baku (Azerbaijan)",
    26: "Zandvoort",
    27: "Imola",
    29: "Jeddah",
    30: "Miami",
    31: "Las Vegas",
    32: "Losail (Qatar)",
    39: "Silverstone (Reverse)",
    40: "Austria (Reverse)",
    41: "Zandvoort (Reverse)"
};
export const minimapMapping: Record<number, Array<number>> = {
        0: [-753, -887, 1508, 1778], // australia
        2: [-631, -554, 1262, 1110], // china shangai
        3: [-423, -625, 859, 1239], // bahrain
        4: [-542, -623, 1004, 1201], // spain catalunya
        5: [-371, -469, 781, 991], // monaco
        6: [-209, -461, 659, 1950], // montreal canada
        7: [-529, -880, 1057, 1760], // silverstone UK
        9: [-626, -632, 1108, 1242], // hungaroring hungary
        10: [-651, -1037, 1302, 2076], // belgium spa
        11: [-646, -1101, 1292, 2204], //monza
        12: [-731, -449, 1478, 949], // singapore
        13: [-923, -418, 2012, 1050], // suzuka japan
        14: [-738, -333, 1554, 995], // abu dhabi
        15: [-850, -60, 1862, 1117], // texas usa
        16: [-585, -358, 701, 1076], // brazil
        17: [-551, -499, 1301, 820], // austria
        19: [-1037, -1041, 1564, 1126], // mexico
        20: [-1202, -908, 2107, 1518], // azerbaijan
        26: [-485, -429, 1001, 866], // zandvoort netherlands
        27: [-925, -506, 1850, 1040], // imola italy
        29: [-312, -1386, 624, 2774], // jeddah, saudi arabia
        30: [-768, -317, 1534, 624], // miami usa
        31: [-605, -1012, 1208, 1982], // las vegas usa
        32: [-645, -753, 1290, 1506], // losail qatar
};
export const trackMap: Array<string> = [
        "australia.svg",
        "france.svg",
        "china.svg",
        "bahrain.svg",
        "spain.svg",
        "monaco.svg",
        "canada.svg",
        "silverstone.svg",
        "hockenheim.svg",
        "hungary.svg",
        "belgium.svg",
        "monza.svg",
        "singapore.svg",
        "japan.svg",
        "abudabi.svg",
        "texas.svg",
        "brazil.svg",
        "austria.svg",
        "russia.svg",
        "mexico.svg",
        "azerbaijan.svg",
        "bahrain.svg",
        "silverstone.svg",
        "texas.svg",
        "japan.svg",
        "hanoi.svg",
        "netherlands.svg",
        "imola.svg",
        "portimao.svg",
        "saudi.svg",
        "miami.svg",
        "lasvegas.svg",
        "qatar.svg"
    ];
export const penaltyNames: Array<string> = [
        "Drive through", 
        "Stop Go", 
        "Grid penalty", 
        "Penalty reminder", 
        "Time penalty", 
        "Warning", 
        "Disqualified", 
        "Removed from formation lap", 
        "Parked too long timer", 
        "Tyre regulations", 
        "This lap invalidated", 
        "This and next lap invalidated", 
        "This lap invalidated without reason", 
        "This and next lap invalidated without reason", 
        "This and previous lap invalidated", 
        "This and previous lap invalidated without reason", 
        "Retired", 
        "Black flag timer"
    ];
export const lapTimeFormat = (time: string | number, fullLap: boolean) => {
    if(!time) return;
    if(typeof time === "number") time = time.toString();
	if(fullLap)	{
        let msec = time.slice(-3);
        while(msec.length < 3) msec = `0${msec}`;
        let sec = (Number(time.slice(0, -3))%60).toString();
        while(sec.length < 2) sec = `0${sec}`;
        let minutes = parseInt( ( Number(time.slice(0, -3))/60 ).toString() ).toString();
        while(minutes.length !== 2) minutes = `0${minutes}`;
        return `${minutes}:${sec}.${msec}`;
    } else {
        let msec = time.slice(-3);
        while(msec.length < 3) msec = `0${msec}`;
        let sec = time.slice(0, -3);
        while(sec.length < 2) sec = `0${sec}`;
        return `${sec}.${msec}`;
    }
};