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

READY_TIMEOUT_SEC=30
POLL_INTERVAL_SEC=0.2

npm run dev -- --port "${PORT}" &
DEV_PID=$!

cleanup() {
  if kill -0 "${DEV_PID}" 2>/dev/null; then
    kill -TERM "${DEV_PID}" 2>/dev/null || true
  fi
}

trap cleanup INT TERM

wait_for_port_ready() {
  local deadline
  deadline="$(python3 - <<PY
import time
print(time.time() + ${READY_TIMEOUT_SEC})
PY
)"

  while true; do
    if ! kill -0 "${DEV_PID}" 2>/dev/null; then
      wait "${DEV_PID}" || true
      echo "Next.js 启动失败，进程已退出。"
      exit 1
    fi

    if lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN -t >/dev/null 2>&1; then
      return
    fi

    local now
    now="$(python3 - <<'PY'
import time
print(time.time())
PY
)"
    if [[ "$(python3 - <<PY
print(1 if ${now} >= ${deadline} else 0)
PY
)" == "1" ]]; then
      echo "等待端口 ${PORT} 启动超时（${READY_TIMEOUT_SEC}s）。"
      cleanup
      exit 1
    fi

    sleep "${POLL_INTERVAL_SEC}"
  done
}

wait_for_port_ready

echo "${PORT}" > "${PORT_FILE}"

echo "已选择随机端口: ${PORT}"
echo "本地访问: http://127.0.0.1:${PORT}"
echo "如需无端口访问，请执行:"
echo "  sudo bash scripts/map-md2text-local.sh ${PORT}"
echo ""
echo "已启用 Next.js 开发模式，保存后会自动热更新（端口保持不变）。"

wait "${DEV_PID}"
