#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "请使用 sudo 执行：sudo bash scripts/map-md2text-local.sh <port>"
  exit 1
fi

if [[ $# -ne 1 ]]; then
  echo "用法: sudo bash scripts/map-md2text-local.sh <port>"
  exit 1
fi

PORT="$1"
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || (( PORT < 1 || PORT > 65535 )); then
  echo "端口不合法: $PORT"
  exit 1
fi

HOSTS_LINE="127.0.0.1 md2text.local"
if ! grep -qE '(^|[[:space:]])md2text\.local($|[[:space:]])' /etc/hosts; then
  echo "$HOSTS_LINE" >> /etc/hosts
  echo "已写入 /etc/hosts: $HOSTS_LINE"
else
  echo "/etc/hosts 已包含 md2text.local，跳过"
fi

PF_CONF="/etc/pf.conf"
PF_ANCHOR_FILE="/etc/pf.anchors/md2text-local"
PF_CONF_BAK="/etc/pf.conf.md2text-local.bak"

cp "$PF_CONF" "$PF_CONF_BAK"
echo "已备份 /etc/pf.conf -> $PF_CONF_BAK"

python3 - "$PF_CONF" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
lines = path.read_text().splitlines()

def is_md2text_anchor_line(line: str) -> bool:
    s = line.strip()
    if "md2text-local" not in s:
        return False
    return s.startswith("rdr-anchor ") or s.startswith("anchor ") or s.startswith("load anchor ")

filtered = [line for line in lines if not is_md2text_anchor_line(line)]

try:
    last_rdr_idx = max(i for i, line in enumerate(filtered) if line.strip().startswith("rdr-anchor "))
except ValueError:
    raise SystemExit("pf.conf 中未找到 rdr-anchor 段，无法自动插入 md2text-local 规则")

filtered.insert(last_rdr_idx + 1, 'rdr-anchor "md2text-local"')

anchor_indices = [i for i, line in enumerate(filtered) if line.strip().startswith("anchor ")]
if not anchor_indices:
    raise SystemExit("pf.conf 中未找到 anchor 段，无法自动插入 md2text-local 规则")
filtered.insert(anchor_indices[-1] + 1, 'anchor "md2text-local"')

load_indices = [i for i, line in enumerate(filtered) if line.strip().startswith("load anchor ")]
if not load_indices:
    raise SystemExit("pf.conf 中未找到 load anchor 段，无法自动插入 md2text-local 规则")
filtered.insert(load_indices[-1] + 1, 'load anchor "md2text-local" from "/etc/pf.anchors/md2text-local"')

path.write_text("\n".join(filtered) + "\n")
PY

echo "已按 PF 规则顺序更新 /etc/pf.conf 的 md2text-local anchor 配置"

cat > "$PF_ANCHOR_FILE" <<EOF
rdr pass on lo0 inet proto tcp from any to 127.0.0.1 port 80 -> 127.0.0.1 port $PORT
EOF

echo "已写入 ${PF_ANCHOR_FILE}, 目标端口: ${PORT}"

if ! pfctl -nf "$PF_CONF" >/dev/null; then
  cp "$PF_CONF_BAK" "$PF_CONF"
  echo "pf.conf 校验失败，已自动恢复备份: $PF_CONF_BAK"
  exit 1
fi

pfctl -f "$PF_CONF" >/dev/null
pfctl -e >/dev/null 2>&1 || true

echo "映射完成："
echo "  http://md2text.local  ->  http://127.0.0.1:$PORT"
