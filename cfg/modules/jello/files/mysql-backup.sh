#!/bin/sh

dateTime=`date +%Y%m%d%H%M%S`
target="/tmp/curveball-mysqldump-${dateTime}.sql.gz"
syslogTag="mysql-backup"
mysqldump --single-transaction --databases curveball -u root | gzip > "${target}"
logger -t "${syslogTag}" "[info] curveball database dumped to ${target}"
/root/archiver.js | logger -s -t "${syslogTag}"
