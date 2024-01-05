import { useState } from "react";
import { useParams } from "react-router-dom";
import Nawigacja from "../Nawigacja";
import Axios from "axios";
import gb from "../GlobalVars";
import { RiShoppingBasket2Fill } from "react-icons/ri";
import { FaUserCheck, FaUserTimes,FaUserClock, FaRedoAlt, FaPencilAlt, FaArrowAltCircleDown, FaArrowAltCircleUp } from "react-icons/fa";

export default function Profile(props){
    const obejscieTlo = (c) => { return {backgroundImage: `url('${c}')`} };
    const {userParam} = useParams();
    if(userParam){
        document.title = `TrackVision - ${userParam} profile`;
        if(userParam === localStorage.getItem('login')) { window.location.href = "/profile/"; }
    } else {
        document.title = 'TrackVision - Your profile';
    }

    const [ profileData, setProfileData ] = useState({ownProfile: false, urlCheck: false, loaded: false, edytor: false, prevLink: window.location.href});
    const [ editMode, setEditMode ] = useState({usunAwatar: false, bio: null, email: null, powiadomienie: ""});
    const resetAll = () => {
        setProfileData({ownProfile: false, urlCheck: false, loaded: false, edytor: false, prevLink: window.location.href});
    };

    const usunAwatar = () => {
        Axios.post(gb.backendIP+"deleteAvatar/"+localStorage.getItem('token')).then((r) => {
            localStorage.setItem('avatar', '/images/awatary/defaultAvatar.png');
            setEditMode({...editMode, usunAwatar: false, powiadomienie: "Avatar deleted succesfully!"});
        }).catch((er) => {
            setEditMode({...editMode, usunAwatar: false, powiadomienie: "Error! Something went wrong!"});
        });
    };

    const sprawdzUrl = () => {
		//sprawdzic zeby przydzielic wlasciwosc 'ownProfile' ktora bedzie odpowiadac za wyswietlanie panelu edycji profilu
        if(!userParam){
            setProfileData({...profileData, ownProfile: true, urlCheck: true, login: localStorage.getItem("login"), prevLink: window.location.href});
        } else {
            if(userParam == localStorage.getItem("login")){
                setProfileData({...profileData, ownProfile: true, urlCheck: true, login: userParam, prevLink: window.location.href});
            } else {
                setProfileData({...profileData, ownProfile: false, urlCheck: true, login: userParam, prevLink: window.location.href});
            }
        }
    };

    const wczytajDane = () => {
        Axios.post(gb.backendIP+"profilLookup", {kogo: profileData.login})
        .then((r) => {
            console.log(r.data);
            if(r.data['blad']){
                setProfileData({...profileData, loaded: true, blad: "Error! Couldn't load profile data..."});
            } else {
                if(profileData.ownProfile){
                    setEditMode({...editMode, description: r.data['description']});
                }
                setProfileData({...profileData, loaded: true, ...r.data});
            }
        }).catch((er) => {
            setProfileData({...profileData, loaded: true, blad: er.message});
        });
    };

    const wgrajAwatar = () => {
        Axios.post(gb.backendIP+"changeAvatar/"+localStorage.getItem("token"), {
            awatarImg: editMode.awatarPlik
        }, { headers: { 'Content-Type': 'multipart/form-data'}}).then((r) => {
            if(r.data['blad']){
                setEditMode({...editMode, plikNazwa: null, awatarPlik: null, awatarBlob: null, powiadomienie: "Oops! Something went wrong!"});
            } else {
                localStorage.setItem('avatar', r.data['odp']);
                setEditMode({...editMode, plikNazwa: null, awatarPlik: null, awatarBlob: null, powiadomienie: "Avatar succesfully changed!"});
                setProfileData({...profileData, awatar: r.data['odp']});
            }
        }).catch((er) => {
            setEditMode({...editMode, plikNazwa: null, awatarPlik: null, awatarBlob: null, powiadomienie: "Oops! Something went wrong!"});
        });
    };

    const zmienUlubione = () => {
        Axios.post(gb.backendIP+"changeFavourites/"+localStorage.getItem("token"), {
            favCar: (editMode.favCar != null) ? editMode.favCar : null,
            favTrack: (editMode.favTrack != null) ? editMode.favTrack : null
        }).then((r) => {
            if(r.data['odp']){
                setEditMode({...editMode, powiadomienie: "Favourites updated! 🤩"});
                setProfileData({...profileData, favCar: ((editMode.favCar != null) ? editMode.favCar : null), favTrack: (editMode.favTrack != null) ? editMode.favTrack : null});
            } else {
                setEditMode({...editMode, powiadomienie: "Error! Favourites not updated!"});
            }
        }).catch((er) => {
            setEditMode({...editMode, powiadomienie: "Error! Favourites not updated!"});
        });
    };

    const zmienHaslo = () => {
        if(!editMode.aktHaslo || !editMode.noweHaslo || !editMode.noweHaslo2) {
            setEditMode({...editMode, powiadomienie: "Wypełnij formularz poprawnie!"});
            return;
        }
        if(editMode.noweHaslo.length < 6 || editMode.noweHaslo.length > 40){
            setEditMode({...editMode, powiadomienie: "New password is too short/long!"});
            return;
        }
        if(editMode.noweHaslo != editMode.noweHaslo2){
            setEditMode({...editMode, powiadomienie: "New password and repeated password are different!"});
            return;
        }
        Axios.post(gb.backendIP+"changePassword/"+localStorage.getItem('token'), {
            aktHaslo: editMode.aktHaslo,
            noweHaslo: editMode.noweHaslo
        }).then((r) => {
            if(r.data['blad']){
                setEditMode({...editMode, powiadomienie: `Error! ${r.data['blad']}`, noweHaslo: "", noweHaslo2: "", aktHaslo: ""});
            } else {
                setEditMode({...editMode, powiadomienie: "Password succesfully changed!", noweHaslo: "", noweHaslo2: "", aktHaslo: ""});
            }
        }).catch((er) => {
            setEditMode({...editMode, powiadomienie: "Oops! Something went wrong, password unchanged!", noweHaslo: "", noweHaslo2: "", aktHaslo: ""});
        });
    };

    const usunKonto = () => {
        Axios.post(gb.backendIP+"usunKontoSmutek/"+localStorage.getItem("token"), {
            login: localStorage.getItem("login")
        }).then((r) => {
            if(!r.data['blad']){
                localStorage.clear();
                window.location.reload();
            } else {
                setEditMode({...editMode, powiadomienie: "Error occured while deleting your account!"});
            }
        }).catch((er) => {
            setEditMode({...editMode, powiadomienie: "Error occured while deleting your account!"});
        });
    };

    const zmienOpis = () => {
        Axios.post(gb.backendIP+"changeDescription/"+localStorage.getItem("token"), {
            description: editMode.description
        }).then((r) => {
            if(!r.data['blad']){
                setEditMode({...editMode, powiadomienie: "Description succesfully changed!"});
                setProfileData({...profileData, description: editMode.description});
            } else {
                setEditMode({...editMode, powiadomienie: `Error! ${r.data['blad']}`});
            }
        }).catch((er) => {
            setEditMode({...editMode, powiadomienie: "Oops! Network error, try again later!"});
        });
    }

    const wyswietlEdytor = () => {
        return(
            <div className="edytorProfilu">
                <div className="edycjaAwatar">
                    <div className="edycjaAwatarBlob"  style={obejscieTlo(editMode.awatarBlob ? editMode.awatarBlob : localStorage.getItem('avatar'))}/>
                    <div className="opcjeEdycjiAwatara">
                        <h3>Avatar</h3>
                        { (profileData.avatar != "/images/awatary/defaultAvatar.png") ?
                            (editMode.usunAwatar ?
                                (
                                    <div style={{gap: '10px', display: 'flex'}}>
                                        <button className="btnBad" onClick={(e) => setEditMode({...editMode, powiadomienie: "", usunAwatar: false}) }>Cancel</button>
                                        <button className="btnGood" onClick={(e) => usunAwatar()}>Submit</button>
                                    </div>
                                ) :
                                <button onClick={(e) => setEditMode({...editMode, powiadomienie: "", usunAwatar: true}) }>Delete avatar</button>
                            )
                        : ""}
                        <div style={{gap: '10px', display: 'flex'}}>
                            <label htmlFor="blobAwatar" style={{cursor: "pointer"}} className={editMode.plikNazwa ? "uploadZdjeciaTak" : "uploadZdjeciaNie"} >{editMode.plikNazwa ? "File choosen..." : "New avatar"}</label>
                            {editMode.plikNazwa ?
                            <div style={{gap: '10px', display: 'flex'}}>
                                <button className="btnBad" onClick={() => setEditMode({...editMode, powiadomienie: "", plikNazwa: null, awatarPlik: null, awatarBlob: null})}>Cancel</button>
                                <button className="btnGood" onClick={() => wgrajAwatar()}>Submit</button>
                            </div>
                            : ""}
                            <input type="file" id="blobAwatar"
                                onChange={(e) => { 
                                    setEditMode({...editMode, powiadomienie: "", plikNazwa: e.target.value, awatarPlik: e.target.files[0], awatarBlob: URL.createObjectURL(e.target.files[0])});
                                }}
                                accept="image/png, image/jpeg"
                                hidden={true}
                            />
                        </div>
                    </div>
                </div>
                <div className="edycjaBio">
                    <h3>Description</h3>
                    <textarea
                        value={editMode.description ? editMode.description : ''} placeholder={`Unfortunately ${profileData.login ? profileData.login : ""} doesn't have profile description, but we are sure he's cool!`}
                        onChange={(e) => setEditMode({...editMode, powiadomienie: "", description: e.target.value})}
                    />
                    <button onClick={() => {setEditMode({...editMode, powiadomienie: ""}); zmienOpis();}}>Change description</button>
                </div>
                <div className="edycjaInne">
                    <div className="edycjaHaslo">
                            <h3>Password change</h3>
                            <input type="password" placeholder="Current password" value={editMode.aktHaslo ? editMode.aktHaslo : ""} onChange={(e) => setEditMode({...editMode, powiadomienie: "", aktHaslo: e.target.value})} />
                            <input type="password" placeholder="New password" value={editMode.noweHaslo ? editMode.noweHaslo : ""} onChange={(e) => setEditMode({...editMode, powiadomienie: "", noweHaslo: e.target.value})} />
                            <input type="password" placeholder="Repeat new password" value={editMode.noweHaslo2 ? editMode.noweHaslo2 : ""} onChange={(e) => setEditMode({...editMode, powiadomienie: "", noweHaslo2: e.target.value})}/>
                            { editMode.potwierdzHaslo ?
                                <div style={{gap: '10px', display: 'flex', justifyContent: 'space-between'}}>
                                    <button className="btnBad" style={{flexGrow: 1}} onClick={() => setEditMode({...editMode, powiadomienie: "", potwierdzHaslo: false})}>Cancel</button>
                                    <button className="btnGood" onClick={() => zmienHaslo()}>Submit</button>
                                </div>
                                :
                                <button onClick={() => setEditMode({...editMode, powiadomienie: "", potwierdzHaslo: true})}>Change</button>
                            }
                    </div>
                    <div className="edycjaHaslo">
                        <h3>Favourite Team</h3>
                        <select value={editMode.favCar ? editMode.favCar : profileData.favCar ? profileData.favCar : null} onChange={(e) => setEditMode({...editMode, favCar: e.target.value})}>
                            <option value={null}>Unknown</option>
                            {Object.entries(gb.teamIds).map((v, i) => {
								if(Number(v[0]) > 10) return;
								return (<option value={v[0]}>{v[1]}</option>);
							})}
                        </select>
                        <h3>Favourite Track</h3>
                        <select value={editMode.favTrack ? editMode.favTrack : profileData.favTrack ? profileData.favTrack : null} onChange={(e) => setEditMode({...editMode, favTrack: e.target.value})}>
                            <option value={null}>Unknown</option>
							{gb.trackIds.map((v, i) => {
								return <option value={i}>{v}</option>;
							})}
                        </select>
                        <button onClick={() => zmienUlubione()}>Change</button>
                    </div>
                    <div className="usunKonto">
                        <h3>Delete account (!)</h3>
                        { editMode.potwierdzUsun ?
                            <div style={{gap: '10px', display: 'flex'}}>
                                <button className="btnBad" onClick={() => setEditMode({...editMode, powiadomienie: "", potwierdzUsun: false})}>Cancel</button>
                                <button className="btnGood" onClick={() => usunKonto()}>Submit</button>
                            </div>
                            :
                            <button onClick={() => setEditMode({...editMode, powiadomienie: "", potwierdzUsun: true})}>Delete!</button>
                        }
                    </div>
                </div>
                {editMode.powiadomienie ? <span>{editMode.powiadomienie}</span> : ""}
            </div>
        )
    };

    const wyswietlDane = () => {
        return(
            <div className="wycentrujPion">
                <div className="profilUzytkownika">
                    <div className="profilGora">
                        <div className="profilAwatar" style={{background: `#222 url(${profileData.avatar})`}} />
                        <div className="profilDane">
                            <h1>{!profileData.blad ? profileData.login : "User deleted"}</h1>
                            <h5>Registered: {profileData.registered ? new Date(profileData.registered).toLocaleString('pl-PL', {day: '2-digit', month: 'long', year: 'numeric'}) : "???"}</h5>
                            <h5>Played sessions: {profileData.sessionsO ? profileData.sessionsO : "???"}</h5>
                            <h5>Favourite Team: {profileData.favCar ? gb.teamIds[profileData.favCar] : "Unknown"}</h5>
                            <h5>Favourite Track: {profileData.favTrack ? gb.trackIds[profileData.favTrack] : "Unknown"}</h5>
                        </div>
                    </div>
                    <h3>Description</h3>
                    <textarea
                        value={profileData.description ? profileData.description : `Unfortunately ${profileData.login ? profileData.login : ""} doesn't have profile description, but we are sure he's cool!`}
                        onChange={(e) => setProfileData({...profileData, description: e.target.value})}
                        disabled={true}
                    />
                    <div className="wykresyProfilu">
                        <div className="mainPageSession" style={{alignItems: 'flex-start', flexGrow: 'unset', marginLeft: '10px'}}>
                            <h4>User last session</h4>
                            {
                                (profileData.lastSession != null) ?
                                <>
                                    <span>{new Date(profileData.lastSession.lastUpdate).toLocaleDateString('pl-PL', {day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit"})}</span>
                                    <span>{gb.sessionType[profileData.lastSession.sessionType]} on {gb.trackIds[profileData.lastSession.trackId]}</span>
                                    <span>with {gb.teamIds[profileData.lastSession.carId]}</span>
                                    <img style={{width: 320, height: 'fit-content', marginLeft: '-20px'}} src={"/images/"+gb.carImages[profileData.lastSession.carId]} />
                                </>
                                : <span>No sessions detected. 😕</span>
                            }
                        </div>
                        {(profileData.lastSession != null) ? <img src={"/images/"+gb.trackMaps[profileData.lastSession.trackId]} /> : "" }
                    </div>
                    { profileData.ownProfile ? <button className="otworzEdytor" onClick={(e) => setProfileData({...profileData, edytor: !profileData.edytor})}>{profileData.edytor ? "Cancel edit" : "Edit profile"}</button> : "" }
                    { profileData.edytor ? wyswietlEdytor() : "" }
                </div>
            </div>
        )
    }

    return(
        <>
            <Nawigacja/>
            <div className="screen">
                { !profileData.urlCheck ? sprawdzUrl() : ( !profileData.loaded ? wczytajDane() : wyswietlDane() ) }
            </div>
            { (!profileData.prevLink || (profileData.prevLink !== window.location.href)) && resetAll() }
        </>
    )
}