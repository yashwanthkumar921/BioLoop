# 🌿 BioLoop — Urban Organic Nutrient & Carbon Traceability Platform

BioLoop is an end-to-end circular economy and ESG carbon offset tracking platform that connects commercial food waste generators (kitchens, cafes, bakeries) with regional processors (industrial composting facilities, bio-digesters) via verified carrier logistics.

---

## 🚀 Key Highlights & Architecture

- **Strict Chain-of-Custody**: Enforces state machine transitions:  
  `AVAILABLE` ➔ `CLAIMED` ➔ `IN_TRANSIT` (with QR handshake verification) ➔ `DELIVERED` ➔ `VERIFIED` / `REJECTED`.
- **EPA-Model Carbon Accounting**: Calculates real-time CO₂e avoided based on organic stream multipliers (Cooked Meat $1.3\times$, Vegetables $1.0\times$, Coffee Grounds $0.8\times$).
- **Verifiable Digital ESG Certificates**: Issues unique certificates (`BL-<QR_TOKEN>`) with complete audit event history and photo proofs.
- **Proximity Radar Map**: Interactive Leaflet geospatial map with variable search radius slider ($2\text{--}30\text{ km}$).
- **Modern UI**: Built with React 19, TypeScript, Vite, Lucide icons, glassmorphic styling, and interactive modal dialogs.
- **Enterprise Spring Boot 3 / Java 21 Backend**: Flyway migrations, stateless JWT authentication, and automated 60-second batch expiration scheduler.

---

## 🗄️ Database Configuration

Your PostgreSQL connection is configured in `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5433/demodb
spring.datasource.username=postgres
spring.datasource.password=root
spring.datasource.driver-class-name=org.postgresql.Driver
```

> **Note**: Make sure your PostgreSQL server is running on port `5433` and the database `demodb` is created before starting the backend.
> To create the database if not present, in PostgreSQL run:
> ```sql
> CREATE DATABASE demodb;
> ```

---

## ⚡ Quick Start

### 1. Start the Backend API (Port 8080)
Double-click `start-backend.bat` in the root folder, or run:
```bash
cd backend
mvn spring-boot:run
```

### 2. Start the Frontend UI (Port 5173)
Double-click `start-frontend.bat` in the root folder, or run:
```bash
cd frontend
pnpm dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 👥 Demo Personas (1-Click Login)

The system automatically pre-seeds demo accounts with realistic Hyderabad coordinates. You can switch between them with 1-click in the app:

| Persona | Organization | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `kitchen@greenleaf.demo` | **GreenLeaf Kitchen** | `GENERATOR` | Post organic waste batches, generate pickup QR token |
| `ops@urbancompost.demo` | **Urban Compost Hub** | `PROCESSOR` | View waste radar, claim batches, inspect & verify weight |
| `driver@bioloop.demo` | **Loop Rider 07** | `DRIVER` | Accept open transport jobs, scan pickup QR, mark delivery |
| `audit@bioloop.demo` | **BioLoop Admin** | `ADMIN` | Full network oversight, audit trails, and ESG registry |

*Default password for demo accounts:* `password123`

---

## 📁 Project Structure

```
Biolopp2/
├── backend/                  # Java 21 / Spring Boot API
│   ├── src/main/java/com/bioloop/
│   │   ├── domain/           # JPA Entities (AppUser, WasteBatch, WasteTransaction, ProofUpload)
│   │   ├── service/          # BatchWorkflowService, CarbonCreditService, ProofUploadService
│   │   ├── repository/       # Spring Data JPA repositories with Haversine distance
│   │   ├── security/         # Stateless JWT filter & user details
│   │   └── web/              # BatchController, AuthController, FileController
│   └── src/main/resources/   # application.properties & Flyway migrations
├── frontend/                 # React 19 + TypeScript + Vite
│   ├── src/components/       # WasteMap, ClaimHub, JobsPipeline, VerificationModal, etc.
│   ├── src/api.ts            # Type-safe API client
│   └── src/index.css         # Modern dark eco-tech stylesheet
├── start-backend.bat         # 1-Click backend launcher
├── start-frontend.bat        # 1-Click frontend launcher
└── docker-compose.yml        # Optional Docker PostGIS setup
```

