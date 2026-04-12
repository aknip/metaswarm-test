#!/usr/bin/env bash
# metaswarm command shims — high-frequency project commands

# Testing
alias mt="npm test"
alias mtc="npm run test:cov"
alias mtw="npm run test -- --watch"

# Development
alias md="npm run dev"
alias mb="npm run build"

# Quality
alias ml="npm run lint"
alias mf="npm run format"
alias mtc="npm run typecheck"

# Git shortcuts
alias gs="git status"
alias gd="git diff"
alias gl="git log --oneline -20"
