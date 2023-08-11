import gb from "../GlobalVars.js";
import Nawigacja from "../Nawigacja.js";
import { NavLink, useParams } from "react-router-dom";
import Axios from "axios";
import { useState } from "react";
import LoadingIndicator from "../Components/LoadingIndicator.js";
import { AreaChart, XAxis, YAxis, CartesianGrid, Area, Line, LineChart, Label, Tooltip, ResponsiveContainer } from "recharts";

export default function ShowSessions(props){
    const {sessionId} = useParams();
    const [chartsLap, setChartsLap ] = useState(null);
    const [refLapId, setRefLapId] = useState(localStorage.getItem("referenceLap") ? JSON.parse(localStorage.getItem("referenceLap")).id : null);
    const [session, setSession] = useState({data: null, checkOwn: false, isChecking: false});
    if(!sessionId){
        window.location.href = "/sessions";
    }

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
                        <thead><tr><th>Lap</th><th>Tire type</th><th>Lap Time</th><th>Sector 1</th><th>Sector 2</th><th>Sector 3</th><th>Action</th></tr></thead>
                        <tbody>
                    { lapTimes.length && lapTimes.map((time, okr) => {
                        const lastLapData = Object.entries(session.data).filter((v, k) => v[0] == laps[okr].maxF)[0][1];
                        return <tr key={"okr"+okr}>
                                <td>{okr}</td>
                                <td>{gb.typOponWizualnie[ lastLapData.statusPojazdu.typOponWizualne ]}</td>
                                <td>{gb.lapTimeFormat(time, true)}</td>
                                <td>{gb.lapTimeFormat(lapS1[okr] || time , false)}</td>
                                <td>{lapS1[okr] ? gb.lapTimeFormat(lapS2[okr], false) : "-"}</td>
                                <td>{(lapS1[okr] && lapS2[okr]) ? gb.lapTimeFormat(time - lapS1[okr] - lapS2[okr], false) : "-"}</td>
                                <td>
                                    <button className="tabelaOdnosnik" onClick={() => setChartsLap({minF: laps[okr].minF, maxF: laps[okr].maxF, frames: laps[okr].f, time: time, lapNumber: okr})}>Charts</button>
                                    {(refLapId ? (
                                        (refLapId == (sessionId + "-lap" + okr))
                                        ? <button className="tabelaOdnosnik danger" onClick={ () => {
                                            localStorage.removeItem("referenceLap");
                                            setRefLapId(null);
                                        }}>Unlink Ref</button>
                                        : <button className="tabelaOdnosnik danger">Compare</button>
                                    )
                                    :
                                    <button className="tabelaOdnosnik danger" onClick={ () => linkRef(okr, laps[okr]) }>Link Ref</button>
                                    )}
                                </td>
                            </tr>
                    })}
                    </tbody>
                    </table>
                    <div className="filler" />
                </div>
            </div>
        );
    };

    const showCharts = () =>{
        let topSpeed = 0;
        let avgSpeed = 0;
        let avgThrottle = 0;
        let avgBrake = 0;
        let drsUsage = false;
        let x = 0;
        let initTireDegradation = undefined;
        let lastTireDegradation = undefined;

        let chartsData = [];

        chartsLap.frames.map( frame => {
            const frameData = session.data[frame];
            x = x+1;
            if(frameData.telemetria.predkosc > topSpeed) topSpeed = frameData.telemetria.predkosc;
            avgSpeed = avgSpeed + frameData.telemetria.predkosc;
            avgThrottle = avgThrottle + frameData.telemetria.gaz*100;
            avgBrake = avgBrake + frameData.telemetria.hamulec*100;
            chartsData.push({frame: frame, gear: frameData.telemetria.bieg, drs: frameData.telemetria.aktywowanyDRS, steering: (frameData.telemetria.kierownica).toFixed(3), speed: frameData.telemetria.predkosc, throttle: (frameData.telemetria.gaz*100).toFixed(0), brake: (frameData.telemetria.hamulec*100).toFixed(0)})
            if(frameData.uszkodzenia){
                if(initTireDegradation === undefined) initTireDegradation = (frameData.uszkodzenia.zuzycieFR + frameData.uszkodzenia.zuzycieFL + frameData.uszkodzenia.zuzycieRR + frameData.uszkodzenia.zuzycieRL)/4;
                lastTireDegradation = (frameData.uszkodzenia.zuzycieFR + frameData.uszkodzenia.zuzycieFL + frameData.uszkodzenia.zuzycieRR + frameData.uszkodzenia.zuzycieRL)/4
            }
        });
        console.log(session.data);
        console.log(chartsData);
        /*
        todo:
        - ers % baterii
        - car damage check,
        - check compared lap czy jest na tym samym torze
        - tire type wyswietlic w chartsach
        - delta wykres
        - tire temp wykres
        - gear wykres
        - napisac funkcje wychwyc bledy
        */
        
        return(
            <div className="lapDetails">
                <button className="closeButton" onClick={() => setChartsLap(null)}>Close</button>
                <div className="lapDetailsInfo">
                    <span>Lap number {chartsLap.lapNumber}</span>
                    <span>Lap time {gb.lapTimeFormat(chartsLap.time, true)}</span>
                    <span>Top speed {topSpeed} kmh</span>
                    <span>Average speed {(avgSpeed/x).toFixed(1)} kmh</span>
                    <span>Average gas throttle input {(avgThrottle/x).toFixed(1)}%</span>
                    <span>Average brake input {(avgBrake/x).toFixed(0)}%</span>
                    <span>Tire degradation {(lastTireDegradation - initTireDegradation).toFixed(2)}%</span>
                    <span>ERS burnt {session.data[chartsLap.maxF].statusPojazdu.wykorzystanyERS} Joules</span>
                    <span>Car damage: yes/no</span>
                </div>
                <div className="lapCharts">
                    <h3>Speed</h3>
                    <ResponsiveContainer className="lapChart">
                        <AreaChart syncId="charts" data={chartsData} margin={{left: 20, bottom: 0}}>
                            <defs>
                                <linearGradient id="speedColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#af7d00" stopOpacity={0.9}/>
                                    <stop offset="95%" stopColor="#af7d00" stopOpacity={0.3}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="frame" tick={false}/>
                            <YAxis unit="kmh" />
                            <CartesianGrid strokeDasharray="3 3" stroke="#aaa" strokeOpacity={0.1}/>
                            <Tooltip />
                            <Area type="monotone" dataKey="speed" strokeWidth={2} stroke="#af7d00" fill="url(#speedColor)" fillOpacity={1} />
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
                            <XAxis dataKey="frame" tick={false}/>
                            <YAxis unit="%" />
                            <CartesianGrid strokeDasharray="3 3" stroke="#aaa" strokeOpacity={0.1}/>
                            <Tooltip />
                            <Area type="monotone" dataKey="brake" strokeWidth={2} stroke="#6a0000" fill="url(#brakeColor)" />
                            <Area type="monotone" dataKey="throttle" strokeWidth={2} stroke="#004600" fill="url(#throttleColor)" />
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
                            <XAxis dataKey="frame" tick={false}/>
                            <YAxis domain={[-1, 1]}/>
                            <CartesianGrid strokeDasharray="3 3" stroke="#aaa" strokeOpacity={0.1}/>
                            <Tooltip />
                            <Area type="monotone" dataKey="steering" strokeWidth={2} stroke="dodgerblue" fill="url(#steeringColor)" fillOpacity={0.5} />
                        </AreaChart>
                    </ResponsiveContainer>

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