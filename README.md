# api-gateway-microservices-system

A backend microservices project built around an API Gateway pattern.  
This system includes separate services for authentication, task management, and file handling, all communicating through REST APIs.

## 📌 Project Goal

The goal of this project is to:

- Learn backend architecture using microservices
- Implement an API Gateway as a single entry point
- Build isolated services for Auth, Tasks, and Files
- Understand inter-service communication
- Containerize everything using Docker
- Deploy the system in a real containerized environment

---

## 🏗 Architecture Overview

Client → API Gateway → Microservices

Services:

- **API Gateway** – Routes requests and handles token validation
- **Auth Service** – User registration, login, JWT generation
- **Task Service** – CRUD operations for user tasks
- **File Service** – File upload, download, and metadata handling

Each service runs independently and communicates via HTTP REST APIs.

---

## 🛠 Tech Stack (Planned)

- Backend: (Node.js / FastAPI / Go – TBD)
- Database: PostgreSQL
- Authentication: JWT
- Containerization: Docker & Docker Compose

---

## 🎯 Learning Focus

This project focuses on:

- REST API design
- JWT-based authentication flow
- Service isolation
- API Gateway routing
- Inter-service communication
- Docker networking and container orchestration

---

## 🚀 Deployment Plan

The system will be containerized using Docker and deployed on a cloud VPS using Docker Compose.

---

## 📂 Repository Structure


/gateway  
/auth-service  
/task-service  
/file-service  
docker-compose.yml


---

This project is being built as a hands-on learning experience in backend architecture and containerize