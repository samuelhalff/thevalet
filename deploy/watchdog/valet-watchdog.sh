#!/bin/bash
# Stops runaway processes of the Codex user so SSH, nginx and the Codex app-server stay responsive.
# Runs every 5 minutes from valet-watchdog.timer (root). Never touches the Codex app-server itself.
set -u
USER_NAME="${WATCHDOG_USER:-kadiata}"
DEV_MAX_MIN=20      # dev/preview servers older than this are stopped
HOG_PCPU=50         # average CPU % over the process lifetime...
HOG_MIN=15          # ...for at least this many minutes
MEM_FLOOR_MB=250    # below this much available memory, stop the biggest offender

log() { logger -t valet-watchdog "$*"; echo "$*"; }
protected() { case "$1" in *"codex app-server"*|*codex-code-mode-host*|*sshd*|*systemd*|*"(sd-pam)"*) return 0;; esac; return 1; }
starttime() { awk '{print $22}' /proc/"$1"/stat 2>/dev/null; }
tree() { local c; for c in $(ps -o pid= --ppid "$1"); do tree "$c"; echo "$c"; done; }
stop() { # pid reason: stops the process and all its descendants, unless the pid was reused
  local st cmd pids p; st=$(starttime "$1"); [[ -n "$st" ]] || return
  cmd=$(tr '\0' ' ' < /proc/"$1"/cmdline 2>/dev/null | cut -c1-120)
  if [[ -n "${DRY:-}" ]]; then echo "would stop pid $1 ($2): $cmd"; return; fi
  log "stopping pid $1 ($2): $cmd"
  pids="$(tree "$1") $1"
  for p in $pids; do protected "$(tr '\0' ' ' < /proc/"$p"/cmdline 2>/dev/null)" || kill -TERM "$p" 2>/dev/null; done
  sleep 5
  [[ "$(starttime "$1")" == "$st" || -z "$(starttime "$1")" ]] || return   # pid reused: leave it
  for p in $pids; do [[ "$(stat -c %U /proc/"$p" 2>/dev/null)" == "$USER_NAME" ]] && kill -KILL "$p" 2>/dev/null; done
}

ps -u "$USER_NAME" -o pid=,etimes=,pcpu=,args= | while read -r pid et cpu args; do
  protected "$args" && continue
  if [[ "$args" =~ (next\ dev|next-server|next\ start|npm\ run\ (dev|start|preview)|(^|/|\ )vite(\ |$)|http-server|(^|/|\ )serve\ ) ]] && (( et > DEV_MAX_MIN*60 )); then
    stop "$pid" "dev server running $((et/60)) min"; continue
  fi
  if (( et > HOG_MIN*60 )) && awk -v c="$cpu" -v t="$HOG_PCPU" 'BEGIN{exit !(c>t)}'; then
    stop "$pid" "CPU ${cpu}% for $((et/60)) min"
  fi
done

avail=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)
if (( avail < MEM_FLOOR_MB )); then
  ps -u "$USER_NAME" -o pid=,etimes=,rss=,args= --sort=-rss | while read -r pid et rss args; do
    protected "$args" && continue
    (( et > 600 && rss > 102400 )) || continue
    stop "$pid" "low memory (${avail} MB available), rss $((rss/1024)) MB"; break
  done
fi
