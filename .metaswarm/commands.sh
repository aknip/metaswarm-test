#!/usr/bin/env bash
# metaswarm command shims for metaswarm-test
# Source: .metaswarm/commands.sh

# Quality gates - run all checks in sequence
quality-check() {
  echo "Running quality gates..."
  npm run typecheck && \
  npm run lint && \
  npm run format && \
  npm test && \
  npm run build
  echo "Quality gates complete."
}

# Full verification including E2E
full-verify() {
  quality-check && npm run test:e2e
}

# Development servers
dev-all() {
  echo "Start backend: npm run dev"
  echo "Start frontend: npm run dev:client"
  echo "(Run these in separate terminals)"
}
