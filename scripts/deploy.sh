#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Axene Templates - Deploy Script
# ============================================================================

REMOTE_DIR="/opt/axene-templates"
COMPOSE_PROD="docker-compose.yml"
HEALTH_URL="https://templates.axene.io"
SSH_HOST="prod"

# -- Colors ------------------------------------------------------------------
BOLD="\033[1m"
DIM="\033[2m"
RESET="\033[0m"
YELLOW="\033[38;2;255;209;0m"
GREEN="\033[38;2;72;199;142m"
RED="\033[38;2;255;85;85m"
CYAN="\033[38;2;130;200;255m"
GRAY="\033[38;2;120;120;120m"

# Background colors for boxes
BG_YELLOW="\033[48;2;255;209;0m"
BG_GREEN="\033[48;2;72;199;142m"
BG_RED="\033[48;2;255;85;85m"
BG_GRAY="\033[48;2;60;60;60m"
BLACK="\033[38;2;30;30;30m"
WHITE="\033[38;2;255;255;255m"

# Boxed icons
BOX_CHECK="${BG_GREEN}${BLACK} \xe2\x9c\x94 ${RESET}"
BOX_CROSS="${BG_RED}${WHITE} \xe2\x9c\x96 ${RESET}"
BOX_PENDING="${BG_GRAY}${GRAY}   ${RESET}"

# Spinner frames (braille dots)
SPIN_FRAMES=($'\xe2\xa0\x8b' $'\xe2\xa0\x99' $'\xe2\xa0\xb9' $'\xe2\xa0\xb8' $'\xe2\xa0\xbc' $'\xe2\xa0\xb4' $'\xe2\xa0\xa6' $'\xe2\xa0\xa7' $'\xe2\xa0\x87' $'\xe2\xa0\x8f')
SPIN_PID=""

# -- State -------------------------------------------------------------------
STEP_TIMES=()
TOTAL_START=$(date +%s)
CURRENT_STEP=0
TOTAL_STEPS=0
SKIP_CHECK=false
VERBOSE=false

# -- Parse args --------------------------------------------------------------
for arg in "$@"; do
  case "$arg" in
    --quick|-q) SKIP_CHECK=true ;;
    --verbose|-v) VERBOSE=true ;;
    --help|-h)
      echo "Usage: ./scripts/deploy.sh [options]"
      echo "  --quick,   -q   Skip svelte-check"
      echo "  --verbose, -v   Show live command output"
      exit 0
      ;;
  esac
done

if [ "$SKIP_CHECK" = true ]; then
  TOTAL_STEPS=5
  ALL_LABELS=("Syncing code" "Building images" "Running migrations" "Starting services" "Health check")
else
  TOTAL_STEPS=6
  ALL_LABELS=("Type-checking frontend" "Syncing code" "Building images" "Running migrations" "Starting services" "Health check")
fi

# -- Helpers -----------------------------------------------------------------
progress_bar() {
  local current=$1 total=$2 width=30
  local filled=$((current * width / total))
  local empty=$((width - filled))
  local pct=$((current * 100 / total))

  printf "  ${GRAY}[${RESET}"
  for ((i=0; i<filled; i++)); do printf "${YELLOW}\xe2\x94\x81${RESET}"; done
  for ((i=0; i<empty; i++)); do printf "${GRAY}-${RESET}"; done
  printf "${GRAY}]${RESET} ${BOLD}%3d%%${RESET}" "$pct"
}

draw_ui() {
  local spin_char="${1:-}"
  local lines_to_clear=$((TOTAL_STEPS + 2))
  for ((i=0; i<lines_to_clear; i++)); do
    printf "\033[A\033[2K"
  done

  progress_bar "$CURRENT_STEP" "$TOTAL_STEPS"
  printf "\n\n"

  for ((i=0; i<TOTAL_STEPS; i++)); do
    if [ $i -lt $CURRENT_STEP ]; then
      printf "  ${BOX_CHECK} %-27s ${DIM}%s${RESET}\n" "${ALL_LABELS[$i]}" "${STEP_TIMES[$i]}"
    elif [ $i -eq $CURRENT_STEP ]; then
      if [ -n "$spin_char" ]; then
        printf "  ${BG_YELLOW}${BLACK} %s ${RESET} ${BOLD}%-27s${RESET} ${DIM}running...${RESET}\n" "$spin_char" "${ALL_LABELS[$i]}"
      else
        printf "  ${BG_YELLOW}${BLACK} \xe2\x96\xb8 ${RESET} ${BOLD}%-27s${RESET} ${DIM}running...${RESET}\n" "${ALL_LABELS[$i]}"
      fi
    else
      printf "  ${BOX_PENDING} ${GRAY}%-27s${RESET}\n" "${ALL_LABELS[$i]}"
    fi
  done
}

