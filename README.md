# TrackVision - Analyze and share your racing data
### Notice
**Application is currently under re-work progress. If you wish to use or view source code of completed, older project, check [releases](https://github.com/rzakx/f1-telemetry/releases) section!**

## Description
Implementation of a browser-based web application with main goal being to offer easy and clear access to racing telemetry share, storage and tools which can be used to improve driver skills, without the need to install any additional software on users device.

Application offers functionalities like:
- Sessions history - ability to view history of driver participation in game sessions.
- Session details - view graphs and more detailed statistics of chosen session, displaying summary of taken laps, allowing to inspect them individualy or in comparison providing plenty of data.
- Profile customization - banners, avatars, favourite tracks and teams.
- Car setups - where people can create, save and share their own bolid settings for specific track, session type or weather conditions, also being able to browse and view already created ones.
- Realtime HUD - interface displaying data received from the game in real time, including almost every aspect of driver environment in the game.

... and most importantly - ability to share saved sessions or realtime data to other users, allowing them to take the role of racing engineers or tutors.

Used technologies: TypeScript, React, Tailwind, shadcn, recharts, Bun, ExpressJS, SocketIO, Cassandra, Apache2

## App access
- **Website:** [https://formula.zakrzewski.dev](https://formula.zakrzewski.dev)
- **Demo account credentials:**
  - Login: `demo`
  - Password: `example123`

Be aware, that it's a personal project, just being publicly open. You might encounter frontend switching from production build to dev environment or backend not responding at any time. If that happens I'm probably modifying or creating some new things, so there's a chance you'll see things broken.

## Telemetry Structure
Developers of the F1 25 game shared their telemetry output structures [here](https://forums.ea.com/t5/s/tghpe58374/attachments/tghpe58374/f1-games-game-info-hub-en/61/4/Data%20Output%20from%20F1%2025%20v3.pdf).
I've defined TypeScript interfaces matching struct defined in previously mentioned docs. Parse functions are based on low-level DataView interface methods returning objects with same naming convention ( but without prefixes like m_ ). Not every values are used and in some functionalities some objects - when passed through the WebSocket or stored in database - are stripped by undefining already existing values.

## Why such backend and database choice?
Study was conducted of the impact of selected backend and database technologies on the performance and stability of an analytical application processing telemetry data. As part of the research, a series of load tests were designed and conducted in various technological configurations, including three backend environments (Node.js, Deno, Bun) and four database systems (MariaDB, PostgreSQL, MongoDB, Cassandra).

The tests were conducted under controlled, increasing load conditions, monitoring key performance and stability indicators such as system resource consumption, the number of received, processed, and unhandled UDP packets, the number of UDP packets received per second, the number of packet write operations performed to the database per second, the number of disk writes and reads, as well as latencies related to query execution, packet compression, and WSS protocol transmission. The research yielded clear results confirming that the choice of backend and database technologies significantly impacts the performance and stability of an analytical application processing telemetry data.

The Bun runtime environment, despite being a relatively new solution,
demonstrated the highest level of efficiency and stability. It distinguished itself with low memory consumption, high throughput, and complete resistance to packet loss.

Despite lower performance results, Node.js remains a robust and proven technology, although it requires manual configuration in the case of high memory load. The Deno environment, on the other hand, focuses on security and a zero-trust approach, but in the results of the conducted tests,
it did not achieve a level of performance comparable to the other environments.

Regarding database technologies, Cassandra proved to be the most effective solution among the services
tested, both in terms of data write speed and stability under heavy load. Cassandra's non-relational, distributed architecture is ideal
for handling high-volume and high-frequency data. Relational databases such as MariaDB and PostgreSQL showed lower resistance to increasing load, the longest latencies, and their performance was closely dependent on the adjustment of environment and backend parameters.

## Methodology of conducted study
Using a program written in Golang, packets were generated according to the data structure specified in the F1 UDP telemetry documentation and sent from VPS A (a.k.a., the client) to VPS B (a.k.a., the server), which hosted the application under test using the specified technology. Both VPS were on the same network.

The process followed a defined load pattern: transmission began at 120 packets per second and increased by another 120 packets every 15 seconds, until it reached 6,000 packets per second. After reaching the maximum value, the packet rate was reduced back to 120 and maintained at that level to stabilize the system.

Generated packets included all types of telemetry packets, without any data slicing.

## Results of conducted study
### Efficiency and stability of packet processing
The table shows the maximum recorded UDP packet reception per second, the maximum packet writes to the database per second, the first observed performance degradation, and the time required to achieve a stable processing state. Performance degradation is defined as a situation in which reception and writing cease to scale in parallel and proportionally to the increasing load, resulting in delays or data loss.
<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">

<head>

<meta name=ProgId content=Excel.Sheet>
<meta name=Generator content="Microsoft Excel 15">
</head>

<body link="#0563C1" vlink="#954F72">


Backend | Database | Max achieved UDP   Handle | Max achieved DB   INSERT | 1st performance   degradation noticed | Stabilization   time [sec]
-- | -- | -- | -- | -- | --
Node.js | MariaDB | 5248 | 4019 | 3120 | 615
Node.js | PostgreSQL | 5520 | 4490 | 4080 | 285
Node.js | MongoDB | 5651 | 5551 | 3600 | 60
Node.js | Cassandra | 5986 | 5987 | 3120 | 15
Deno | MariaDB | 5811 | 2443 | 2280 | 6780
Deno | PostgreSQL | 3033 | 225 | 120 | CANCELED
Deno | MongoDB | 5833 | 4193 | 3840 | 105
Deno | Cassandra | 6269 | 6269 | 3120 | 15
Bun | MariaDB | 6000 | 4141 | 3600 | 285
Bun | PostgreSQL | 6000 | 3479 | 2040 | 180
Bun | MongoDB | 6000 | 5160 | 5160 | 30
Bun | Cassandra | 6000 | 6000 | 6000 | 0



</body>

</html>

### MAE and RMSE values and average efficiency
To further assess the accuracy of data processing and the performance of individual application configurations, absolute error (MAE) and root mean square error (RMSE) values ​​were calculated for UDP packet reception and database storage, and the average processing efficiency was also considered. This comparison of values ​​allows for the assessment of actual system performance deviations from the expected baseline, thus indicating which technologies were characterized by greater precision, stability, and low performance variability.
<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">

<head>

<meta name=ProgId content=Excel.Sheet>
<meta name=Generator content="Microsoft Excel 15">
</head>

<body link="#0563C1" vlink="#954F72">


Backend | Database | UDP Handle (MAE) | DB INSERT (MAE) | UDP Handle (RMSE) | DB INSERT (RMSE) | Avg efficiency   UDP Handle | Avg efficiency DB   INSERT
-- | -- | -- | -- | -- | -- | -- | --
Node.js | MariaDB | 153.70 | 1156.70 | 450.95 | 2226.40 | 97.4% | 80.1%
Node.js | PostgreSQL | 96.84 | 768.42 | 370.51 | 1710.87 | 98.4% | 86.1%
Node.js | MongoDB | 90.30 | 365.14 | 345.90 | 1140.53 | 98.7% | 94.1%
Node.js | Cassandra | 20.54 | 20.56 | 44.39 | 43.84 | 99.8% | 99.8%
Deno | MariaDB | 130.10 | 2060.80 | 288.70 | 2984.97 | 94.9% | 54.1%
Deno | PostgreSQL | 1498.68 | 2979.74 | 2300.85 | 3487.81 | 68.7% | 11.2%
Deno | MongoDB | 71.78 | 1096.74 | 281.19 | 2153.74 | 98.7% | 79.7%
Deno | Cassandra | 64.38 | 77.80 | 200.88 | 221.00 | 99.5% | 99.1%
Bun | MariaDB | 0.00 | 957.86 | 0.00 | 1876.65 | 100.0% | 81.9%
Bun | PostgreSQL | 0.42 | 1073.46 | 1.75 | 1861.28 | 100.0% | 79.3%
Bun | MongoDB | 0.00 | 320.28 | 0.00 | 890.22 | 100.0% | 94.4%
Bun | Cassandra | 0.00 | 0.46 | 0.00 | 0.79 | 100.0% | 100.0%



</body>

</html>



### Estimated number of lost UDP packets
This data allows us to determine which combinations provide the highest resistance to overloads and minimize the risk of data loss in conditions of increased network traffic.
<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">

<head>

<meta name=ProgId content=Excel.Sheet>
<meta name=Generator content="Microsoft Excel 15">
</head>

<body link="#0563C1" vlink="#954F72">


  | MariaDB | PostgreSQL | MongoDB | Cassandra | Average
-- | -- | -- | -- | -- | --
NodeJS | 111 795 | 71 280 | 56 235 | 5 775 | 61 271
Deno | 33 105 | 1 122 780 | 53 805 | 19 965 | 307 414
Bun | 0 | 0 | 0 | 0 | 0
Average | 48 300 | 398 020 | 36 680 | 8 580 |  



</body>
</html>


### Data processing delays
The table presents key timing and operational characteristics. It includes average data transfer rates using the WebSocket Secure protocol, average database write query execution latency, and average packet compression time. Additionally, the average number of disk write operations per second is presented, as well as peak values ​​for the number of unhandled packets, defined as packets received but not yet fully processed. A handled packet is considered to be one that has been received and converted from its raw form into a JavaScript object, transmitted via the WSS protocol, and forwarded to the write server, where compression and a response to the database query were performed, inserting a compressed record.
<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">

<head>

<meta name=ProgId content=Excel.Sheet>
<meta name=Generator content="Microsoft Excel 15">
</head>

<body link="#0563C1" vlink="#954F72">


Backend | Database | websocket avg   transfer time | avg latency   database write | avg compression   time | avg disk write [   iops ] | max unhandled   awaiting packets | disk reads by   database [total]
-- | -- | -- | -- | -- | -- | -- | --
Node.js | MariaDB | 50.5 μs | 160 ms | 28.5 μs | 920 | 753263 | 72
Node.js | PostgreSQL | 34.8 μs | 49.8 ms | 21.92 μs | 1280 | 525400 | 25008
Node.js | MongoDB | 56.3 μs | 3.36 ms | 28.46 μs | 41 | 195879 | 29
Node.js | Cassandra | 49.1 μs | 6.45 μs | 28.94 μs | 3 | 64 | -
Deno | MariaDB | 64.8 μs | 2.78 s | 879 μs | 314 | 1521241 | 48
Deno | PostgreSQL | CANCELED | CANCELED | CANCELED | CANCELED | 1171885 | CANCELED
Deno | MongoDB | 78.2 μs | 29.3 ms | 534.8 μs | 38 | 773740 | 6
Deno | Cassandra | 82.4 μs | 238 μs | 534.8 μs | 4 | 259 | -
Bun | MariaDB | 75.2 μs | 55.6 ms | 63.52 μs | 938 | 738263 | 138
Bun | PostgreSQL | 83.4 μs | 47.2 ms | 70.58 μs | 999 | 782862 | 25284
Bun | MongoDB | 101 μs | 3.58 ms | 73.92 μs | 36 | 229079 | 6
Bun | Cassandra | 97.2 μs | 229 μs | 78.8 μs | 5 | 16 | -



</body>

</html>


### Resource consumption
The study also analyzed the efficiency of system resource utilization for each of the tested backend and database configurations. The table below presents detailed data on RAM usage and CPU processing power. The minimum, average, and maximum values ​​for memory usage were taken into account, and the difference between their extreme values ​​was calculated. For CPU usage, the average and peak values ​​recorded during the tests were presented.
<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">

<head>

<meta name=ProgId content=Excel.Sheet>
<meta name=Generator content="Microsoft Excel 15">
</head>

<body link="#0563C1" vlink="#954F72">


Backend | Database | Min RAM | Avg RAM | Max RAM | Diff (Max - Min) | Avg CPU | Max CPU
-- | -- | -- | -- | -- | -- | -- | --
Node.js | MariaDB | 1.60   GB | 2.67   GB | 3.67   GB | 2.07   GB | 31.2% | 57.1%
Node.js | PostgreSQL | 0.47   GB | 0.97   GB | 1.80   GB | 1.33   GB | 28.4% | 48.2%
Node.js | MongoDB | 5.25   GB | 6.02   GB | 8.18   GB | 2.93   GB | 27.6% | 61.4%
Node.js | Cassandra | 4.99   GB | 5.12   GB | 5.19   GB | 0.20   GB | 25.9% | 50.7%
Deno | MariaDB | 1.20   GB | 8.10   GB | 9.31   GB | 8.11   GB | 31.1% | 57.0%
Deno | PostgreSQL | 0.35   GB | 1.98   GB | 2.76   GB | 2.41   GB | 43.1% | 96.3%
Deno | MongoDB | 5.26   GB | 7.87   GB | 14.00   GB | 8.74   GB | 28.7% | 58.8%
Deno | Cassandra | 5.12   GB | 5.42   GB | 5.61   GB | 0.49   GB | 25.4% | 48.0%
Bun | MariaDB | 1.15   GB | 1.95   GB | 3.50   GB | 2.35   GB | 26.7% | 43.1%
Bun | PostgreSQL | 0.42   GB | 1.15   GB | 3.28   GB | 2.86   GB | 23.4% | 43.3%
Bun | MongoDB | 5.24   GB | 5.81   GB | 8.21   GB | 2.97   GB | 28.3% | 60.5%
Bun | Cassandra | 5.12   GB | 5.16   GB | 5.24   GB | 0.12   GB | 25.9% | 56.2%



</body>

</html>
