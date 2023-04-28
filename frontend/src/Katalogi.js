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

export default function Katalogi() {
    const state = localStorage.getItem("token") ? localStorage.getItem("token") : false;
    return (
        <Router>
            <Routes>
                <Route path="/" element={state ? <GlownyHUD /> : <Navigate to="/login" />} exact/>
                <Route path="/sessions" element={state ? <Sessions /> : <Navigate to="/login" />} />
                <Route path="/session/:sessionId" element={state ? <ShowSession /> : <Navigate to="/login" />} />
                <Route path="/login" element={state ? <Navigate to="/" /> : <Logowanie />} />
                <Route path="/signup" element={state ? <Navigate to="/" /> : <Rejestracja />} />
                <Route path="/resetpass" element={state ? <Navigate to="/"/> : <ResetHasla/>} />
                <Route path="*" element={<Pusta />} />
            </Routes>
        </Router>
    );
};