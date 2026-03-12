#!/bin/bash

# =============================================================================
# Suvidha One Backend - Load Test Runner Script
# =============================================================================
# 
# This script provides easy commands to run various load tests against
# the Suvidha One backend services.
#
# Usage:
#   ./run-tests.sh [command] [options]
#
# Commands:
#   smoke     - Quick smoke test (10s, 5 VUs)
#   load      - Standard load test (2.5m, 10-100 VUs)
#   stress    - Stress test to find breaking point (8m, up to 500 VUs)
#   spike     - Spike test for traffic bursts (2m, up to 300 VUs)
#   soak      - Soak test for stability (10m, 100 VUs)
#   all       - Run all tests sequentially
#   check     - Check if k6 is installed and services are up
#   help      - Show this help message
#
# Options:
#   -v, --vus <number>      - Override default VUs
#   -d, --duration <time>   - Override test duration (for soak test)
#   -o, --output <dir>      - Output directory for results (default: results)
#   -q, --quiet             - Minimal output
#   -h, --help              - Show help for specific command
#
# Environment Variables:
#   AUTH_URL, PAYMENT_URL, etc. - Service URLs (default: http://localhost:300X)
#   MAX_VUS                     - Maximum VUs for stress test
#   SOAK_VUS                    - VUs for soak test
#   SOAK_DURATION               - Duration for soak test
#
# Examples:
#   ./run-tests.sh smoke
#   ./run-tests.sh stress -v 1000
#   ./run-tests.sh soak -d 30m
#   MAX_VUS=800 ./run-tests.sh stress
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_SMOKE_VUS=5
DEFAULT_LOAD_VUS=100
DEFAULT_STRESS_VUS=500
DEFAULT_SPIKE_VUS=300
DEFAULT_SOAK_VUS=100
DEFAULT_SOAK_DURATION="10m"
OUTPUT_DIR="results"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_header() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         Suvidha One Backend - Load Testing                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

# Check if k6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        log_error "k6 is not installed. Please install it first."
        echo ""
        echo "Installation options:"
        echo "  macOS:     brew install k6"
        echo "  Windows:   winget install k6"
        echo "  Linux:     See https://k6.io/docs/getting-started/installation/"
        echo "  Docker:    docker run --rm grafana/k6"
        echo ""
        exit 1
    fi
    log_success "k6 found: $(k6 version)"
}

# Check if services are running
check_services() {
    log_info "Checking backend services..."
    
    local services=(
        "AUTH_URL:3001:Auth Service"
        "PAYMENT_URL:3002:Payment Service"
        "UTILITY_URL:3003:Utility Service"
        "GRIEVANCE_URL:3004:Grievance Service"
        "DOCUMENT_URL:3005:Document Service"
        "NOTIFICATION_URL:3006:Notification Service"
        "SESSION_URL:3007:Session Service"
        "KIOSK_URL:3008:Kiosk Service"
    )
    
    local all_up=true
    
    for service in "${services[@]}"; do
        IFS=':' read -r env_var port name <<< "$service"
        local url="${!env_var:-http://localhost:$port}"
        
        if curl -s --max-time 2 "${url}/health" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} $name ($url)"
        else
            echo -e "  ${RED}✗${NC} $name ($url) - Not responding"
            all_up=false
        fi
    done
    
    echo ""
    
    if [ "$all_up" = false ]; then
        log_warning "Some services are not responding. Tests may fail."
        echo ""
        echo "To start all services:"
        echo "  docker-compose up -d"
        echo ""
    else
        log_success "All services are responding"
    fi
}

# Create output directory
setup_output_dir() {
    mkdir -p "$OUTPUT_DIR"
    log_info "Results will be saved to: $OUTPUT_DIR/"
}

# Run smoke test
run_smoke() {
    log_info "Running Smoke Test..."
    echo ""
    echo "Configuration:"
    echo "  Scenario: smoke"
    echo "  VUs: $DEFAULT_SMOKE_VUS"
    echo "  Duration: 10s"
    echo ""
    
    k6 run --scenario smoke load-test-runner.js
    
    if [ $? -eq 0 ]; then
        log_success "Smoke test completed successfully"
    else
        log_error "Smoke test failed"
        return 1
    fi
}

# Run load test
run_load() {
    log_info "Running Load Test..."
    echo ""
    echo "Configuration:"
    echo "  Scenario: load"
    echo "  Max VUs: $DEFAULT_LOAD_VUS"
    echo "  Duration: 2.5m"
    echo ""
    
    k6 run --scenario load load-test-runner.js
    
    if [ $? -eq 0 ]; then
        log_success "Load test completed successfully"
    else
        log_error "Load test failed"
        return 1
    fi
}

