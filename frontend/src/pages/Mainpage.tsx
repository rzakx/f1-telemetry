import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { getTeamById, trackNameById, type sessionData } from "@/GlobalVars";
import { useState, useEffect } from "react";

const Mainpage = () => {
    const [ lastSession, setLastSession ] = useState<{data: sessionData | undefined, checked: boolean}>({data: undefined, checked: false});
    const { user, api } = useAuth();

    const checkLastSession = async () => {
        await api.get("/lastSession")
        .then((r) => {
            console.log(r.data);
            setLastSession({data: r.data, checked: true});
        }).catch((er) => {
            console.log(er);
            setLastSession({data: undefined, checked: true});
        });
    };

    useEffect(() => {
        if(!user) return;
        if(!lastSession.checked) checkLastSession();
    }, [lastSession.checked, user]);

    return(
        <div className="w-dvw h-dvh flex p-10 pl-26 items-center justify-center">
            <Card>
                <CardContent className="max-w-7xl w-full grid grid-rows-2">
                    <div className="flex gap-3">
                        <img src={user?.avatar} className="w-52 h-52 rounded-[12px]" />
                        <div className="space-y-3">
                            <p>Hello, {user?.login}</p>
                            <p>Fav Track: { user?.favTrack ? trackNameById[user?.favTrack] : "Unknown"}</p>
                            <p>Fav Team: { user?.favCar ? getTeamById[user?.favCar].name : "Unknown" }</p>
                            <p>Last session: { lastSession.data ? new Date(lastSession.data.lastUpdate).toLocaleString("pl-PL") : "No sessions available."}</p>
                        </div>
                    </div>
                    {/* <div>B</div> */}
                </CardContent>
            </Card>
        </div>
    )
};

export default Mainpage;