draw_initial() {
  progress_bar 0 "$TOTAL_STEPS"
  printf "\n\n"
  for ((i=0; i<TOTAL_STEPS; i++)); do
    printf "  ${BOX_PENDING} ${GRAY}%-27s${RESET}\n" "${ALL_LABELS[$i]}"
  done
}

start_spinner() {
  if [ "$VERBOSE" = true ]; then return; fi
  (
    local frame=0
    while true; do
      local ch="${SPIN_FRAMES[$((frame % 10))]}"
      draw_ui "$ch" 2>/dev/null
      frame=$((frame + 1))
      sleep 0.3
    done
  ) &
  SPIN_PID=$!
  disown "$SPIN_PID" 2>/dev/null
}

stop_spinner() {
  if [ -n "$SPIN_PID" ] && kill -0 "$SPIN_PID" 2>/dev/null; then
    kill "$SPIN_PID" 2>/dev/null
    wait "$SPIN_PID" 2>/dev/null || true
  fi
  SPIN_PID=""
}

run_step() {
  STEP_START=$(date +%s)
  draw_ui
  start_spinner
}

step_done() {
  stop_spinner
  local elapsed=$(( $(date +%s) - STEP_START ))
  STEP_TIMES+=("${elapsed}s")
  CURRENT_STEP=$((CURRENT_STEP + 1))
}

step_fail() {
  stop_spinner
  local msg="${1:-Failed}"
  STEP_TIMES+=("FAILED")
  CURRENT_STEP=$((CURRENT_STEP + 1))

  local lines_to_clear=$((TOTAL_STEPS + 2))
  for ((i=0; i<lines_to_clear; i++)); do
    printf "\033[A\033[2K"
  done

  progress_bar "$((CURRENT_STEP - 1))" "$TOTAL_STEPS"
  printf "\n\n"

  for ((i=0; i<TOTAL_STEPS; i++)); do
    if [ $i -lt $((CURRENT_STEP - 1)) ]; then
      printf "  ${BOX_CHECK} %-27s ${DIM}%s${RESET}\n" "${ALL_LABELS[$i]}" "${STEP_TIMES[$i]}"
    elif [ $i -eq $((CURRENT_STEP - 1)) ]; then
      printf "  ${BOX_CROSS} ${RED}%-27s %s${RESET}\n" "${ALL_LABELS[$i]}" "$msg"
    else
      printf "  ${BOX_PENDING} ${GRAY}%-27s${RESET}\n" "${ALL_LABELS[$i]}"
    fi
  done

  printf "\n  ${RED}${BOLD}Deploy failed.${RESET}\n\n"
  exit 1
}

run_cmd() {
  local logfile="$1"
  shift
  if [ "$VERBOSE" = true ]; then
    printf "\n"
    "$@" 2>&1 | tee "$logfile"
    local rc=${PIPESTATUS[0]}
    printf "\n"
    return $rc
  else
    "$@" > "$logfile" 2>&1
  fi
}

# Cleanup spinner on exit
trap 'stop_spinner' EXIT

# -- Banner ------------------------------------------------------------------
clear
printf "\n${YELLOW}${BOLD}"
cat << 'BANNER'
   █████  ██   ██ ███████ ███    ██ ███████
  ██   ██  ██ ██  ██      ████   ██ ██
  ███████   ███   █████   ██ ██  ██ █████
  ██   ██  ██ ██  ██      ██  ██ ██ ██
  ██   ██ ██   ██ ███████ ██   ████ ███████