# Run stress test
run_stress() {
    local vus=${1:-$DEFAULT_STRESS_VUS}
    
    log_info "Running Stress Test..."
    echo ""
    echo "Configuration:"
    echo "  Max VUs: $vus"
    echo "  Duration: 8m"
    echo ""
    
    MAX_VUS=$vus k6 run stress-test.js
    
    if [ $? -eq 0 ]; then
        log_success "Stress test completed successfully"
    else
        log_error "Stress test failed"
        return 1
    fi
}

# Run spike test
run_spike() {
    local vus=${1:-$DEFAULT_SPIKE_VUS}
    
    log_info "Running Spike Test..."
    echo ""
    echo "Configuration:"
    echo "  Spike VUs: $vus"
    echo "  Baseline: 10 VUs"
    echo "  Duration: 2m"
    echo ""
    
    SPIKE_VUS=$vus k6 run spike-test.js
    
    if [ $? -eq 0 ]; then
        log_success "Spike test completed successfully"
    else
        log_error "Spike test failed"
        return 1
    fi
}

# Run soak test
run_soak() {
    local vus=${1:-$DEFAULT_SOAK_VUS}
    local duration=${2:-$DEFAULT_SOAK_DURATION}
    
    log_info "Running Soak Test..."
    echo ""
    echo "Configuration:"
    echo "  VUs: $vus"
    echo "  Duration: $duration"
    echo ""
    
    SOAK_VUS=$vus SOAK_DURATION=$duration k6 run soak-test.js
    
    if [ $? -eq 0 ]; then
        log_success "Soak test completed successfully"
    else
        log_error "Soak test failed"
        return 1
    fi
}

# Run all tests
run_all() {
    log_info "Running all tests sequentially..."
    echo ""
    
    run_smoke || return 1
    echo ""
    echo "────────────────────────────────────────"
    echo ""
    
    run_load || return 1
    echo ""
    echo "────────────────────────────────────────"
    echo ""
    
    run_stress || return 1
    echo ""
    echo "────────────────────────────────────────"
    echo ""
    
    run_spike || return 1
    echo ""
    echo "────────────────────────────────────────"
    echo ""
    
    log_success "All tests completed!"
    echo ""
    echo "Results saved to: $OUTPUT_DIR/"
    echo ""
    echo "To view results:"
    echo "  cat $OUTPUT_DIR/*.json | jq"
    echo ""
}

# Show help
show_help() {
    show_header
    cat << EOF
Usage: $0 [command] [options]

Commands:
  smoke              Quick smoke test (10s, 5 VUs)
  load               Standard load test (2.5m, 10-100 VUs)
  stress             Stress test (8m, up to 500 VUs)
  spike              Spike test (2m, up to 300 VUs)
  soak               Soak test (10m, 100 VUs)
  all                Run all tests sequentially
  check              Check k6 installation and services
  help               Show this help message

Options:
  -v, --vus <n>          Override default VUs
  -d, --duration <time>  Override duration (soak test)
  -o, --output <dir>     Output directory (default: results)
  -q, --quiet            Minimal output

Examples:
  $0 smoke
  $0 stress -v 1000
  $0 soak -d 30m
  $0 check
  MAX_VUS=800 $0 stress

Environment Variables:
  AUTH_URL, PAYMENT_URL, etc.  - Service URLs
  MAX_VUS                      - Max VUs for stress test
  SOAK_VUS                     - VUs for soak test
  SOAK_DURATION                - Duration for soak test

EOF
}

# Parse arguments
COMMAND=${1:-help}
shift || true

VUS_OVERRIDE=""
DURATION_OVERRIDE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--vus)
            VUS_OVERRIDE="$2"
            shift 2
            ;;
        -d|--duration)
            DURATION_OVERRIDE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -q|--quiet)
            QUIET=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
show_header
check_k6
setup_output_dir

case $COMMAND in
    smoke)
        run_smoke
        ;;
    load)
        run_load
        ;;
    stress)
        run_stress "${VUS_OVERRIDE:-$DEFAULT_STRESS_VUS}"
        ;;
    spike)
        run_spike "${VUS_OVERRIDE:-$DEFAULT_SPIKE_VUS}"
        ;;
    soak)
        run_soak "${VUS_OVERRIDE:-$DEFAULT_SOAK_VUS}" "${DURATION_OVERRIDE:-$DEFAULT_SOAK_DURATION}"
        ;;
    all)
        run_all
        ;;
    check)
        check_services
        ;;
    help)
        show_help
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac
