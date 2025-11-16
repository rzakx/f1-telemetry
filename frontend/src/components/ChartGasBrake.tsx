import { memo } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./ui/chart";
import { CartesianGrid, XAxis, YAxis, Area, AreaChart } from "recharts";

interface ChartProps {
	data: { throttle: number, brake: number, lapDistance: number }[],
	sector2: number | undefined,
	sector3: number | undefined,
	trackLength: number | undefined
}

const ChartGasBrakeComponent = memo( function ({ data, sector2, sector3, trackLength }: ChartProps ) {
	return (
		<ChartContainer
			className="h-full mt-2 w-full"
			config={{
				throttle: { label: "Throttle", color: "#FF0000" },
				brake: { label: "Brake", color: "#FFFF00" }
			} satisfies ChartConfig }
		>
			<AreaChart data={data} syncId="realtime" margin={{bottom: 25, top: 10}}>
				<CartesianGrid strokeDasharray="3 6" />
				<ChartTooltip content={<ChartTooltipContent labelFormatter={() => "Throttle & Brake"}  />} />
				<XAxis dataKey="lapDistance" domain={[0, trackLength || "auto"]} ticks={(!!sector2 && !!sector3) ? [0, sector2 || 0, sector3 || 0, trackLength || 0] : undefined} tickFormatter={(v) => v.toFixed(0)} type="number" scale="linear" />
				<YAxis type={"number"} domain={[0, 100]} interval={0} tickCount={1} scale={"linear"} unit={"%"} />

				<Area isAnimationActive={false} dot={false} stroke="var(--color-green-600)" strokeWidth={2} fill="var(--color-green-500)" fillOpacity={0.4} type="monotone" dataKey={"throttle"} name="Throttle" unit="%" />
				<Area isAnimationActive={false} dot={false} stroke="var(--color-red-600)" strokeWidth={2} fill="var(--color-red-500)" fillOpacity={0.4} type="monotone" dataKey={"brake"} name="Brake" unit="%" />
			</AreaChart>
		</ChartContainer>);
});

export default ChartGasBrakeComponent;