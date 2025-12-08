import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { lapTimeFormat, tireImages, tireName, tireNameVisual } from "@/GlobalVars";
import { useAuth } from "@/hooks/useAuth";
import type { ICarDamageData, ICarMotion, ICarMotionExtra, ICarStatusData, ICarTelemetryData, ILapData, ILapHistoryData, ISessionData, ITyreStintHistoryData } from "@/interfaces/f1struct";
import type { ISessionOverall } from "@/interfaces/other";
import { useState } from "react";
import { useParams } from "react-router-dom";

interface IFrameData {
	carStatus?: Partial<ICarStatusData>,
	carTelemetry?: Partial<ICarTelemetryData>,
	carDamage?: Partial<ICarDamageData>,
	carMotionExtra?: Partial<ICarMotionExtra>,
	carMotion?: Partial<ICarMotion>,
	lapData?: ILapData,
	sessionData?: Partial<ISessionData>,
}

const Session = () => {
    const { userId, sessionId } = useParams();
    const { api } = useAuth();
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ frames, setFrames ] = useState<Map<number, IFrameData> | undefined>(undefined);
    // const [ laps, setLaps ] = useState<Array<ILapData & { wasInPitlane: boolean, minFrame: number, maxFrame: number }>>([]);
    const [ overall, setOverall ] = useState<ISessionOverall | undefined>(undefined);
    // const [ checked, setChecked ] = useState(false);
    // const initFrameNumber = useRef<number>(-1);

    const fetchFrames = async () => {
        setLoading(true);
        await api.get("/sessionFrames/"+userId+"/"+sessionId)
        .then((r) => {
            setFrames(r.data.frames);
            console.log(r.data.frames, r);
        }).catch((er) => {
            console.log("Fetch session frames error:", er);
        }).finally(() => setLoading(false));
    };

    const fetchSummary = async () => {
        setLoading(true);
        await api.get("/session/"+userId+"/"+sessionId)
        .then((r) => {
            setOverall(r.data);
            console.log(r.data);
        }).catch((er) => {
            console.log("Fetch session summary error:", er);
        }).finally(() => setLoading(false));
    };

    // useEffect(() => {
    //     console.log(laps);
    //     const tmpLaps = [...laps];
    //     if(frames === undefined) {
    //         if(laps.length) setLaps([]);
    //         return;
    //     }

    //     if(checked || frames === undefined) return;
    //     console.log(frames.size);
    //     Object.entries(frames).forEach(([frameStr, data]: [frameStr: string, data: IFrameData]) => {
    //         const frame = parseInt(frameStr);
    //         if(!initFrameNumber.current) initFrameNumber.current = frame;
    //         if(data.lapData){
    //             const findIndexLap = tmpLaps.findIndex(x => x.currentLapNum === data.lapData!.currentLapNum);
    //             if(findIndexLap !== -1){
    //                 tmpLaps[findIndexLap] = {...tmpLaps[findIndexLap], ...data.lapData, maxFrame: frame };
    //                 if(data.lapData.pitStatus !== 0){
    //                     tmpLaps[findIndexLap].wasInPitlane = true;
    //                 }
    //             } else {
    //                 tmpLaps.push({...data.lapData, wasInPitlane: data.lapData.pitStatus === 0 ? false : true, minFrame: frame, maxFrame: frame });
    //             }

    //             if(data.lapData.lastLapTimeInMS){
    //                 const findPreviousLap = tmpLaps.findIndex(x => x.currentLapNum === data.lapData!.currentLapNum - 1);
    //                 if(findPreviousLap !== -1){
    //                     tmpLaps[findPreviousLap].currentLapTimeInMS = data.lapData.lastLapTimeInMS;
    //                 }
    //             }
    //         }
    //     })
    //     setLaps(tmpLaps.filter(x => x.resultStatus !== 3));
    //     setChecked(true);

    // }, [checked, frames, laps]);

    const SessionLaps = ({lapHistory, tyreStints}: {lapHistory: ILapHistoryData[] | undefined, tyreStints: ITyreStintHistoryData[] | undefined}) => {
        const [ pagination, setPagination ] = useState(1);
        const elementsPerPage = 10;
        const paginationMaxPages = lapHistory?.length ? Math.ceil(lapHistory.length / elementsPerPage) : 0;
        const paginationContent = lapHistory?.length ? lapHistory.slice((pagination - 1) * elementsPerPage, pagination * elementsPerPage) : [];
        return(
            <Card className="container">
                <CardHeader>
                    <CardTitle>Session Laps</CardTitle>
                    <CardDescription>Available session laps history with full lap and sector times.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="dark:bg-accent">
                                <TableHead className="text-center">#</TableHead>
                                <TableHead className="text-center">Time</TableHead>
                                <TableHead className="text-center">Tire</TableHead>
                                <TableHead className="text-center">Sector 1</TableHead>
                                <TableHead className="text-center">Sector 2</TableHead>
                                <TableHead className="text-center">Sector 3</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {
                                paginationContent.map((lap, index) => {
                                    const lapNumber = index + (pagination - 1) * elementsPerPage + 1;
                                    const tire = tyreStints!.sort( (a, b) => a.endLap - b.endLap ).filter(x => x.endLap >= lapNumber)[0];
                                    return <TableRow key={`lap_${lapNumber}`}>
                                        <TableCell className="text-center">Lap {lapNumber}</TableCell>
                                        <TableCell className={`${!(lap.lapValidBitFlags & 0x08) && "text-red-400"} text-center`}>{lapTimeFormat(lap.lapTimeInMS, true)}</TableCell>
                                        <TableCell className="text-center"><img className="h-10 inline" src={tireImages[tireNameVisual[tire.tyreVisualCompound]]} /> {tireNameVisual[tire.tyreVisualCompound]} ({tireName[tire.tyreActualCompound]})</TableCell>
                                        <TableCell className={`${!(lap.lapValidBitFlags & 0x01) && "text-red-400"} text-center`}>{lapTimeFormat(lap.sector1TimeMSPart, false)}</TableCell>
                                        <TableCell className={`${!(lap.lapValidBitFlags & 0x02) && "text-red-400"} text-center`}>{lapTimeFormat(lap.sector2TimeMSPart, false)}</TableCell>
                                        <TableCell className={`${!(lap.lapValidBitFlags & 0x04) && "text-red-400"} text-center`}>{lapTimeFormat(lap.sector3TimeMSPart, false)}</TableCell>
                                        <TableCell className="text-right"><Button variant="outline">Inspect</Button> <Button variant="outline">Set Ref</Button></TableCell>
                                    </TableRow>
                                })
                            }
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={7}>
                                    <div className="flex justify-between gap-2 items-center select-none">
                                        <Button variant="outline" onClick={() => setPagination(x => Math.max(0, x - 1))} disabled={pagination === 1}>Previous</Button>
                                        Page {pagination} of {paginationMaxPages}
                                        <Button variant="outline" onClick={() => setPagination(x => Math.min(x + 1, paginationMaxPages))} disabled={pagination === paginationMaxPages}>Next</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
            </Card>
        )
    }

    return(
        <div className="w-dvw min-h-dvh grid place-content-center p-5 pl-20">
            <div>
                <b>Target user:</b>
                <p>{userId}</p>
            </div>
            <div>
                <b>Target session:</b>
                <p>{sessionId}</p>
            </div>
            <Button onClick={ () => fetchSummary() } disabled={loading}>{ loading ? "Loading..." : overall ? "Reload summary" : "Fetch summary"}</Button>
            <Button onClick={ () => fetchFrames() } disabled={loading}>{ loading ? "Loading..." : frames !== undefined ? "Reload frames" : "Fetch frames"}</Button>
            <h3 className="text-secondary-400">TODO: zostawić zakres ramek dla analizy okrążenia, tak to wyświetlać zawartość SessionHistory (tam są okr i tire stinty)</h3>
            {/* { checked && laps?.length ? laps.map(lap => {
                console.log(lap)
                return <div className={`${lap.currentLapInvalid && "text-red-400"} py-3`} key={"lap"+lap.currentLapNum}>
                    <p>Lap #{lap.currentLapNum}</p>
                    <p>{!lap.wasInPitlane && "Flying Lap"}</p>
                    <p>Full: { lapTimeFormat(lap.currentLapTimeInMS!, true) } S1: { lapTimeFormat(lap.sector1TimeMSPart!, false) }</p>
                    <p>Frame {lap.minFrame} - {lap.maxFrame}</p>
                </div>
            }) : <p>No laps</p> } */}
            <SessionLaps lapHistory={overall?.summary?.lapHistoryData} tyreStints={overall?.summary?.tyreStintsHistoryData} />
        </div>
    )
};
export default Session;