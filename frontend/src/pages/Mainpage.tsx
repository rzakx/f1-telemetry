import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { carImage, getTeamById, sessionNameById, trackNameById } from "@/GlobalVars";
import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { FaArrowRight, FaHeadset, FaServer, FaUser } from "react-icons/fa6";
import { RiCalendarScheduleFill } from "react-icons/ri";
import type { ISessionOverall } from "@/interfaces/other";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface IServiceDetails {
    working: boolean,
    address: string,
    port: number
}

const Mainpage = () => {
    const [ lastSession, setLastSession ] = useState<ISessionOverall | undefined>();
    const [ lastSessionChecked, setLastSessionChecked ] = useState<boolean>(false);
    const [ serviceChecked, setServiceChecked ] = useState<boolean>(false);
    const [ serviceDetails, setServiceDetails ] = useState<IServiceDetails>();
    const [ currentDate, setCurrentDate ] = useState<Date>(new Date());
    const { user, api, isAuth } = useAuth();

    useEffect(() => {
        const refreshDate = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);
        return () => clearInterval(refreshDate);
    }, [currentDate]);

    const fetchServiceDetails = useCallback(async () => {
        await api.get("").then((r) => {
            setServiceDetails(r.data);
        }).catch((er) => {
            console.log(er);
        }).finally(() => setServiceChecked(true));
    }, [ api ]);

    const fetchLastSession = useCallback(async () => {
        await api.get("/lastSession").then((r) => {
            if(!r.data){
                setLastSession(undefined);
                return;
            }
            setLastSession(r.data);
        }).catch((er) => {
            console.log(er);
            setLastSession(undefined);
        }).finally(() => setLastSessionChecked(true))
    }, [api]);

    useEffect(() => {
        if(!user) return;
        if(lastSessionChecked) return;
        fetchLastSession();
    }, [lastSessionChecked, fetchLastSession, user]);

    useEffect(() => {
        if(!serviceChecked) fetchServiceDetails();
    }, [ fetchServiceDetails, serviceChecked ]);

    useEffect(() => {
        console.log(user, isAuth);
    }, [user, isAuth])

    return(
        <div className="w-dvw h-dvh flex p-10 pl-26 items-center justify-center">
            <div className="flex flex-col gap-5 container">
                <div className="flex gap-5 w-full">
                    <Card className="grow max-w-[800px]">
                        <CardHeader>
                            <CardTitle>Account info</CardTitle>
                            <CardDescription>{ currentDate.toLocaleString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric"})} - { currentDate.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit"})}</CardDescription>
                            <CardAction><FaUser className="text-4xl" /></CardAction>
                        </CardHeader>
                        <CardContent className="flex gap-6 grow">
                            <div className="bg-card border-2 border-foreground shadow-[0_0_4px_0] h-full max-h-64 shadow-accent aspect-square rounded-lg bg-center bg-no-repeat bg-cover" style={{backgroundImage: `url(${ user?.avatar ?? "/avatars/defaultAvatar.png" })`}} />
                            <div className="flex flex-col justify-center gap-3 [&_p]:tracking-wider">
                                <div>
                                    <Label>Username</Label>
                                    <p className="text-secondary">{ user?.login }</p>
                                </div>
                                <div>
                                    <Label>Member since</Label>
                                    <p className="text-secondary">{ user?.registered ? new Date(user.registered).toLocaleString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "Unknown date"}</p>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center gap-3 [&_p]:tracking-wider">
                                <div>
                                    <Label>Favourite Track</Label>
                                    <p className="text-primary">{user?.favTrack ? trackNameById[user.favTrack] : "None"}</p>
                                </div>
                                <div>
                                    <Label>Favourite Team</Label>
                                    <p className="text-primary">{user?.favCar ? getTeamById[user.favCar].name : "None"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="grow">
                        <CardHeader>
                            <CardTitle>Last session</CardTitle>
                            <CardDescription>Information about your latest driver session.</CardDescription>
                            <CardAction><RiCalendarScheduleFill className="text-4xl" /></CardAction>
                        </CardHeader>
                        <CardContent className="flex grow">
                            { lastSessionChecked ?
                                lastSession === undefined
                                    ? <div className="text-center p-3 bg-accent rounded-lg w-full grid place-content-center font-black text-secondary text-sm tracking-widest"><p>Couldn't find any saved session.<br />Start new in-game session or check telemetry settings.</p></div>
                                    : <Link to={`/session/${lastSession.user_id}/${lastSession.session_id}`} className="flex gap-3 w-full justify-between hover:bg-accent px-4 pt-3 rounded-lg overflow-hidden cursor-pointer border">
                                        <div className="flex flex-col justify-between gap-2 mb-3">
                                            <div>
                                                <p className="text-xs font-semibold text-secondary">Session ID { lastSession.session_id }</p>
                                                <p className="text-sm font-semibold text-card-foreground">
                                                    { new Date(lastSession.last_update).toLocaleString(undefined, { weekday: "long" }) } { new Date(lastSession.last_update).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" }) }, { new Date(lastSession.last_update).toLocaleString(undefined, { day: "numeric", month: "long", year: "numeric"})}
                                                </p>
                                            </div>
                                            <div className="font-bold tracking-wide text-card-foreground">
                                                <span className="text-primary-400">{ lastSession.session_type ? sessionNameById[lastSession.session_type] ?? "Unknown Type" : "Unknown Type" } </span>
                                                in <span className="text-yellow-400">{ lastSession.track_id ? trackNameById[lastSession.track_id] ?? "Unknown Track" : "Unknown Track" } </span>
                                                <br />with <span className="text-purple-400">{ lastSession.car_id ? getTeamById[lastSession.car_id].name ?? "Unknown Team" : "Unknown Team" }</span>
                                            </div>
                                            <Badge variant={lastSession.completed ? "default" : "destructive"}>{ lastSession.completed ? "Completed" : "In-progress" }</Badge>
                                        </div>
                                        <img className="-scale-x-100 object-contain -mb-3" src={"images/"+carImage[lastSession.car_id]} />
                                    </Link>
                                :<Skeleton className="w-full grid place-content-center">Fetching data...</Skeleton>
                            }
                        </CardContent>
                    </Card>
                </div>
                <div className="flex gap-5 w-full">
                    <Card className="grow">
                        <CardHeader>
                            <CardTitle>Help section</CardTitle>
                            <CardDescription>Having problems with something? Don't know how specific features work? Check this section to find answers for most frequently asked questions.</CardDescription>
                            <CardAction><FaHeadset className="text-4xl" /></CardAction>
                        </CardHeader>
                        <CardContent className="-mt-4">
							<Accordion
								type="single"
								collapsible
								className="w-full"
							>
								<AccordionItem value="item-1">
									<AccordionTrigger>How to configure F1 25 Telemetry Settings?</AccordionTrigger>
									<AccordionContent className="flex flex-col gap-2 text-balance">
									<p>
										Open the F1 25 game, move to <Badge variant="outline">Settings</Badge> <FaArrowRight className="inline mx-1" /> <Badge variant="outline">Telemetry Settings</Badge>.
										If not present, enable Expert mode. Once you're in Telemetry Settings menu, change values like below:
									</p>
									<ul className="list-disc pl-6">
										<li>UDP Telemetry - ON</li>
										<li>UDP IP Address - { serviceDetails?.address ?? "Not available" }</li>
										<li>UDP Port - { serviceDetails?.port ?? "Not available" }</li>
										<li>UDP Send Rate - Any (Recommended: 20Hz)</li>
										<li>UDP Format - 2025</li>
									</ul>
									</AccordionContent>
								</AccordionItem>
								<AccordionItem value="item-2">
									<AccordionTrigger>Is there any additional software required?</AccordionTrigger>
									<AccordionContent className="flex flex-col gap-2 text-balance bg-card">
									<p>
										Nope, this app allows users to collect and share telemetry data without any external software.
									</p>
									<p>
										App is listening for incoming packets on UDP socket and based on sender IP address with found matching IP address in registered users, saves selected types of data in database.
										That approach provides instant access without any advanced configuration steps.
									</p>
									</AccordionContent>
								</AccordionItem>
								<AccordionItem value="item-3">
									<AccordionTrigger>Why my saved session doesnt show all laps?</AccordionTrigger>
									<AccordionContent className="flex flex-col gap-4 text-balance">
									<p>
										While not providing any additional required software gives easy access, that kind of approach has some disadvantages.
									</p>
									<p>
										The main problem is UDP connection itself. UDP packets are not guaranteed to be delivered and it's not possible to force game to resend specific packets upon a failure.
										Also, the only possible way to recognize author of received UDP data is by matching IP address of UDP sender with the latest user having the same IP. That works fine if you're one, unique user per public assigned IP in your network area. If there are multiple users with same IP - then the packet will be assigned to user who recently, logged as last one.
									</p>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
                        </CardContent>
                    </Card>
                    <Card className="min-w-[540px]">
                        <CardHeader>
                            <CardTitle>Service details</CardTitle>
                            <CardDescription>Public IP Address and port number for your UDP Telemetry settings alongside with overall app statistics info.</CardDescription>
                            <CardAction><FaServer className="text-4xl" /></CardAction>
                        </CardHeader>
                        <CardContent className="space-y-6 tracking-wider">
                            <div className="pb-1 border-b-1 border-primary px-1 flex justify-between">
                                <p className="text-primary-200 font-semibold">UDP Telemetry: IP Address</p>
                                <p className="font-bold text-primary">{ serviceChecked ? serviceDetails?.address ?? "Not available" : "Fetching"}</p>
                            </div>
                            <div className="pb-1 border-b-1 border-secondary px-1 flex justify-between">
                                <p className="text-secondary-300 font-semibold">UDP Telemetry: Port</p>
                                <p className="font-bold text-secondary">{ serviceChecked ? serviceDetails?.port ?? "Not available" : "Fetching"}</p>
                            </div>
                            <div className="pb-1 border-b-1 border-purple-500 px-1 flex justify-between">
                                <p className="text-purple-300 font-semibold">Total users sessions</p>
                                <p className="text-purple-300 font-bold">{ serviceChecked ? "34 (x)" : "Fetching" }</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
};

export default Mainpage;