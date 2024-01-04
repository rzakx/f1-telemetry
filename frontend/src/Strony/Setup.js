import Axios from "axios";
import { useState } from "react";
import Nawigacja from "../Nawigacja";
import SetupItem from "../Components/SetupItem";
import gb from "../GlobalVars";
import { useParams } from "react-router-dom";

export default function Setup(props){
    const { setupId } = useParams();
    if(setupId){
        document.title = "TrackVision - Setup #"+setupId;
    } else {
        document.title = "TrackVision - Create Setup";
    }
    const [data, setData] = useState({
        //default init data
        fuel: 20,
        wingF: 25,
        wingR: 25,
        diffOn: 65,
        diffOff: 55,
        camberF: -3,
        camberR: -1.5,
        toeF: 0.05,
        toeR: 0.25,
        susF: 40,
        susR: 13,
        barF: 11,
        barR: 6,
        heightF: 35,
        heightR: 39,
        brakeP: 100,
        brakeB: 63,
        tireFR: 22.7,
        tireFL: 22.7,
        tireRR: 20.3,
        tireRL: 20.3,
        public: 'unset',
        track: 'unset',
        car: 'unset',
        weather: 'unset',
        type: 'unset'
    });
    const [response, setResponse] = useState(null);
    const [editmode, setEditmode] = useState(setupId ? false : true);
    const changeItem = (name, val) => {   
        const x = document.getElementById("setupsHref");
        x && x.classList.add('subPage');
        setData({...data, [name]: Number(val)});
    };
    const saveSetup = () => {
        if(data.public === 'unset'){
            setResponse({error: "Error: You have to choose setup privacy."});
            return;
        }
        if(data.track === 'unset'){
            setResponse({error: "Error: You have to choose track."});
            return;
        }
        if(data.car === 'unset'){
            setResponse({error: "Error: You have to choose car."});
            return;
        }
        if(data.weather === 'unset'){
            setResponse({error: "Error: You have to choose weather conditions."});
            return;
        }
        if(data.type === 'unset'){
            setResponse({error: "Error: You have to choose session type."});
            return;
        }
        Axios.post(gb.backendIP+"createSetup/"+localStorage.getItem('token'), {...data}).then((r) => {
            if(r.data['error']){
                setResponse({error: 'Error! '+r.data['error']});
                return;
            }
            if(r.data['odp']){
                setResponse({odp: `Setup #${r.data['odp']} created and saved in database!`, id: r.data['odp']})
            }
        }).catch((er) => {
            setResponse({error: 'Error! '+er.message});
        });
    };

    const loadSetup = () => {
        Axios.post(gb.backendIP+"setup/"+localStorage.getItem("token")+"/"+setupId).then((r) => {
            if(r.data['data']){
                setData({...data, ...r.data['data'], loaded: true});
            } else {
                setData({...data, loaded: true});
                setResponse({error: r.data['error']});
            }
        }).catch((er) => {
            setResponse({error: 'Error! Failed to load setup #'+setupId+' from database'});
        });
    };

    const updateSetup = () => {
        Axios.post(gb.backendIP+"updateSetup/"+localStorage.getItem("token")+"/"+setupId, {...data}).then((r) => {
            if(r.data['odp']){
                setResponse({odp: r.data['odp']});
            } else {
                setResponse({error: r.data['error']});
            }
        }).catch((er) => {
            setResponse({error: "Error! Failed to save changes of setup."});
        });
    };
    const updateDone = () => {
        setResponse(null);
        setEditmode(false);
    };

    return(
        <>
            <Nawigacja />
            <div className="screen">
                <div className="screenHeaderTitle smoothIn" style={{marginBottom: '-10px', position: 'relative'}}>
                    { !setupId ? <h1 className="title">Creating setup</h1> : <h1 className="title">Setup #{setupId}</h1>}
                    { !setupId ? <h3 className="title">Use sliders or fields to change values</h3> : <h3 className="title">Setup created {new Date(data.created).toLocaleString('pl', {day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"})}</h3>}
                    { !setupId ? (!response ? <div className="setupHeaderButtons">
                        <button style={{background: '#93011d'}} onClick={() => { window.location.href = "/setups"; }}>Cancel</button>
                        <button style={{background: '#006b00'}} onClick={() => saveSetup()}>Create</button>
                    </div> : "" ) : (
                    !response ?
                    (<div className="setupHeaderButtons">
                        <button style={{background: '#93011d'}} onClick={() => { window.location.href = "/setups"; }}>Close</button>
                        { editmode ? <button style={{background: '#006b00'}} onClick={() => updateSetup()}>Save</button> : <button style={{background: '#006b00'}} onClick={() => setEditmode(true)}>Edit</button> }
                    </div>) : "")}
                </div>
                <div className="setupDetails">
                    { response ? (response.error ?
                    <div className="setupPopup">{response.error}<br/><button onClick={() => setupId ? (window.location.href = `/setups`) : setResponse(null)}>OK</button></div>
                    : <div className="setupPopup">{response.odp}<br/><button onClick={() => { setupId ? updateDone() : (window.location.href = `/setup/${response.id}`) }}>OK</button></div>
                    ) : ""}
                    <div className="setupSection" style={{width: '300px', flexGrow: 'unset'}}>
                        <h3>Basic Information</h3>
                        <div className="setupBasics">
                            <select className={data.car === 'unset' ? `fillMe` : undefined} value={data.car} onChange={(e) => setData({...data, car: e.target.value})} disabled={!editmode}>
                                <option value={'unset'}>Choose Car</option>
                                <option value={-1}>Any Car</option>
                                {Object.entries(gb.teamIds).map((v, i) => {
                                    if(Number(v[0]) > 10) return;
                                    return (<option value={v[0]}>{v[1]}</option>);
                                })}
                            </select>
                            <select className={data.weather === 'unset' ? `fillMe` : undefined} value={data.weather} onChange={(e) => setData({...data, weather: e.target.value})} disabled={!editmode}>
                                <option value={'unset'}>Weather</option>
                                <option value={0}>Any</option>
                                <option value={1}>Dry</option>
                                <option value={2}>Wet</option>
                            </select>
                            <select className={data.type === 'unset' ? `fillMe` : undefined} value={data.type} onChange={(e) => setData({...data, type: e.target.value})} disabled={!editmode}>
                                <option value={'unset'}>Session</option>
                                <option value={0}>Any</option>
                                <option value={1}>Race</option>
                                <option value={2}>Hotlap</option>
                            </select>
                        </div>
                        <div className="setupBasics">
                            <select className={data.track === 'unset' ? `fillMe` : undefined} value={data.track} onChange={(e) => setData({...data, track: e.target.value})} disabled={!editmode}>
                                <option value={'unset'}>Track</option>
                                {gb.trackIds.map((v, i) => {
                                    return <option value={i}>{v}</option>;
                                })}
                            </select>
                            <select className={data.public === 'unset' ? `fillMe` : undefined} value={data.public} onChange={(e) => setData({...data, public: e.target.value})} disabled={!editmode}>
                                <option value={'unset'}>Setup privacy</option>
                                <option value={0}>Private setup</option>
                                <option value={1}>Public setup</option>
                            </select>
                        </div>
                        <SetupItem title="Fuel load" min={5} max={110} step={1} name="fuel" unit=" kg" changeItem={changeItem} value={data.fuel}  disabled={!editmode}/>
                    </div>
                    <div className="setupSection">
                        <h3>Aerodynamics</h3>
                        <SetupItem title="Front wing" min={0} max={50} step={1} name="wingF" unit={''} changeItem={changeItem} value={data.wingF}  disabled={!editmode}/>
                        <SetupItem title="Rear wing" min={0} max={50} step={1} name="wingR" unit={''} changeItem={changeItem} value={data.wingR}  disabled={!editmode}/>
                    </div>
                    <div className="setupSection" style={{flexGrow: 'unset'}}>
                        <h3>Brakes</h3>
                        <SetupItem title="Pressure" name="brakeP" min={80} max={100} step={1} unit="%" value={data.brakeP} changeItem={changeItem}  disabled={!editmode}/>
                        <SetupItem title="Bias" name="brakeB" min={50} max={70} step={1} unit="%" value={data.brakeB} changeItem={changeItem}  disabled={!editmode}/>
                    </div>
                    <div className="setupSection">
                        <h3>Differential</h3>
                        <SetupItem title="Throttle On" name="diffOn" min={50} max={100} step={1} unit="%" value={data.diffOn} changeItem={changeItem}  disabled={!editmode}/>
                        <SetupItem title="Throttle Off" name="diffOff" min={50} max={100} step={1} unit="%" value={data.diffOff} changeItem={changeItem}  disabled={!editmode}/>
                    </div>
                    <div className="setupSection" style={{width: '430px'}}>
                        <h3>Geometry Suspension</h3>
                        <SetupItem title="Front Camber" name="camberF" min={-3.5} max={-2.5} step={0.1} unit="˚" value={data.camberF} changeItem={changeItem} disabled={!editmode} />
                        <SetupItem title="Rear Camber" name="camberR" min={-2} max={-1} step={0.1} unit="˚" value={data.camberR} changeItem={changeItem} disabled={!editmode} />
                        <SetupItem title="Front Toe" name="toeF" min={0} max={0.1} step={0.01} unit="˚" value={data.toeF} changeItem={changeItem} disabled={!editmode} />
                        <SetupItem title="Rear Toe" name="toeR" min={0.1} max={0.3} step={0.01} unit="˚" value={data.toeR} changeItem={changeItem} disabled={!editmode} />
                    </div>
                    <div className="setupSection">
                        <h3>Suspension</h3>
                        <SetupItem title="Front Suspension" name="susF" min={1} max={41} step={1} unit="" value={data.susF} changeItem={changeItem} disabled={!editmode} />
                        <SetupItem title="Rear Suspension" name="susR" min={1} max={41} step={1} unit="" value={data.susR} changeItem={changeItem} disabled={!editmode} />
                        <SetupItem title="Front Anti-Roll Bar" name="barF" min={1} max={21} step={1} unit="" value={data.barF} changeItem={changeItem} disabled={!editmode} />
                        <SetupItem title="Rear Anti-Roll Bar" name="barR" min={1} max={21} step={1} unit="" value={data.barR} changeItem={changeItem} disabled={!editmode} />
                        <SetupItem title="Front Ride Height" name="heightF" min={30} max={50} step={1} unit="" value={data.heightF} changeItem={changeItem} disabled={!editmode} />
                        <SetupItem title="Rear Ride Height" name="heightR" min={30} max={50} step={1} unit="" value={data.heightR} changeItem={changeItem} disabled={!editmode} />
                    </div>
                    <div className="setupSection">
                        <h3>Tires</h3>
                        <SetupItem title="Front Right Tire Pressure" name="tireFR" min={22} max={25} step={0.1} unit=" psi" value={data.tireFR} changeItem={changeItem} disabled={!editmode} />
                        <SetupItem title="Front Left Tire Pressure" name="tireFL" min={22} max={25} step={0.1} unit=" psi" value={data.tireFL} changeItem={changeItem} disabled={!editmode} />
                        <SetupItem title="Rear Right Tire Pressure" name="tireRR" min={20} max={23} step={0.1} unit=" psi" value={data.tireRR} changeItem={changeItem} disabled={!editmode} />
                        <SetupItem title="Rear Left Tire Pressure" name="tireRL" min={20} max={23} step={0.1} unit=" psi" value={data.tireRL} changeItem={changeItem} disabled={!editmode} />
                    </div>
                </div>
            </div>
            {(setupId && !data.loaded) ? loadSetup() : ""}
        </>
    )
};