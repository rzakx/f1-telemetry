import { Button } from "@/components/ui/button";
import { getTeamById, sessionNameById, trackNameById } from "@/GlobalVars";
import { useAuth } from "@/hooks/useAuth";
import type { ISessionOverall } from "@/interfaces/other";
import { useEffect, useState } from "react";

const Sessions = () => {
    const { user, api, isAuth, navigate } = useAuth();
    const [ history, setHistory ] = useState<ISessionOverall[]>([]);
    const [ loading, setLoading ] = useState<boolean>(false);

    const loadHistory = async () => {
        if(!user) return;
        setLoading(true);
        await api.get("/sessions/"+user.id).then((r) => {
            // const { sessions }: ISessionOverall[] = r.data;
            console.log(r.data.sessions);
            setHistory(r.data.sessions);
        }).catch((er) => {
            console.log(er);
        }).finally(() => setLoading(false));
    }

    useEffect(() => {
        if(!isAuth){
            console.log("Jestes niezalogowany...");
        }
    }, [isAuth]);

    return(
        <div className="w-dvw h-dvh grid p-5 pl-20 place-content-center">
            <Button onClick={() => loadHistory()} disabled={loading}>Call api sessions</Button>
            { user && history.length ? history.map(session => {
                return(<p key={session.session_id} onClick={() => navigate(`/session/${user.id}/${session.session_id}`)}>{session.session_id} {sessionNameById[session.session_type] ?? "Unknown"} {trackNameById[session.track_id]} {getTeamById[session.car_id].name} { session.completed ? "Completed" : "In progress" }</p>)
            }) : <p>No sessions available</p>}
        </div>
    )
};
export default Sessions;