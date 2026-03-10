# YaSwarm Agency Quickstart

## 1) Install

```bash
curl -fsSL https://raw.githubusercontent.com/YaRepo/yaswarm-agency/main/install.sh | bash
```

Or local clone:

```bash
git clone https://github.com/YaRepo/yaswarm-agency
cd yaswarm-agency
./install.sh
```

## 2) Setup

```bash
yaswarm setup
```

The setup wizard will prompt for:
- GitHub owner/org
- Workspace path
- Optional API keys and bot tokens

## 3) Start stack

```bash
yaswarm up
```

## 4) Verify

```bash
yaswarm doctor
yaswarm release-info
```

## 5) Create your first project repo

```bash
yaswarm init-project my-first-project
```

Defaults to private visibility.
