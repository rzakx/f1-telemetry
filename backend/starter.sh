#!/bin/bash
nowe=`date +%Y-%m-%d-%H-%M`
mv "last.log" "${nowe}.log"
screen -dmSL "backendf1" -Logfile last.log node index.js