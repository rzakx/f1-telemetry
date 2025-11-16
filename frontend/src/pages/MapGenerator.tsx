import { backendURL } from "@/GlobalVars";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Point = { x: number; y: number; sector: number };

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function findClosest(point: Point, candidates: Point[]): Point {
  // filtrujemy tylko punkty z tego samego sektora
  const sameSector = candidates.filter(c => c.sector === point.sector);
  const list = sameSector.length > 0 ? sameSector : candidates; // fallback gdyby brakowało punktów

  let minDist = Infinity;
  let closest = list[0];
  for (const c of list) {
    const d = distance(point, c);
    if (d < minDist) {
      minDist = d;
      closest = c;
    }
  }
  return closest;
}

/**
 * Oblicza linię środka toru na podstawie lewej i prawej krawędzi.
 * Uwzględnia sektory (0,1,2).
 */
export function computeCenterLine(leftLine: Point[], rightLine: Point[]): Point[] {
  if (leftLine.length === 0 || rightLine.length === 0) return [];

  const centerLine: Point[] = [];
  for (const lp of leftLine) {
    const rp = findClosest(lp, rightLine);
    centerLine.push({
      x: (lp.x + rp.x) / 2,
      y: (lp.y + rp.y) / 2,
      sector: lp.sector,
    });
  }
  return centerLine;
}

function smoothLine(points: Point[], windowSize = 5): Point[] {
  const smoothed: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    let xSum = 0, ySum = 0, count = 0;
    for (let j = -Math.floor(windowSize / 2); j <= Math.floor(windowSize / 2); j++) {
      const idx = i + j;
      if (idx >= 0 && idx < points.length) {
        xSum += points[idx].x;
        ySum += points[idx].y;
        count++;
      }
    }
    smoothed.push({
      x: Number((xSum / count).toFixed(1)),
      y: Number((ySum / count).toFixed(1)),
      sector: points[i].sector,
    });
  }
  return smoothed;
}

