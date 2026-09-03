# Contributing to OpenDots

Thank you for your interest in contributing to OpenDots. This document explains the setup process and contribution workflow.

## Prerequisites

- Git and GitHub
- Read about the project in [README.md](README.md)
- Basic knowledge of JavaScript or Python

## Clone the Repository

1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
git clone https://github.com/<your-username>/OpenDots.git
```
3. Navigate to the project directory:
```bash
cd OpenDots
```
4. Add the upstream repository:
```bash
git remote add upstream https://github.com/tjiuce/OpenDots.git
```

## Branch Naming Convention

Create a new branch for every contribution.

### DSCWoC Contributors
Branch name format:
```bash
DSCWoC-YourName
```

Example:
```bash
git checkout -b DSCWoC-Tejas
```

### Other Contributors
Use a meaningful name such as:
```bash
feature-dashboard
fix-websocket-bug
```

## Contribution Areas

- Frontend UI and dashboard customization
- Backend APIs and data integrations
- WebSocket-based live data handling
- AI and analytics modules
- Documentation improvements

## Commit Guidelines

- Keep commits small and focused
- Use clear commit messages
```bash
feat: add live dashboard refresh
fix: resolve websocket disconnect issue
```

## Pull Request Guidelines

- Push your branch to your fork
```bash
git push origin DSCWoC-YourName
```
- Open a pull request against the main branch
- Mention the related issue number in the PR description
- Add screenshots or logs where applicable

## Review Process

- Pull requests are reviewed daily
- Feedback will be provided via GitHub comments
- Requested changes should be addressed promptly

## Support

For questions or discussions, use GitHub [Issues](https://github.com/tjiuce/OpenDots/issues) or [Discussions](https://github.com/tjiuce/OpenDots/discussions/).
