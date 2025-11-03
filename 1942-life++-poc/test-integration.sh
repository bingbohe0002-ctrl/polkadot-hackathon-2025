#!/bin/bash

# 前后端完整联调测试脚本

set -e

echo "=========================================="
echo "Life++ 前后端完整联调测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查后端服务
check_backend() {
    echo -e "${YELLOW}检查后端服务...${NC}"
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 后端服务运行中${NC}"
        return 0
    else
        echo -e "${RED}✗ 后端服务未运行${NC}"
        return 1
    fi
}

# 检查前端服务
check_frontend() {
    echo -e "${YELLOW}检查前端服务...${NC}"
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 前端服务运行中${NC}"
        return 0
    else
        echo -e "${RED}✗ 前端服务未运行${NC}"
        return 1
    fi
}

# 测试API端点
test_api_endpoint() {
    local endpoint=$1
    local name=$2
    
    echo -n "  测试 $name... "
    response=$(curl -s -w "\n%{http_code}" http://localhost:3000$endpoint 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" == "200" ]; then
        echo -e "${GREEN}✓ 通过 (HTTP $http_code)${NC}"
        if [ ! -z "$body" ]; then
            echo "    数据: $(echo $body | cut -c1-100)..."
        fi
        return 0
    else
        echo -e "${RED}✗ 失败 (HTTP $http_code)${NC}"
        if [ ! -z "$body" ]; then
            echo "    错误: $body"
        fi
        return 1
    fi
}

# 主测试流程
main() {
    echo "步骤 1: 检查服务状态"
    echo "----------------------------------------"
    
    backend_running=false
    frontend_running=false
    
    if check_backend; then
        backend_running=true
    fi
    
    if check_frontend; then
        frontend_running=true
    fi
    
    echo ""
    
    if [ "$backend_running" = false ]; then
        echo -e "${YELLOW}提示: 后端服务未运行，请先启动：${NC}"
        echo "  source .env.passetHub"
        echo "  npm run indexer:start"
        echo ""
    fi
    
    if [ "$frontend_running" = false ]; then
        echo -e "${YELLOW}提示: 前端服务未运行，请先启动：${NC}"
        echo "  cd frontend"
        echo "  npm run dev"
        echo ""
    fi
    
    if [ "$backend_running" = false ] || [ "$frontend_running" = false ]; then
        echo -e "${RED}请先启动服务后再运行测试${NC}"
        exit 1
    fi
    
    echo ""
    echo "步骤 2: 测试后端API端点"
    echo "----------------------------------------"
    
    passed=0
    failed=0
    
    # 测试所有API端点
    test_api_endpoint "/health" "健康检查" && ((passed++)) || ((failed++))
    test_api_endpoint "/api/dashboard/stats" "仪表板统计" && ((passed++)) || ((failed++))
    test_api_endpoint "/api/proofs" "证明列表" && ((passed++)) || ((failed++))
    test_api_endpoint "/api/agents" "代理列表" && ((passed++)) || ((failed++))
    test_api_endpoint "/api/validators" "验证者列表" && ((passed++)) || ((failed++))
    test_api_endpoint "/api/regulatory/pending" "待审查证明" && ((passed++)) || ((failed++))
    test_api_endpoint "/api/chainrank/stats" "ChainRank统计" && ((passed++)) || ((failed++))
    test_api_endpoint "/api/chainrank/top" "顶级代理" && ((passed++)) || ((failed++))
    test_api_endpoint "/api/compliance/status" "合规状态" && ((passed++)) || ((failed++))
    test_api_endpoint "/api/economics" "代币经济学" && ((passed++)) || ((failed++))
    
    echo ""
    echo "步骤 3: 测试结果"
    echo "----------------------------------------"
    echo -e "${GREEN}通过: $passed${NC}"
    echo -e "${RED}失败: $failed${NC}"
    echo ""
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}=========================================="
        echo "✅ 所有测试通过！前后端联调正常"
        echo "==========================================${NC}"
        echo ""
        echo "前端访问地址: http://localhost:5173"
        echo "后端API地址: http://localhost:3000"
        exit 0
    else
        echo -e "${RED}=========================================="
        echo "❌ 部分测试失败，请检查后端日志"
        echo "==========================================${NC}"
        exit 1
    fi
}

main "$@"
