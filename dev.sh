#!/bin/bash

red=$(tput setaf 1)
blue=$(tput setaf 4)
gray=$(tput setaf 0)$(tput bold)
green=$(tput setaf 2)
bold=$(tput bold)
reset=$(tput sgr0)

basedir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
productName="jello"

usage() {
	cat <<USAGE
Usage: $0 <command> [subcommand]

Commands:
  ${green}generate${reset}
    ${bold}schema${reset}
      dumps the maria database schema (without data)
USAGE
}

millis() {
	echo $(($(date +%s%N)/1000000))
}

doRun() {
	local start=$(millis)
	local cmdName=$1
	shift
	debug "\`$@\`"
	eval "$@" 2>&1 | logOutput "${cmdName}"
	local end=$(millis)
	local elapsed=$((${end} - ${start}))
	info "${cmdName} finished in $(getElapsed ${elapsed})"
	local returnValue=$PIPESTATUS

	if [[ ${returnValue} -ne 0 ]]; then
		error "error" "Command failed with exit status ${returnValue}"
	fi

	return ${returnValue}
}

run() {
	doRun $1 $@
	return $?
}

runInVagrant() {
	doRun "vagrant:$1" sudo vagrant ssh -c "\"$@\""
	return $?
}

debug() {
	log "debug" "$@"
}
debugCmd() {
	local name=$1
	shift
	log "${name}" "$@"
}

info() {
	log "info" "$@"
}

error() {
	log "error" "$@"
}

log() {
	case $1 in
		info)
			echo -n "[${green}$1${reset}]"
			;;
		error)
			echo -n "[${red}$1${reset}]"
			;;
		*)
			echo -n "[${gray}$1${reset}]"
			;;
	esac

	shift
	echo " $@"
}

logOutput() {
	while read cmdOutput; do
		debugCmd $1 "${cmdOutput}"
	done
}

getElapsed() {
	if [ $1 -gt 2000 ]; then
		local roundedElapsed=$(($1 / 1000))
		echo "${roundedElapsed}.$((($1 - ${roundedElapsed} * 1000) / 10))s"
	else
		echo "$1ms"
	fi
}

generateSchema() {
	local db=${productName}
	local target="/vagrant/cfg/modules/${productName}/files/${db}.sql"
	runInVagrant mysqldump -u root -d --add-drop-database --databases ${db} -r "${target}"
}

generateSql() {
	echo
}

case $1 in
	generate)
		case $2 in
			schema)
				generateSchema
				;;
			*)
				usage
				exit 1
				;;
		esac
		;;
	*)
		usage
		exit 1
		;;
esac


