const lttb = (points: any[], threshold: number, keys: string[], xKey: string) => {
	if (threshold === 0) return points;
	const dataLength = points.length;
	if (threshold >= dataLength) return points;

	const downsampled: any[] = [];
	const bucketSize = (dataLength - 2) / (threshold - 2);

	let a = 0; // single index tracker

	downsampled.push(points[a]); // always keep first

	for (let i = 0; i < threshold - 2; i++) {
		// --- Average of next bucket
		let avgX = 0;
		const avgY: Record<string, number> = {};
		keys.forEach(v => avgY[v] = 0);

		let avgStart = Math.floor((i + 1) * bucketSize) + 1;
		let avgEnd = Math.floor((i + 2) * bucketSize) + 1;
		avgEnd = avgEnd < dataLength ? avgEnd : dataLength;

		const avgLength = avgEnd - avgStart;
		for (let j = avgStart; j < avgEnd; j++) {
			avgX += points[j][xKey];
			keys.forEach(v => avgY[v] += points[j][v]);
		}
		avgX /= avgLength;
		keys.forEach(v => avgY[v] /= avgLength);

		// --- Range for this bucket
		let rangeStart = Math.floor(i * bucketSize) + 1;
		const rangeEnd = Math.floor((i + 1) * bucketSize) + 1;

		// --- Choose point with largest "triangle area"
		let maxArea = -1;
		let nextA = rangeStart;

		for (let j = rangeStart; j < rangeEnd; j++) {
			const area = Math.abs(
				(points[a][xKey] - avgX) * (points[j][keys[0]] - points[a][keys[0]]) -
				(points[a][xKey] - points[j][xKey]) * (avgY[keys[0]] - points[a][keys[0]])
			);
			if (area > maxArea) {
				maxArea = area;
				nextA = j;
			}
		}

		downsampled.push(points[nextA]);
		a = nextA;
	}

	downsampled.push(points[dataLength - 1]); // always keep last
	return downsampled;
};

export default lttb;