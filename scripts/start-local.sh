#!/usr/bin/env bash
set -euo pipefail

STATE_DIR="/tmp/md2text-local"
PORT_FILE="${STATE_DIR}/last-port"

stop_port_if_needed() {
  local port="$1"
  local pids

  pids="$(lsof -nP -iTCP:"${port}" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -z "${pids}" ]]; then
    return
  fi

  echo "检测到旧端口 ${port} 仍在监听，正在停止: ${pids}"
  kill -TERM ${pids} 2>/dev/null || true
  sleep 0.5

  local remaining
  remaining="$(lsof -nP -iTCP:"${port}" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -n "${remaining}" ]]; then
    echo "旧进程未完全退出，强制停止: ${remaining}"
    kill -KILL ${remaining} 2>/dev/null || true
  fi
}

mkdir -p "${STATE_DIR}"
if [[ -f "${PORT_FILE}" ]]; then
  LAST_PORT="$(<"${PORT_FILE}")"
  if [[ "${LAST_PORT}" =~ ^[0-9]+$ ]]; then
    stop_port_if_needed "${LAST_PORT}"
  fi
fi

PORT="$(python3 - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
)"

echo "已选择随机端口: ${PORT}"
echo "本地访问: http://127.0.0.1:${PORT}"
echo "如需无端口访问，请执行:"
echo "  sudo bash scripts/map-md2text-local.sh ${PORT}"
echo ""

echo "${PORT}" > "${PORT_FILE}"

exec node server.js "${PORT}"
