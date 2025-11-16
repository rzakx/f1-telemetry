import { memo } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./ui/chart";
import { XAxis, YAxis, LineChart, CartesianGrid, Line } from "recharts";

interface ChartProps {
    data: { lapDistance: number; lateral: number; longitudinal: number; }[]
    sector2: number | undefined,
    sector3: number | undefined,
    trackLength: number | undefined
};

const ChartGForce = memo( function({ data, sector2, sector3, trackLength }: ChartProps ) {	
    return (
        <ChartContainer
            className="h-full mt-2 w-full"
            config={{
                lateral: { label: "Lateral", color: "#FF0000" },
                longitudinal: { label: "Longitudinal", color: "#FFFF00" }
            } satisfies ChartConfig}
        >
            <LineChart data={data} syncId="realtime">
                <CartesianGrid strokeDasharray="6 6" />
                <ChartTooltip content={<ChartTooltipContent />} labelFormatter={() => "G-Force"} />
                <XAxis dataKey="lapDistance" domain={[0, trackLength || "auto"]} ticks={(!!sector2 && !!sector3) ? [0, sector2 || 0, sector3 || 0, trackLength || 0] : undefined} tickFormatter={(v) => v.toFixed(0)} type="number" scale="linear" />
                <YAxis scale="linear" unit="G" type="number" />
                <Line isAnimationActive={false} dot={false} stroke="var(--color-chart-1)" strokeWidth={2} type="monotone" dataKey={"lateral"} name="Lateral" />
                <Line isAnimationActive={false} dot={false} stroke="var(--color-chart-2)" strokeWidth={2} type="monotone" dataKey={"longitudinal"} name="Longitudinal" />
            </LineChart>
        </ChartContainer>);
});

export default ChartGForce;