BANNER
printf "${RESET}  ${DIM}templates${RESET}\n"
printf "\n"
printf "  ${YELLOW}${BOLD}Deploying to production${RESET}\n"
printf "  ${GRAY}%s${RESET}\n" "$(date '+%Y-%m-%d %H:%M:%S')"
printf "\n"
printf "  ${GRAY}server${RESET}  ${CYAN}173.212.245.66${RESET}\n"
printf "  ${GRAY}target${RESET}  ${CYAN}%s${RESET}\n" "$HEALTH_URL"
if [ "$SKIP_CHECK" = true ]; then
  printf "  ${GRAY}mode${RESET}    ${YELLOW}quick${RESET} ${GRAY}(skip type-check)${RESET}\n"
else
  printf "  ${GRAY}mode${RESET}    ${GREEN}full${RESET}\n"
fi
if [ "$VERBOSE" = true ]; then
  printf "  ${GRAY}output${RESET}  ${YELLOW}verbose${RESET}\n"
fi
printf "\n"

draw_initial

# -- Type check --------------------------------------------------------------
if [ "$SKIP_CHECK" = false ]; then
  run_step
  if run_cmd /tmp/axene-check.log npx svelte-check --threshold error; then
    step_done
  else
    printf "\n"
    grep -i "error" /tmp/axene-check.log | head -10
    step_fail "type errors"
  fi
fi

# -- Sync --------------------------------------------------------------------
run_step
if run_cmd /tmp/axene-rsync.log rsync -az --delete \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='.venv' \
    --exclude='.svelte-kit' \
    --exclude='*.pyc' \
    --exclude='.claude' \
    -e "ssh" \
    ./ "${SSH_HOST}:${REMOTE_DIR}/"; then
  step_done
else
  step_fail "rsync error"
fi

# -- Build -------------------------------------------------------------------
run_step
if run_cmd /tmp/axene-build.log ssh "$SSH_HOST" \
    "cd ${REMOTE_DIR} && docker compose -f ${COMPOSE_PROD} build --pull"; then
  step_done
else
  printf "\n"
  tail -10 /tmp/axene-build.log
  step_fail "build error"
fi

# -- Migrate (drizzle - best-effort, schema managed at setup) ---------------
run_step
run_cmd /tmp/axene-migrate.log ssh "$SSH_HOST" \
    "cd ${REMOTE_DIR} && docker compose exec -T app npx drizzle-kit push --config drizzle.config.ts --force 2>/dev/null || true"
step_done

# -- Restart -----------------------------------------------------------------
run_step
if run_cmd /tmp/axene-restart.log ssh "$SSH_HOST" \
    "cd ${REMOTE_DIR} && docker compose -f ${COMPOSE_PROD} up -d --remove-orphans"; then
  step_done
else
  printf "\n"
  tail -10 /tmp/axene-restart.log
  step_fail "restart error"
fi

# -- Health check ------------------------------------------------------------
run_step
HEALTHY=false
for i in $(seq 1 24); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  if [ "$VERBOSE" = true ]; then
    printf "  ${DIM}health attempt %d: HTTP %s${RESET}\n" "$i" "$STATUS"
  fi
  if [ "$STATUS" = "200" ]; then
    HEALTHY=true
    break
  fi
  sleep 5
done

if [ "$HEALTHY" = true ]; then
  step_done
else
  step_fail "HTTP $STATUS"
fi

# -- Prune -------------------------------------------------------------------
ssh "$SSH_HOST" "docker image prune -f" >/dev/null 2>&1 || true

# -- Final -------------------------------------------------------------------
draw_ui

TOTAL_ELAPSED=$(( $(date +%s) - TOTAL_START ))
MINS=$((TOTAL_ELAPSED / 60))
SECS=$((TOTAL_ELAPSED % 60))

printf "\n"
printf "  ${GREEN}\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81${RESET}\n"
printf "  ${GREEN}${BOLD}  DEPLOY SUCCESSFUL${RESET}  ${DIM}%dm %ds${RESET}\n" "$MINS" "$SECS"
printf "  ${GREEN}\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81\xe2\x94\x81${RESET}\n"
printf "  ${DIM}live at${RESET} ${CYAN}%s${RESET}\n" "$HEALTH_URL"
printf "\n"
