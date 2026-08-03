# OpenDots <img src="src/assets/images/OpenDots.png" height=50px align=right id="project-logo">

###### AI • IoT • Data Analytics Platform

![Visitors](https://api.visitorbadge.io/api/visitors?path=multiverseweb2%2OpenDots%20&countColor=%23263759&style=flat&initial=5767)
  ![License](https://img.shields.io/badge/License-MIT-4e3eb5)
  ![Languages](https://img.shields.io/github/languages/count/multiverseweb/OpenDots?color=20B2AA)
  ![GitHub Repo stars](https://img.shields.io/github/stars/multiverseweb/OpenDots)
  ![GitHub contributors](https://img.shields.io/github/contributors/multiverseweb/OpenDots)
  ![GitHub issues](https://img.shields.io/github/issues/multiverseweb/OpenDots)
  ![GitHub closed issues](https://img.shields.io/github/issues-closed-raw/multiverseweb/OpenDots)
  ![GitHub forks](https://img.shields.io/github/forks/multiverseweb/OpenDots)
  ![GitHub pull requests](https://img.shields.io/github/issues-pr/multiverseweb/OpenDots)
  ![GitHub closed pull requests](https://img.shields.io/github/issues-pr-closed/multiverseweb/OpenDots)
  ![GitHub last commit](https://img.shields.io/github/last-commit/multiverseweb/OpenDots)
  ![GitHub repo size](https://img.shields.io/github/repo-size/multiverseweb/OpenDots)
  ![GitHub total lines](https://sloc.xyz/github/multiverseweb/OpenDots)
  <a href="https://multiverseweb.github.io/OpenDots/"><img alt="Website" src="https://img.shields.io/website?url=https%3A%2F%2Fmultiverseweb.github.io/OpenDots%2F&up_message=awake&up_color=%2300d18f&down_message=asleep&down_color=red&style=flat">
</a>

---

OpenDots is an open-source, integrated IoT data visualization and insight platform that helps users turn raw sensor data into meaningful, real-time visuals and AI-powered insights. It is designed to be hardware-agnostic, data-first, and easy to extend for contributors.

## Preview

<img width="1919" height="969" alt="image" src="https://github.com/user-attachments/assets/77f0d34c-04a9-423d-a08f-dfeec7afa105" />

## Overview

OpenDots allows users to collect, visualize, and analyze live data from multiple IoT sources in one unified platform. Instead of building separate systems for data ingestion, dashboards, and analysis, OpenDots combines everything into a single workflow.

Users can create highly customizable dashboards, publish sharable project sites, monitor live data streams, and interact with their data using AI-based insights.

## Key Features

- Highly customizable dashboards with flexible layouts and visualizations  
- Live data logs and real-time visualizations using WebSockets  
- Sharable public project websites for collaboration and showcase  
- Support for Arduino-based systems and popular IoT platforms  
- Integration with ThingSpeak, Adafruit IO, Blynk, and Grafana  
- Support for live camera feeds and video streams  
- Chat-based AI insights for trends, summaries, and anomaly detection  

## System Architecture

```mermaid
graph TD
    subgraph Sensors & Data Sources
        Arduino[Arduino / Microcontrollers]
        ThingSpeak[ThingSpeak API]
        Adafruit[Adafruit IO]
        Blynk[Blynk IoT]
        Grafana[Grafana Data Sources]
        Cam[Live Camera Streams]
    end

    subgraph OpenDots Core Engine
        Ingestion[Data Ingestion Service]
        WebSocket[WebSocket Gateway]
        Express[Node.js / Express Backend]
        DB[(MongoDB Database)]
        AI[AI & LLM Analytics Service]
    end

    subgraph User Interface
        Dashboard[React.js Real-time Dashboard]
        PublicSite[Sharable Project Sites]
        AIChat[AI Insights & Anomaly Chat]
    end

    Arduino --> Ingestion
    ThingSpeak --> Ingestion
    Adafruit --> Ingestion
    Blynk --> Ingestion
    Grafana --> Ingestion
    Cam --> Ingestion

    Ingestion --> WebSocket
    WebSocket --> Express
    Express <--> DB
    Express <--> AI

    WebSocket --> Dashboard
    Express --> PublicSite
    AI --> AIChat
```

## Tech Stack

| Layer | Technologies |
|------|-------------|
| Frontend | HTML, CSS, JavaScript, React.js |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Real-time Communication | WebSockets |
| IoT & Data Sources | Arduino, ThingSpeak, Adafruit IO, Blynk, Grafana |
| AI & Analytics | Python, AI/LLM integration |
| Authentication | Firebase Authentication, JWT |
| DevOps & CI/CD | GitHub, GitHub Actions |
| Deployment | Vercel, Netlify, Cloud hosting |

## Installation & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) instance (local or MongoDB Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/multiverseweb/OpenDots.git
cd OpenDots
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/opendots
JWT_SECRET=your_jwt_secret_key
FIREBASE_API_KEY=your_firebase_api_key
```

### 4. Launch Application
```bash
# Start backend server & frontend dev environment
npm run dev
```
Open `http://localhost:3000` in your browser.

### 5. Connecting IoT Telemetry
- Configure sensor nodes to push WebSocket payloads to `ws://localhost:5000/api/v1/stream`.
- Enter your ThingSpeak / Adafruit IO credentials in the dashboard integrations panel to auto-sync channels.

## Use Cases

- Student and academic IoT projects  
- Environmental and community monitoring  
- Research data visualization  
- Smart systems dashboards  
- Social-impact and open-data projects



### Star History

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="
      https://api.star-history.com/svg?repos=multiverseweb/OpenDots&type=Date&theme=dark
    "
  />
  
  <source
    media="(prefers-color-scheme: light)"
    srcset="
      https://api.star-history.com/svg?repos=multiverseweb/OpenDots&type=Date
    "
  />
  <img
    alt="Star History Chart"
    src="https://api.star-history.com/svg?repos=multiverseweb/OpenDots&type=Date&theme=dark"
  />
</picture>

---

### Our Valuable Contributors ❤️

[![Contributors](https://contrib.rocks/image?repo=multiverseweb/OpenDots)](https://github.com/multiverseweb/OpenDots/graphs/contributors)

### Stargazers ⭐

<div align='left'>

[![Stargazers repo roster for @multiverseweb/OpenDots](https://reporoster.com/stars/dark/multiverseweb/OpenDots)](https://github.com/multiverseweb/OpenDots/stargazers)

</div>

### Forkers 🍴

[![Forkers repo roster for @multiverseweb/OpenDots](https://reporoster.com/forks/dark/multiverseweb/OpenDots)](https://github.com/multiverseweb/OpenDots/network/members)


## Maintainer

[Tejas Gupta](https://www.tejasgupta.work)
