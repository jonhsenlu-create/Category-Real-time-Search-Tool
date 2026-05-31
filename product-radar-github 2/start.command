#!/bin/zsh
cd "$(dirname "$0")"
npm start &
SERVER_PID=$!
sleep 1
open "http://127.0.0.1:4174/radar/"
wait $SERVER_PID
