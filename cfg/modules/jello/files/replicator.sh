#!/bin/bash

master="$1"
mysql=/usr/bin/mysql
mysqlMaster="${mysql} -u root -h ${master}"

# get master status
status=`${mysqlMaster} -Bse "show master status"`
pos=`echo "${status}" | cut -f2`
masterFile=`echo "${status}" | cut -f1`

# change master on slave
slaveRunning=`mysql -u root -e "show slave status\G" | grep Slave_IO_Running | awk '{ print $2 }'`
if [ "${slaveRunning}" != "No" ]; then
	${mysql} -u root -e "slave stop;"
fi

${mysql} -u root -e "CHANGE MASTER TO MASTER_HOST='${master}', MASTER_USER='replicator', MASTER_PASSWORD='password', MASTER_LOG_FILE='${masterFile}', MASTER_LOG_POS=${pos};"
${mysql} -u root -e "slave start;"

touch /root/slave_setup
chmod 600 /root/slave_setup
