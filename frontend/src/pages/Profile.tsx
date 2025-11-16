import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { backendURL, getTeamById, sessionNameById, trackNameById } from "@/GlobalVars";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { FaPencil, FaUsers, FaUserGroup } from "react-icons/fa6";
// import { LuMapPin } from "react-icons/lu";
import { RiMapPin2Fill } from "react-icons/ri";
import type { IUserInfo } from "@/interfaces/other";

const Profile = () => {
    const { username } = useParams();
    const { isAuth, user, api } = useAuth();
    const [ targetProfile, setTargetProfile ] = useState<string>("");
    const [ isOwnProfile, setIsOwnProfile ] = useState<boolean>(false);
    // const [ userInfo, setUserInfo ] = useState<IUserInfo | undefined>(undefined);

    const sampleData: IUserInfo = useMemo(() => {
        return {
            username: "sotiio",
            joined: Date.now(),
            // avatar: "https://i.pinimg.com/1200x/3b/d1/45/3bd1459403838bf4b469e4f1822a09b8.jpg",
            avatar: "https://i.pinimg.com/1200x/9e/b4/ec/9eb4ec004250ff3eecabab801f712dd5.jpg",
            favCar: 3,
            favTrack: 12,
            sessionsCount: 15,
            banner: "https://i.pinimg.com/736x/2b/90/8e/2b908ec9a631f49faead496b5c430a3f.jpg",
            // banner: "https://i.pinimg.com/1200x/e4/e3/6c/e4e36c20b73036f002e2ed4c5b755b62.jpg",
            lastSessions: [
                { id: 1, session_id: "13950350737761035143", sessionType: 18, trackId: 16, carId: 1, lastUpdate: "2025-07-26 21:44:18" },
                { id: 3, session_id: "3295745206928777656", sessionType: 10, trackId: 3, carId: 2, lastUpdate: "2024-02-08 13:35:19" },
                { id: 2, session_id: "15045588325593535537", sessionType: 1, trackId: 0, carId: 4, lastUpdate: "2024-02-08 13:26:19" },
                // { id: 4, session_id: "114045989741456593", sessionType: 8, trackId: 26, carId: 8, lastUpdate: "2025-07-26 17:55:52" },
                // { id: 14, session_id: "6945973258424165387", sessionType: 10, trackId: 26, carId: 8, lastUpdate: "2025-07-26 18:05:31" },
                // { id: 24, session_id: "13614129455819516508", sessionType: 8, trackId: 11, carId: 8, lastUpdate: "2025-07-26 18:37:32" },
                // { id: 34, session_id: "7130652750442951773", sessionType: 10, trackId: 11, carId: 8, lastUpdate: "2025-07-26 18:44:47" },
                // { id: 45, session_id: "395946150101457433", sessionType: 10, trackId: 13, carId: 8, lastUpdate: "2025-07-26 19:16:12" },
                // { id: 54, session_id: "9471100739375559781", sessionType: 10, trackId: 32, carId: 8, lastUpdate: "2025-07-26 19:44:52" },
                // { id: 64, session_id: "2426938530349640028", sessionType: 11, trackId: 32, carId: 8, lastUpdate: "2025-07-26 19:55:35" },
                // { id: 74, session_id: "13426565436754504332", sessionType: 10, trackId: 16, carId: 8, lastUpdate: "2025-07-26 20:25:12" },
                // { id: 85, session_id: "8368491506943193386", sessionType: 11, trackId: 16, carId: 8, lastUpdate: "2025-07-26 20:35:06" },
                // { id: 94, session_id: "8321909201213334216", sessionType: 10, trackId: 14, carId: 8, lastUpdate: "2025-07-26 21:03:40" },
                // { id: 105, session_id: "7824823387758151255", sessionType: 1, trackId: 3, carId: 1, lastUpdate: "2025-07-26 21:44:18" },
                // { id: 114, session_id: "2207794856101248288", sessionType: 10, trackId: 3, carId: 1, lastUpdate: "2025-07-26 22:03:49" },
                // { id: 124, session_id: "5922575362886473320", sessionType: 10, trackId: 29, carId: 1, lastUpdate: "2025-07-26 22:32:26" },
            ],
            ownSetups: [
                // { id: 1, name: "Bahrain Quali Dry" },
                // { id: 2, name: "Saudi Race Wet" },
                // { id: 3, name: "Abu Dhabi myteam dry" }
            ]
        }
    }, []);

    useEffect(() => {
        if(!user) return;
        if(!username){
            setTargetProfile(user.login);
            setIsOwnProfile(true);
        } else {
            if(username === user.login){
                setTargetProfile(user.login);
                setIsOwnProfile(true);
            } else {
                setTargetProfile(username);
                setIsOwnProfile(false);
            }
        }
    }, [user, user?.login, username]);

    const getUserInfo = useCallback(async (seek: string) => {
        if(!isAuth) return;
        await api.get(backendURL+"profile/"+seek).then(({data, ...r}: {data: IUserInfo | undefined}) => {
            if(data){
                console.log(data);
            } else {
                console.log("BLAD getUserInfo", r);
                toast("Errooooor");
            }
        }).catch((er) => {
            console.log("catch", er);
            toast.error("Couldnt load user profile data", {
                description: "Catch error lol",
                dismissible: true,
                duration: 20_000,
                action: {
                    label: "Try again",
                    onClick: () => getUserInfo(seek)
                },
                actionButtonStyle: {
                    padding: '1rem'
                }
            });
        });
    }, [isAuth, api]);

    useEffect(() => {
        if(!targetProfile) return;
        console.log("Change: viewing", targetProfile);
        console.log("Is Own:", isOwnProfile);
        getUserInfo(targetProfile);
    }, [targetProfile, isOwnProfile, getUserInfo]);

    return(
        <div className="w-dvw h-dvh flex p-8 pl-20 items-center justify-center flex-col gap-2">
            <Toaster richColors />
            {/* <p>Target: {targetProfile}</p>
            <p>Own profile: {isOwnProfile ? "YES" : "NOPE"}</p> */}
            <div className="flex flex-col w-4/5 max-w-[1200px]">
                {/* Banner */}
                <div className="border-1 bg-sidebar shadow-[0_0_4px_0] shadow-sidebar w-full h-64 rounded-2xl bg-center bg-cover bg-no-repeat" style={{backgroundImage: `url(${sampleData.banner})`}}></div>

                {/* Wrapper */}
                <div className="px-12 gap-18 flex-col flex">
                    {/* User info body */}
                    <div className="flex gap-8 border-1 border-l-0 border-t-0 bg-gradient-to-br from-card to-background py-4 h-38 items-center rounded-br-2xl relative">
                        {/* Avatar */}
                        <div className="bg-card border-4 border-foreground shadow-[0_0_4px_0] shadow-accent w-56 h-56 -mt-4 rounded-2xl bg-center bg-no-repeat bg-cover" style={{backgroundImage: `url(${sampleData.avatar})`}} />
                        {/* Login, favTeam, favTrack etc. */}
                        <div className="flex flex-col gap-2">
                            <span className="text-4xl font-black tracking-widest text-chart-2">{ sampleData.username }</span>
                            <div className="flex gap-8">
                                <div>
                                    <Label className="tracking-wide">Member since</Label>
                                    <p className="text-chart-4">{ new Date(sampleData.joined).toLocaleString("en-GB", {day: "numeric", month: "long", year: "numeric"}) }</p>
                                </div>
                                <div>
                                    <Label>Favourite Team</Label>
                                    <p className="text-chart-4">{ sampleData.favCar ? getTeamById[sampleData.favCar]?.name ?? "Unknown" : "Unknown" }</p>
                                </div>
                                <div>
                                    <Label>Favourite Track</Label>
                                    <p className="text-chart-4">{ sampleData.favTrack ? trackNameById[sampleData.favTrack] ?? "Unknown" : "Unknown" }</p>
                                </div>
                            </div>
                        </div>
                        { isOwnProfile && <div className="absolute top-2 right-3 flex flex-col items-end gap-1">
                            <Button variant="ghost" size="sm" className="block cursor-pointer">Share telemetry<FaUserGroup className="ml-2 -mt-0.5 inline text-lg" /></Button>
                            <Button variant="ghost" size="sm" className="block cursor-pointer">Edit profile <FaPencil className="ml-1 inline " /></Button>
                        </div> }
                    </div>
                    {/* Body for custom setups and last sessions */}
                    <div className="flex justify-between gap-12">
                        <div className="space-y-3 grow">
                            <h3 className="text-center text-xl uppercase font-bold tracking-wider">Custom setups</h3>
                            { sampleData.ownSetups?.length ? sampleData.ownSetups.map((setup) => {
                                return <div className="rounded-md bg-sidebar w-full px-3 py-2">{setup.name}</div>
                            }) : <p className="bg-sidebar rounded-md w-full px-4 py-3 text-sm">No car setups available.</p>}
                        </div>
                        <div className="space-y-3 grow">
                            <h3 className="text-center text-xl uppercase font-bold tracking-wider">Last sessions</h3>
                            { sampleData.lastSessions?.length ? sampleData.lastSessions.map((session, index) => {
                                if(index > 4) return;
                                return <div className="rounded-md bg-sidebar w-full px-3 py-2 flex gap-8 justify-between items-center">
                                    <div>
                                        <span className="text-lg tracking-wider">{sessionNameById[session.sessionType]}</span>
                                        <div className="space-x-4">
                                            <p className="text-sm inline tracking-wider text-secondary-300"><RiMapPin2Fill className="inline -mt-1" /> { trackNameById[session.trackId] }</p>
                                            <p className="text-sm inline tracking-wider text-secondary-400"><FaUsers className="inline text-lg mr-1 -mt-0.5" /> { getTeamById[session.carId].name }</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs">Last update</p>
                                        <p className="text-sm text-primary">{new Date(session.lastUpdate).toLocaleString("en-GB", {hour: "2-digit", minute: "2-digit", day: "numeric", month: "long"}) }</p>
                                    </div>
                                </div>
                            }) : <p className="bg-sidebar rounded-md w-full px-4 py-3 text-sm">No sessions available.</p>}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default Profile;