const MapGenerator = () => {
    const { user } = useAuth();
    const [ motion, setMotion ] = useState<any>({});
    const [ lap, setLap ] = useState<any>({});
    const socketRef = useRef<any>(null);
    const [ socketStatus, setSocketStatus ] = useState(false);
    const canvasRef = useRef(null);
    const [ coordsHistory, setCoordsHistory ] = useState< Array< Array< Point > > >([[]]);
    const [ boundX, setBoundX ] = useState({min: 0, max: 1});
    const [ boundY, setBoundY ] = useState({min: 0, max: 1});
    const [ leftLap, setLeftLap ] = useState<number | null>(null);
    const [ rightLap, setRightLap ] = useState<number | null>(null);
    const [ centerLap, setCenterLap ]  = useState<Point[]>([]);
    const [ pitLane, setPitLane] = useState<{x: number, y: number, pitStatus: number}[]>([]);
    const [ smoothForce, setSmoothForce ] = useState<number>(10);

    useEffect(() => {
        if(!user) return;
        if(!socketRef.current) socketRef.current = io(backendURL);
        
        const socketConn = async () => { socketRef.current.emit("joinRoom", user.login); };
        const handleLap = async (e: any) => { setLap(e) }
        const handleMotion = async (e: any) => { setMotion(e) }

        socketRef.current.on("connect", socketConn);
        socketRef.current.on("myLapData", handleLap);
        socketRef.current.on("carMotion2", handleMotion);
        return () => {
            socketRef.current.off("connect", socketConn);
            socketRef.current.off("myLapData", handleLap);
            socketRef.current.off("carMotion2", handleMotion);
        }
    }, [user]);

    useEffect(() => {
        if(!motion) return;
        if(!lap) return;
        if(motion.worldPositionX !== undefined) {
            if(boundX.min === undefined || boundX.min > motion.worldPositionX) setBoundX(x => ({...x, min: Number(motion.worldPositionX.toFixed(0)) }));
            if(boundX.max === undefined || boundX.max < motion.worldPositionX) setBoundX(x => ({...x, max: Number(motion.worldPositionX.toFixed(0)) }));
        }
        if(motion.worldPositionZ !== undefined) {
            if(boundY.min === undefined || boundY.min > motion.worldPositionZ) setBoundY(x => ({...x, min: Number(motion.worldPositionZ.toFixed(0)) }));
            if(boundY.max === undefined || boundY.max < motion.worldPositionZ) setBoundY(x => ({...x, max: Number(motion.worldPositionZ.toFixed(0)) }));
        }
        if(motion.worldPositionZ !== undefined && motion.worldPositionX !== undefined) {
            let tmpArr = [...coordsHistory];
            if(!tmpArr[lap.currentLapNum]) tmpArr[lap.currentLapNum] = [];
            tmpArr[lap.currentLapNum].push({x: Number(motion.worldPositionX.toFixed(0)), y: Number(motion.worldPositionZ.toFixed(0)), sector: lap.sector});
            if(lap.pitStatus !== 0){
                setPitLane(pl => [...pl, {
                    x: Number(motion.worldPositionX.toFixed(1)),
                    y: Number(motion.worldPositionZ.toFixed(1)),
                    pitStatus: lap.pitStatus
                }]);
            }
            setCoordsHistory(tmpArr);
        }
    }, [motion, lap]);

    const setCanvasRef = (ref: any) => {
        if(canvasRef.current || !ref) return;
        canvasRef.current = ref;
    };

    const wygenerujSrodek = () => {
        if(leftLap === null || rightLap === null) return;
        //usuwanie duplikatow
        let lewa = coordsHistory[leftLap].filter((p, i) => {
            if(coordsHistory[leftLap].find((d, id) => d.x === p.x && d.y === p.y && d.sector === p.sector && id !== i) === undefined) return true;
            else return false;
        })
        let prawa = coordsHistory[rightLap].filter((p, i) => {
            if(coordsHistory[leftLap].find((d, id) => d.x === p.x && d.y === p.y && d.sector === p.sector && id !== i) === undefined) return true;
            else return false;
        })
        
        let minX = lewa[0].x;
        let minY = lewa[0].y;
        let maxX = lewa[0].x;
        let maxY = lewa[0].y;
        // wyznaczanie boundsow
        lewa.forEach(p => {
            if(p.x < minX) minX = p.x;
            if(p.x > maxX) maxX = p.x;
            if(p.y < minY) minY = p.y;
            if(p.y > maxY) maxY = p.y;
        })
        prawa.forEach(p => {
            if(p.x < minX) minX = p.x;
            if(p.x > maxX) maxX = p.x;
            if(p.y < minY) minY = p.y;
            if(p.y > maxY) maxY = p.y;
        });

        console.log("prawa:", prawa);
        console.log("pitlane:", pitLane);

        const C = smoothLine(computeCenterLine(lewa, prawa), smoothForce || 5);
        console.log(C);
        console.log("boundsy:", [minX - 12, minY - 12, maxX + Math.abs(minX) + 24, maxY + Math.abs(minY) + 24]);
        setCenterLap(C);
        setBoundX({min: minX - 12, max: maxX + Math.abs(minX) + 24})
        setBoundY({min: minY - 12, max: maxY + Math.abs(minY) + 24})

    }

    const xxx = [];

    return(
        <div className="w-full h-full p-12 pl-28">
            <div>Bounds: [{boundX.min} {boundY.min} {boundX.max} {boundY.max}]</div>
            <div className="w-[600px] h-[600px] bg-white">
                <svg
                    xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet" height="100%"
                    viewBox={`${boundX.min} ${boundY.min} ${boundX.max} ${boundY.max}`}
                    // viewBox="-424 -624 861 1238"
                >
                    {/* { xxx.length ? <polyline vectorEffect="non-scaling-stroke" fill="none" style={{stroke: "#a0a0a0", strokeWidth: 4}} points={xxx.map(x => `${x.x},${x.y}`).join(" ")} /> : "" } */}
                    
                    { rightLap ? <polygon vectorEffect="non-scaling-stroke" fill="none" style={{stroke: "#00FF00", strokeWidth: 1}} points={coordsHistory[rightLap].map(x => `${x.x},${x.y}`).join(" ")} /> : "" }
                    { leftLap ? <polygon vectorEffect="non-scaling-stroke" fill="none" style={{stroke: "#0000FF", strokeWidth: 1}} points={coordsHistory[leftLap].map(x => `${x.x},${x.y}`).join(" ")} /> : "" }
                    { 
                     centerLap.length ?
                     <>
                         <polygon vectorEffect="non-scaling-stroke" fill="none" style={{stroke: "#374151", strokeWidth: 10}} points={centerLap.map(x => `${x.x},${x.y}`).join(" ")} />
                         <polyline vectorEffect="non-scaling-stroke" fill="none" style={{stroke: "#EF4444", strokeWidth: 7}} points={centerLap.filter(x => x.sector === 0).map(x => `${x.x},${x.y}`).join(" ")} />
                         <polyline vectorEffect="non-scaling-stroke" fill="none" style={{stroke: "#3B82F6", strokeWidth: 7}} points={centerLap.filter(x => x.sector === 1).map(x => `${x.x},${x.y}`).join(" ")} />
                         <polyline vectorEffect="non-scaling-stroke" fill="none" style={{stroke: "#FBBF24", strokeWidth: 7}} points={centerLap.filter(x => x.sector === 2).map(x => `${x.x},${x.y}`).join(" ")} />
                     </>
                     : ""
                      }
                
                </svg>

            </div>
            <div>
                { coordsHistory.map((x, i) => {
                    return(
                        <div
                            key={"lap"+i}
                            className={leftLap === i ? "text-green-500" : rightLap === i ? "text-blue-500" : ""}
                            onClick={(e) => {
                                console.log(coordsHistory[i]);
                                setLeftLap(leftLap === i ? null : i);
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                console.log(coordsHistory[i]);
                                setRightLap(rightLap === i ? null : i);
                            }}
                        >LAP {i+1}</div>
                    )
                })}
            </div>
            <button onClick={() => wygenerujSrodek()}>Generuj środkową</button>
            <br />
            <input type="number" value={smoothForce} onChange={(e) => setSmoothForce(Number(e.target.value))} />
        </div>
    )
};
export default MapGenerator;