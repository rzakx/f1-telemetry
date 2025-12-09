import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeamById, sessionNameById, trackNameById } from "@/GlobalVars";
import { useAuth } from "@/hooks/useAuth";
import type { ISessionOverall } from "@/interfaces/other";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { FaChartArea, FaTrash } from "react-icons/fa6";
import { LucideRefreshCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IFilterOptions {
    dateFrom?: Date | string,
    dateTo?: Date | string,
    track?: number,
    team?: number,
    sessionType?: number,
    sessionId?: number,
}

const Sessions = () => {
    const { user, api } = useAuth();
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ checked, setChecked ] = useState<boolean>(false);
    const [ filter, setFilter ] = useState<IFilterOptions>({ dateFrom: undefined, dateTo: undefined, track: undefined, team: undefined, sessionType: undefined, sessionId: undefined });
    const [ itemsPerPage, setItemsPerPage ] = useState<number>(5);
    const [ history, setHistory ] = useState<ISessionOverall[]>([]);
    const [ paginationPage, setPaginationPage ] = useState<number>(1);

    const availablePages = useMemo(() => {
        return Math.ceil(history.length / itemsPerPage);
    }, [itemsPerPage, history.length]);

    // if count of pages changed (cuz of history length or itemsPerPage), check if paginationPage is still in range
    useEffect(() => {
        if(!availablePages) return;
        console.log(paginationPage, availablePages);
        if(paginationPage > availablePages) setPaginationPage(availablePages);
    }, [availablePages, paginationPage])

    const paginatedData = useMemo(() => {
        if(!history.length) return [];
        return history.slice((paginationPage - 1) * itemsPerPage, paginationPage * itemsPerPage)
    }, [itemsPerPage, history, paginationPage]);

    const loadHistory = useCallback(async (target: string) => {
        setLoading(true);
        await api.get("/sessions/"+target).then((r) => {
            // const { sessions }: ISessionOverall[] = r.data;
            console.log(r.data.sessions);
            setHistory(r.data.sessions);
        }).catch((er) => {
            console.log(er);
        }).finally(() => {
            setLoading(false);
            setChecked(true);
        });
    }, [api])

    useEffect(() => {
        console.log("YSYS", user);
    }, [user])

    useEffect(() => {
        if(!user) return;
        if(checked) return;
        loadHistory(user.id);
    }, [user, loadHistory, checked]);

    return(
        <div className="w-dvw h-dvh p-5 pl-20 flex items-center justify-center">
            <div className="container flex gap-5 flex-wrap-reverse">
                <Card className="grow">
                    <CardHeader>
                        <CardTitle>Saved sessions</CardTitle>
                        <CardDescription>List of overall statistics of your saved driver sessions.</CardDescription>
                        <CardAction>
                            <Button
                                className="not-disabled:cursor-pointer"
                                variant="outline"
                                onClick={() => setChecked(false)}
                                disabled={loading}
                            >Refresh <LucideRefreshCcw /></Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="grow items-end flex">
                        { loading ?
                            <Skeleton className="grid place-content-center">Loading data...</Skeleton>
                            : <Table className="w-full">
                                <TableHeader className="bg-accent/60">
                                    <TableRow>
                                        <TableHead className="text-center w-48">Session ID</TableHead>
                                        <TableHead className="text-center">Session Type</TableHead>
                                        <TableHead className="text-center">Track</TableHead>
                                        <TableHead className="text-center">Team</TableHead>
                                        <TableHead className="text-center">Updated at</TableHead>
                                        <TableHead className="text-center w-48">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {
                                        !paginatedData.length
                                        ? <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                rowSpan={3}
                                                className="text-center py-10 bg-destructive/10 font-bold tracking-wider"
                                            >
                                                { (filter.dateFrom || filter.dateTo || filter.sessionId || (filter.sessionType !== undefined) || (filter.team !== undefined) || (filter.track !== undefined))
                                                    ? <p>No results found.<br />Check your search filters.</p>
                                                    : <p>No saved sessions available.<br />Start new in-game session or check your telemetry settings.</p>
                                                }
                                            </TableCell>
                                        </TableRow>
                                        : paginatedData.map(s => 
                                            <TableRow key={`${s.user_id}_${s.session_id}`}>
                                                <TableCell>{ s.session_id }</TableCell>
                                                <TableCell className="text-center">{ s.session_type ? sessionNameById[s.session_type] ?? "Unknown" : "Unknown" }</TableCell>
                                                <TableCell className="text-center">{ s.track_id !== undefined ? trackNameById[s.track_id] ?? "Unknown" : "Unknown" }</TableCell>
                                                <TableCell className="text-center">{ s.car_id !== undefined ? getTeamById[s.car_id].name ?? "Unknown" : "Unknown" }</TableCell>
                                                <TableCell className="text-center">{ new Date(s.last_update).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" }) }, { new Date(s.last_update).toLocaleString(undefined, { day: "numeric", month: "long" }) }</TableCell>
                                                <TableCell className="space-x-3 text-right">
                                                    <Link to={`/session/${s.user_id}/${s.session_id}`}>
                                                        <Button className="not-disabled:cursor-pointer" size="sm">Inspect <FaChartArea /></Button>
                                                    </Link>
                                                    <Button className="not-disabled:cursor-pointer" size="sm" variant="secondary">Delete <FaTrash /></Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={6}>
                                            <div className="flex justify-between gap-2 items-center select-none">
                                                <Button variant="outline" onClick={() => setPaginationPage(x => x - 1)} disabled={paginationPage === 1}>Previous</Button>
                                                <p>Page {paginationPage} of {availablePages}</p>
                                                <Button variant="outline" onClick={() => setPaginationPage(x => x + 1)} disabled={paginationPage === availablePages}>Next</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        }
                    </CardContent>
                </Card>
                <Card className="w-92">
                    <CardHeader>
                        <CardTitle>Advanced search</CardTitle>
                        <CardDescription>Can't find session you want to check? Check some additional filter options below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                            <div className="space-y-1">
                                <Label>Session ID</Label>
                                <Input className="placeholder:text-muted-foreground/50" type="number" placeholder="Initial number sequence" minLength={4} />
                            </div>
                            <div className="space-y-1">
                                <Label>Date range</Label>
                            {/* date asc or desc */}
                                <Button>From</Button> - <Button>To</Button>
                            </div>
                            <div className="space-y-1">
                                <Label>Session Type</Label>
                                <Select value={filter.sessionType?.toString() ?? "-1"} onValueChange={(e) => setFilter(x => ({...x, sessionType: parseInt(e)}))} disabled={loading || !checked}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose value" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={"-1"}>All types</SelectItem>
                                        {Object.entries(sessionNameById).map((x) => <SelectItem key={"type"+x[0].toString()} value={x[0].toString()}>{x[1]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Team</Label>
                                <Select value={filter.team?.toString() ?? "-1"} onValueChange={(e) => setFilter(x => ({...x, team: parseInt(e)}))} disabled={loading || !checked}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose value" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={"-1"}>All teams</SelectItem>
                                        {Object.entries(getTeamById).map((x) => <SelectItem key={"team"+x[0].toString()} value={x[0].toString()}>{x[1].name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Track</Label>
                                <Select value={filter.track?.toString() ?? "-1"} onValueChange={(e) => setFilter(x => ({...x, track: parseInt(e)}))} disabled={loading || !checked}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Not selected" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={"-1"}>All tracks</SelectItem>
                                        {Object.entries(trackNameById).map((x) => <SelectItem key={"track"+x[0].toString()} value={x[0].toString()}>{x[1]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-between">
                                <Label>Rows per page</Label>
                                <div className="space-x-2">
                                    <Button size="sm" variant={itemsPerPage === 5 ? "default" : "outline"} onClick={() => setItemsPerPage(5)}>5</Button>
                                    <Button size="sm" variant={itemsPerPage === 10 ? "default" : "outline"} onClick={() => setItemsPerPage(10)}>10</Button>
                                    <Button size="sm" variant={itemsPerPage === 30 ? "default" : "outline"} onClick={() => setItemsPerPage(30)}>30</Button>
                                </div>
                            </div>
                            {/* user (future sessions sharing) */}
                            <Button className="w-full" variant="secondary">Reset filter</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
};
export default Sessions;