import { useState } from "react";
import { useParams } from "react-router-dom";
import Nawigacja from "../Nawigacja";

export default function Profile(props){
    const {userParam} = useParams();
    if(userParam){
        document.title = `TrackVision - ${userParam} profile`;
        if(userParam === localStorage.getItem('login')) { window.location.href = "/profile/"; }
    } else {
        document.title = 'TrackVision - Your profile';
    }
    const [profileData, setProfileData] = useState({checked: false});

    return(<>
        <Nawigacja />
    </>);
}