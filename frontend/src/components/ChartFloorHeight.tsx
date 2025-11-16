import { memo } from "react";
import lttb from "@/hooks/optimizeChart";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./ui/chart";
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from "recharts";

interface ChartProps {
    data: {front: number, rear: number, lapDistance: number}[],
    sector2: number | undefined,
    sector3: number | undefined,
    trackLength: number | undefined
};

const ChartFloorHeight = memo( function({data, sector2, sector3, trackLength}: ChartProps){
    
    return(
        <ChartContainer
            className="h-full mt-2 w-full"
            config={{
                front: { label: "Front", color: "#ffff00" },
                rear: { label: "Rear", color: "#ffff00" },
            } satisfies ChartConfig}
        >
            <LineChart data={lttb(data, 400, ["front", "rear"], "lapDistance")} syncId="realtime">
                <CartesianGrid strokeDasharray="6 6" />
                <ChartTooltip content={<ChartTooltipContent />} />
                {/* <ChartLegend content={<ChartLegendContent />} /> */}
                <XAxis dataKey="lapDistance" domain={[0, trackLength || "auto"]} ticks={(!!sector2 && !!sector3) ? [0, sector2 || 0, sector3 || 0, trackLength || 0] : undefined} tickFormatter={(v) => v.toFixed(0)} type="number" scale="linear" />
                <YAxis scale={"linear"}
                // domain={([dataMin, dataMax]) => {
                // 	const minimal = Math.max(dataMin, -3);
                // 	const maximum = Math.min(dataMax, 3);
                // 	return [minimal, maximum];
                // }}
                />
                <Line isAnimationActive={false} dot={false} stroke="var(--color-green-400)" type="monotone" dataKey="front" name="Front" />
                <Line isAnimationActive={false} dot={false} stroke="var(--color-blue-400)" type="monotone" dataKey="rear" name="Rear" />
            </LineChart>
        </ChartContainer>
    )
});

export default ChartFloorHeight;