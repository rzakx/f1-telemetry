import {
	Route,
	BrowserRouter as Router,
	Routes,
	Navigate,
} from "react-router-dom";
import GlownyHUD from "./Strony/GlownyHUD";
import Logowanie from "./Strony/Logowanie";
import ResetHasla from "./Strony/ResetHasla";
import Rejestracja from "./Strony/Rejestracja";
import Pusta from "./Strony/Pusta";
import Sessions from "./Strony/Sessions";
import ShowSession from "./Strony/ShowSession";
import Mainpage from "./Strony/Mainpage";
import CarSetups from "./Strony/CarSetups";
import Profile from "./Strony/Profile";
import Setup from "./Strony/Setup";

export default function Katalogi() {
    const state = localStorage.getItem("token") ? localStorage.getItem("token") : false;
    return (
        <Router>
            <Routes>
                <Route path="/" element={state ? <Mainpage /> : <Navigate to="/login" />} exact/>
                <Route path="/realtimehud" element={state ? <GlownyHUD /> : <Navigate to="/login" />} />
                <Route path="/setups" element={state ? <CarSetups /> : <Navigate to="/login" /> } />
                <Route path="/sessions" element={state ? <Sessions /> : <Navigate to="/login" />} />
                <Route path="/session/:sessionId" element={state ? <ShowSession /> : <Navigate to="/login" />} />
                <Route path="/login" element={state ? <Navigate to="/" /> : <Logowanie />} />
                <Route path="/signup" element={state ? <Navigate to="/" /> : <Rejestracja />} />
                <Route path="/resetpass" element={state ? <Navigate to="/"/> : <ResetHasla/>} />
                <Route path="/profile" element={state ? <Profile /> : <Navigate to="/login"/>}/>
                <Route path="/profile/:userParam" element={state ? <Profile /> : <Navigate to="/login"/>}/>
                <Route path="/createSetup" element={state ? <Setup /> : <Navigate to="/login"/>}/>
                <Route path="/setup/:setupId" element={state ? <Setup /> : <Navigate to="/login"/>}/>
                <Route path="*" element={<Pusta />} />
            </Routes>
        </Router>
    );
};