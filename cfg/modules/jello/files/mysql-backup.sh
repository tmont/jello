#!/bin/sh

dateTime=`date +%Y%m%d%H%M%S`
target="/tmp/jello-mysqldump-${dateTime}.sql.gz"
syslogTag="mysql-backup"
mysqldump --single-transaction --databases jello -u root | gzip > "${target}"
logger -t "${syslogTag}" "[info] jello database dumped to ${target}"
/root/archiver.js | logger -s -t "${syslogTag}"
