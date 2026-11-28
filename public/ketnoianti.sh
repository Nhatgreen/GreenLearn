#!/usr/bin/env bash
set -euo pipefail

# ================= CẤU HÌNH =================
SERVER_NAME="greenlearn"
SERVER_URL="https://jzwmgflmhtaceasqzfop.supabase.co/functions/v1/mcp"
# ============================================

get_config_path() {
  local c1="$HOME/.gemini/antigravity/mcp_config.json"
  local c2="$HOME/.gemini/config/mcp_config.json"
  if [[ -f "$c1" ]]; then
    echo "$c1"
  elif [[ -f "$c2" ]]; then
    echo "$c2"
  else
    echo "$c1"
  fi
}

test_server() {
  local token="$1"
  local body='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"ketnoianti-linux","version":"1.0"}}}'
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -X POST "$SERVER_URL" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "Authorization: Bearer $token" \
    -d "$body" || echo "000")

  if [[ "$code" == "200" ]]; then
    echo "OK: Máy chủ phản hồi, token hợp lệ."
    return 0
  elif [[ "$code" == "401" || "$code" == "403" ]]; then
    echo "WARN: Token sai hoặc đã bị thu hồi (HTTP $code)."
    return 1
  elif [[ "$code" != "000" ]]; then
    echo "WARN: Máy chủ trả về HTTP $code."
    return 1
  else
    echo "WARN: Không kết nối được máy chủ. Kiểm tra mạng hoặc địa chỉ máy chủ."
    return 1
  fi
}

do_connect() {
  local cfg_path
  cfg_path=$(get_config_path)
  echo ""
  echo "Bước 1: Trong GreenLearn, vào Hồ sơ/Cài đặt > \"Tạo token\" rồi copy token."
  echo "Bước 2: Dán token vào đây (lúc nhập sẽ không hiện ký tự)."
  echo ""
  read -rsp "Token: " token
  echo ""
  token="${token#"${token%%[![:space:]]*}"}"
  token="${token%"${token##*[![:space:]]}"}"

  if [[ -z "$token" ]]; then
    echo "Chưa nhập token."
    return
  fi

  if [[ ! "$token" =~ ^gl_[A-Za-z0-9_-]{16,}$ ]]; then
    echo "Cảnh báo: token không đúng dạng gl_xxxxx. Vẫn tiếp tục."
  fi

  echo "Đang kiểm tra token..."
  if ! test_server "$token"; then
    read -rp "Vẫn ghi vào cấu hình? (y/N): " go
    if [[ "$go" != "y" && "$go" != "Y" ]]; then
      return
    fi
  fi

  if ! command -v python3 >/dev/null 2>&1; then
    echo "Lỗi: Cần python3 để cập nhật file JSON cấu hình an toàn."
    return
  fi

  mkdir -p "$(dirname "$cfg_path")"
  if [[ -f "$cfg_path" ]]; then
    cp "$cfg_path" "${cfg_path}.bak"
  fi

  GREENLEARN_CFG_PATH="$cfg_path" GREENLEARN_SERVER_NAME="$SERVER_NAME" GREENLEARN_SERVER_URL="$SERVER_URL" GREENLEARN_TOKEN="$token" python3 - <<'PY'
import json, os

path = os.environ["GREENLEARN_CFG_PATH"]
name = os.environ["GREENLEARN_SERVER_NAME"]
url = os.environ["GREENLEARN_SERVER_URL"]
token = os.environ["GREENLEARN_TOKEN"]

data = {}
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f:
        raw = f.read().strip()
        if raw:
            data = json.loads(raw)

if "mcpServers" not in data or not isinstance(data["mcpServers"], dict):
    data["mcpServers"] = {}

data["mcpServers"][name] = {
    "serverUrl": url,
    "headers": {
        "Authorization": f"Bearer {token}"
    }
}

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")
PY

  echo ""
  echo "Đã kết nối xong."
  echo "File cấu hình: $cfg_path"
  echo "Bản sao lưu: ${cfg_path}.bak"
  echo "Hãy khởi động lại Antigravity (hoặc bấm Refresh ở mục MCP Servers) để nhận cấu hình mới."
}

do_status() {
  local cfg_path
  cfg_path=$(get_config_path)
  echo ""
  echo "File cấu hình: $cfg_path"
  if [[ ! -f "$cfg_path" ]]; then
    echo "Chưa có file cấu hình. Chọn 1 để kết nối."
    return
  fi

  local info
  info=$(GREENLEARN_CFG_PATH="$cfg_path" GREENLEARN_SERVER_NAME="$SERVER_NAME" python3 - <<'PY'
import json, os

path = os.environ["GREENLEARN_CFG_PATH"]
name = os.environ["GREENLEARN_SERVER_NAME"]
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

entry = (data.get("mcpServers") or {}).get(name)
if not entry:
    print("MISSING")
else:
    auth = (entry.get("headers") or {}).get("Authorization", "")
    tok = auth.replace("Bearer ", "", 1).strip()
    url = entry.get("serverUrl", "")
    print(f"FOUND|{url}|{tok}")
PY
)

  if [[ "$info" == "MISSING" ]]; then
    echo "GreenLearn: CHƯA kết nối."
    return
  fi

  local url tok tail
  IFS='|' read -r _ url tok <<< "$info"
  if [[ ${#tok} -ge 4 ]]; then
    tail="${tok: -4}"
  else
    tail="****"
  fi
  echo "GreenLearn: ĐÃ kết nối (token ...$tail)"
  echo "Địa chỉ: $url"
  test_server "$tok" || true
}

do_disconnect() {
  local cfg_path
  cfg_path=$(get_config_path)
  echo ""
  if [[ ! -f "$cfg_path" ]]; then
    echo "Không có gì để gỡ."
    return
  fi

  local removed
  removed=$(GREENLEARN_CFG_PATH="$cfg_path" GREENLEARN_SERVER_NAME="$SERVER_NAME" python3 - <<'PY'
import json, os

path = os.environ["GREENLEARN_CFG_PATH"]
name = os.environ["GREENLEARN_SERVER_NAME"]
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

servers = data.get("mcpServers")
if not isinstance(servers, dict) or name not in servers:
    print("0")
else:
    del servers[name]
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("1")
PY
)

  if [[ "$removed" == "1" ]]; then
    echo "Đã gỡ kết nối GreenLearn khỏi Antigravity."
    echo "Nên vào GreenLearn > Cài đặt để thu hồi token này."
  else
    echo "GreenLearn chưa được kết nối."
  fi
}

while true; do
  echo ""
  echo "=============================================="
  echo "   GreenLearn  <->  Antigravity (Linux)"
  echo "   Kết nối bàn học với trợ lý lập trình AI"
  echo "=============================================="
  echo ""
  echo "  1. Kết nối (dán token)"
  echo "  2. Kiểm tra trạng thái"
  echo "  3. Gỡ kết nối"
  echo "  0. Thoát"
  echo ""
  read -rp "Chọn: " c
  case "$c" in
    1) do_connect ;;
    2) do_status ;;
    3) do_disconnect ;;
    0) exit 0 ;;
    *) echo "Lựa chọn không hợp lệ." ;;
  esac
done
