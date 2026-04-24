#!/usr/bin/env bash
set -euo pipefail

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

exec python3 -m http.server "${PORT}"
