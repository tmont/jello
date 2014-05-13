#!/bin/bash

prefix=""
status=`mysql -u root -e "show slave status\G"`

isIoRunning=`echo "${status}" | grep Slave_IO_Running | awk '{ print $2 }'`
isSqlRunning=`echo "${status}" | grep Slave_SQL_Running | awk '{ print $2 }'`
secondsBehind=`echo "${status}" | grep Seconds_Behind_Master | awk '{ print $2 }'`

function log() {
	logger -t "mysql-replication-check" -p $1 "$2"
}

log info "Slave IO Running: ${isIoRunning}"
log info "Slave SQL Running: ${isSqlRunning}"
log info "Slave behind master by ${secondsBehind} seconds"

if [ "${isSqlRunning}" != "Yes" ] || [ ${secondsBehind} -gt 5 ] || [ "${isIoRunning}" != "Yes" ]; then
	log err "[error] ${status}"
fi
