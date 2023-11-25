const GlobalVars = {
    backendIP: "https://backend2.rzak.pl/",
    nazwaTrybuERS: ["None", "Medium", "Hotlap", "Overtake"],
    typOponWizualnie: {
		16: "Soft",
		17: "Medium",
		18: "Hard",
		7: "Inter",
		8: "Wet",
		15: "Wet",
		19: "Ultra Soft",
		20: "Soft",
		21: "Medium",
		22: "Hard"
	},
    tireImages: {
        'Soft': 'tiresoft.svg',
        'Medium': 'tiremedium.svg',
        'Hard': 'tirehard.svg',
        'Inter': 'tireinter.svg',
        'Wet': 'tirewet.svg',
        'Ultra Soft': 'tireultrasoft.svg'
    },
    weatherType: ['Clear', 'Light clouds', 'Overcast', 'Light rain', 'Heavy rain', 'Storm'],
    trybPaliwo: ["Lean", "Normal", "Rich"],
    typOpon: {
		16: "C5",
		17: "C4",
		18: "C3",
		19: "C2",
		20: "C1",
		7: "Inter",
		8: "Wet"
	},
    teamIds: {
        0: 'Mercedes',
        1: 'Ferrari',
        2: 'Red Bull Racing',
        3: 'Williams',
        4: 'Aston Martin',
        5: 'Alpine',
        6: 'Alpha Tauri',
        7: 'Haas',
        8: 'McLaren',
        9: 'Alfa Romeo',
        85: 'Mercedes 2020',
        86: 'Ferrari 2020',
        87: 'Red Bull 2020',
        88: 'Williams 2020',
        89: 'Racing Point 2020',
        90: 'Renault 2020',
        91: 'Alpha Tauri 2020',
        92: 'Haas 2020',
        93: 'McLaren 2020',
        94: 'Alfa Romeo 2020',
        95: 'Aston Martin DB11 V12',
        96: 'Aston Martin Vantage F1 Edition',
        97: 'Aston Martin Vantage Safety Car',
        98: 'Ferrari F8 Tributo',
        99: 'Ferrari Roma',
        100: 'McLaren 720S',
        101: 'McLaren Artura',
        102: 'Mercedes AMG GT Black Series Safety Car',
        103: 'Mercedes AMG GTR Pro',
        104: 'F1 Custom Team',
        106: 'Prema ‘21',
        107: 'Uni-Virtuosi ‘21',
        108: 'Carlin ‘21',
        109: 'Hitech ‘21',
        110: 'Art GP ‘21',
        111: 'MP Motorsport ‘21',
        112: 'Charouz ‘21',
        113: 'Dams ‘21',
        114: 'Campos ‘21',
        115: 'BWT ‘21',
        116: 'Trident ‘21',
        117: 'Mercedes AMG GT Black Series'
    },
    carImages: {
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
    },
    trackIds: ["Melbourne (Australia)", "Paul Ricard (France)", "Shanghai", "Sakhir (Bahrain)", "Catalunya (Spain)",
            "Monaco", "Montreal", "Silverstone (UK)", "Hockenheim (Germany)", "Hungaroring (Hungary)", "Spa (Belgium)",
            "Monza (Italy)", "Singapore","Suzuka (Japan)", "Abu Dhabi", "Texas (USA)", "Brazil", "Austria",
            "Sochi (Russia)", "Mexico", "Baku (Azerbaijan)", "Sakhir Short", "Silverstone Short",
            "Texas Short", "Suzuka Short", "Hanoi", "Zandvoort (Netherlands)", "Imola (Italy)", "Portimão",
            "Jeddah", "Miami (USA)"
    ],
    minimapMappings: [
        [770, 910, 1550, 1850], //australia
        [1100, 700, 2200, 1320], //france
        [700, 600, 1400, 1300], //shangai
        [450, 660, 900, 1300], //bahrain
        [570, 630, 1050, 1320], //spain
        [400, 500, 900, 1100], //monaco
        [250, 500, 750, 2050], //canada
        [650, 850, 1200, 1900], //silverstone
        [0, 0, 0, 0], //hockenheim
        [650, 650, 1150, 1300], //hungary
        [800, 1120, 1400, 2220], //belgium
        [700, 1150, 1400, 2300], //monza
        [750, 470, 1560, 1020], //singapore
        [1050, 600, 2100, 1300], //japan
        [770, 316, 1600, 1006], //abu dhabi
        [900, 150, 2000, 1300], //texas
        [590, 380, 720, 1150], //brazil
        [600, 500, 1400, 900], //austria
        [900, 600, 1900, 1250], //russia
        [1050, 1100, 1650, 1250], //mexico
        [1220, 970, 2250, 1660], //azerbaijan
        [450, 660, 900, 1300], //bahrain
        [650, 850, 1200, 1900], //silverstone
        [900, 150, 2000, 1300], //texas
        [1050, 600, 2100, 1300], //japan
        [800, 800, 1700, 1700], //hanoi
        [500, 500, 1200, 1000], //zandvoort
        [280, 620, 750, 1250], //portimao
        [370, 1450, 750, 2900], //saudi
        [800, 303, 1600, 642], //miami
    ],
    trackMaps: [
        "australia.svg",
        "france.svg",
        "shanghai.svg",
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
        "zandvoort.svg",
        "imola.svg",
        "portimao.svg",
        "saudi.svg",
        "miami.svg"
    ],
    typKary: [
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
    ],
    sessionType: ["Unknown", "Practice 1", "Practice 2", "Practice 3", "Short Practice", "Qualification 1", "Qualification 2", "Qualification 3", "Short Race", "OSQ", "Race", "Race 2", "Race 3", "Time Trial"],
    lapTimeFormat: (ms, okr) => {
		if(!ms) return;
		if(okr)	return(<>{(parseInt(ms/60000) < 10) ? "0"+parseInt(ms/60000) : parseInt(ms/60000)}:{(parseInt((ms/1000)%60) < 10) ? "0"+parseInt(ms/1000)%60 : parseInt(ms/1000)%60}.{(parseInt(ms%1000) < 100) ? ((parseInt(ms%1000) < 10) ? "00"+parseInt(ms%1000) : "0"+parseInt(ms%1000)) : parseInt(ms%1000)}</>);
		else return(<>{(parseInt(ms/1000) < 10) ? "0"+parseInt(ms/1000) : parseInt(ms/1000)}.{(parseInt(ms%1000) < 100) ? ((parseInt(ms%1000) < 10) ? "00"+parseInt(ms%1000) : "0"+parseInt(ms%1000)) : parseInt(ms%1000)}</>);
	}
};
export default GlobalVars;