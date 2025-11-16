import { memo } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./ui/chart";
import { XAxis, YAxis, LineChart, CartesianGrid, Line } from "recharts";

interface ChartProps {
    data: {lapDistance: number, speed: number, gear: number}[],
    sector2: number | undefined,
    sector3: number | undefined,
    trackLength: number | undefined
};

const ChartSpeedGear = memo( function({ data, sector2, sector3, trackLength }: ChartProps ) {	
	return (
		<ChartContainer
			className="h-full mt-2 w-full"
			config={{
				speed: { label: "Speed", color: "#FF0000" },
				gear: { label: "Gear", color: "#FFFF00" }
			} satisfies ChartConfig}
		>
			<LineChart data={data} title="Wheel Slip Chart" syncId="realtime" margin={{right: -25, top: 6, left: 3, bottom: 5}}>
				<CartesianGrid strokeDasharray="6 6" />
				<ChartTooltip content={<ChartTooltipContent />} labelFormatter={() => "Speed & Gear"}/>
				<XAxis dataKey="lapDistance" domain={[0, trackLength || "auto"]} ticks={(!!sector2 && !!sector3) ? [0, sector2 || 0, sector3 || 0, trackLength || 0] : undefined} tickFormatter={(v) => v.toFixed(0)} type="number" scale="linear" />
				<YAxis scale={"linear"} label={{value: "Speed", position: "insideBottomLeft", offset: 20, angle: -90}} yAxisId="leftSpeed" type="number" domain={[0, 360]} interval={"preserveEnd"} />
				<YAxis scale="linear" interval={0} label={{value: "Gear", angle: 90 }} yAxisId="rightGear" orientation="right" type="number" domain={[0, 8]} />
				<Line yAxisId="leftSpeed" unit="km/h" isAnimationActive={false} dot={false} stroke="var(--color-chart-1)" strokeWidth={2} type="monotone" dataKey={"speed"} name="Speed" />
				<Line yAxisId="rightGear" isAnimationActive={false} dot={false} stroke="var(--color-chart-2)" strokeWidth={2} type="stepAfter" dataKey={"gear"} name="Gear" />
			</LineChart>
		</ChartContainer>);
});

export default ChartSpeedGear;