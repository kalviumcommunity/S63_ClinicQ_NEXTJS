# MediQueue - High Level Design (HLD)

## 1. System Overview

MediQueue is a web-based hospital queue management system that digitizes the patient queuing process, enabling real-time queue monitoring, SMS notifications, and efficient patient flow management.

### 1.1 System Objectives
- Eliminate physical queues in hospital waiting rooms
- Provide real-time queue status visibility to patients
- Enable efficient queue management for hospital staff
- Generate analytics for hospital administration
- Minimize infrastructure and operational costs

---

## 2. System Architecture

### 2.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Patient    │  │    Staff     │  │    Admin     │          │
│  │   Portal     │  │   Portal     │  │   Portal     │          │
│  │  (Web/PWA)   │  │  (Web/PWA)   │  │  (Web/PWA)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             │ HTTPS/REST
                             │
┌────────────────────────────┼──────────────────────────────────────┐
│                   APPLICATION LAYER (Next.js)                     │
├────────────────────────────┼──────────────────────────────────────┤
│                            │                                       │
│  ┌─────────────────────────▼────────────────────────────┐        │
│  │              Next.js App Router                       │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │        │
│  │  │  Pages   │  │    API   │  │Components│           │        │
│  │  │ (Routes) │  │  Routes  │  │  (UI)    │           │        │
│  │  └──────────┘  └──────────┘  └──────────┘           │        │
│  └────────────────────────────────────────────────────────┘       │
│                            │                                       │
│  ┌─────────────────────────▼────────────────────────────┐        │
│  │           Business Logic Layer                        │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │        │
│  │  │  Queue   │  │   SMS    │  │  Auth    │           │        │
│  │  │  Utils   │  │  Service │  │  Service │           │        │
│  │  └──────────┘  └──────────┘  └──────────┘           │        │
│  └────────────────────────────────────────────────────────┘       │
│                            │                                       │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
┌────────────────▼──────┐   ┌────────────▼─────────┐
│   DATA LAYER          │   │  EXTERNAL SERVICES   │
├───────────────────────┤   ├──────────────────────┤
│                       │   │                      │
│  ┌─────────────────┐ │   │  ┌────────────────┐ │
│  │   PostgreSQL    │ │   │  │  SMS Gateway   │ │
│  │   (Supabase)    │ │   │  │ (Twilio/MSG91) │ │
│  │                 │ │   │  └────────────────┘ │
│  │ ┌─────────────┐ │ │   │                      │
│  │ │ Departments │ │ │   └──────────────────────┘
│  │ │   Queues    │ │ │
│  │ │   Tokens    │ │ │
│  │ │   Staff     │ │ │
│  │ │ Statistics  │ │ │
│  │ └─────────────┘ │ │
│  │                 │ │
│  │ ┌─────────────┐ │ │
│  │ │  Realtime   │ │ │
│  │ │ Subscriptions│ │ │
│  │ └─────────────┘ │ │
│  └─────────────────┘ │
│                       │
└───────────────────────┘
```

### 2.2 Architecture Layers

#### Client Layer
- **Patient Portal**: Token generation, queue status checking
- **Staff Portal**: Queue management, calling next patient
- **Admin Portal**: Analytics, configuration, staff management
- **Display Screen**: Public queue status display

#### Application Layer
- **Next.js Framework**: Server-side rendering, API routes
- **React Components**: Reusable UI components
- **Business Logic**: Queue algorithms, validation, calculations

#### Data Layer
- **PostgreSQL Database**: Persistent storage via Supabase
- **Realtime Engine**: WebSocket-based live updates

#### External Services
- **SMS Gateway**: Patient notifications
- **Authentication**: Secure staff/admin access

---

## 3. Component Design

### 3.1 Major Components

```
┌─────────────────────────────────────────────────────────┐
│                    PATIENT PORTAL                        │
├─────────────────────────────────────────────────────────┤
│  • Token Generation Form                                 │
│  • Department Selection                                  │
│  • Queue Status Checker                                  │
│  • Real-time Position Updates                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     STAFF PORTAL                         │
├─────────────────────────────────────────────────────────┤
│  • Authentication Module                                 │
│  • Queue Management Dashboard                            │
│  • Call Next Patient Interface                           │
│  • Token Status Management                               │
│  • Priority Token Generation                             │
│  • Queue Pause/Resume Controls                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     ADMIN PORTAL                         │
├─────────────────────────────────────────────────────────┤
│  • Dashboard & Analytics                                 │
│  • Department Management (CRUD)                          │
│  • Staff Management (CRUD)                               │
│  • System Settings Configuration                         │
│  • Reports Generation (Daily/Weekly/Monthly)             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   DISPLAY SCREEN                         │
├─────────────────────────────────────────────────────────┤
│  • Current Token Display                                 │
│  • Multi-department View                                 │
│  • Auto-refresh Mechanism                                │
│  • Voice Announcement (Optional)                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 CORE SERVICES LAYER                      │
├─────────────────────────────────────────────────────────┤
│  • Queue Management Service                              │
│  • Token Generation Service                              │
│  • SMS Notification Service                              │
│  • Authentication Service                                │
│  • Analytics Service                                     │
│  • Realtime Update Service                               │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow Diagrams

### 4.1 Token Generation Flow

```
Patient                  Application              Database           SMS Service
  │                          │                       │                    │
  │ 1. Fill Form             │                       │                    │
  ├─────────────────────────>│                       │                    │
  │                          │                       │                    │
  │                          │ 2. Validate Data      │                    │
  │                          │                       │                    │
  │                          │ 3. Get/Create Queue   │                    │
  │                          ├──────────────────────>│                    │
  │                          │<──────────────────────┤                    │
  │                          │                       │                    │
  │                          │ 4. Generate Token #   │                    │
  │                          │                       │                    │
  │                          │ 5. Save Token         │                    │
  │                          ├──────────────────────>│                    │
  │                          │<──────────────────────┤                    │
  │                          │                       │                    │
  │                          │ 6. Send SMS           │                    │
  │                          ├───────────────────────┼───────────────────>│
  │                          │                       │                    │
  │ 7. Display Token         │                       │                    │
  │<─────────────────────────┤                       │                    │
  │                          │                       │                    │
  │ 8. Receive SMS           │                       │                    │
  │<────────────────────────────────────────────────────────────────────┤
  │                          │                       │                    │
```

### 4.2 Queue Management Flow

```
Staff                   Application              Database           Display Screen
  │                          │                       │                    │
  │ 1. Click "Call Next"     │                       │                    │
  ├─────────────────────────>│                       │                    │
  │                          │                       │                    │
  │                          │ 2. Get Next Token     │                    │
  │                          ├──────────────────────>│                    │
  │                          │<──────────────────────┤                    │
  │                          │                       │                    │
  │                          │ 3. Update Status      │                    │
  │                          ├──────────────────────>│                    │
  │                          │                       │                    │
  │                          │ 4. Broadcast Update   │                    │
  │                          │                       ├───────────────────>│
  │                          │                       │                    │
  │ 5. Show Patient Info     │                       │ 5. Update Display  │
  │<─────────────────────────┤                       │                    │
  │                          │                       │                    │
```

### 4.3 Realtime Update Flow

```
Database Change          Supabase Realtime         Subscribed Clients
      │                        │                          │
      │ 1. Token Status        │                          │
      │    Changed             │                          │
      ├───────────────────────>│                          │
      │                        │                          │
      │                        │ 2. Broadcast Event       │
      │                        ├─────────────────────────>│
      │                        │                          │
      │                        │                          │ 3. Update UI
      │                        │                          │    (Display/Portal)
      │                        │                          │
```

---

## 5. Database Design

### 5.1 Entity Relationship Diagram

```
┌─────────────────┐
│  DEPARTMENTS    │
├─────────────────┤
│ PK id           │
│    name         │───┐
│    code         │   │
│    avg_service  │   │
│    _time        │   │
└─────────────────┘   │
                      │ 1:N
                      │
                      ▼
            ┌─────────────────┐         ┌─────────────────┐
            │    COUNTERS     │         │     QUEUES      │
            ├─────────────────┤         ├─────────────────┤
            │ PK id           │         │ PK id           │
            │ FK department_id│◄────────│ FK department_id│
            │    counter_num  │         │    date         │
            │    counter_code │         │    current_#    │
            └─────────────────┘         │    is_paused    │
                      │                 └─────────────────┘
                      │                          │
                      │ 1:N                      │ 1:N
                      │                          │
                      │                          │
                      ▼                          ▼
            ┌──────────────────────────────────────┐
            │             TOKENS                   │
            ├──────────────────────────────────────┤
            │ PK id                                │
            │ FK queue_id                          │
            │ FK counter_id                        │
            │    token_number                      │
            │    patient_name                      │
            │    patient_phone                     │
            │    status (waiting/called/served)    │
            │    is_priority                       │
            │    created_at, served_at             │
            └──────────────────────────────────────┘
                             │
                             │ 1:N
                             │
                             ▼
                    ┌─────────────────┐
                    │    SMS_LOGS     │
                    ├─────────────────┤
                    │ PK id           │
                    │ FK token_id     │
                    │    phone        │
                    │    message      │
                    │    sms_type     │
                    │    status       │
                    └─────────────────┘

┌─────────────────┐
│     STAFF       │
├─────────────────┤
│ PK id           │
│    name         │
│    email        │
│    password_hash│
│    role         │
│ FK department_id│
└─────────────────┘

┌─────────────────┐
│ DAILY_STATS     │
├─────────────────┤
│ PK id           │
│ FK department_id│
│    date         │
│    total_tokens │
│    avg_wait_time│
│    peak_hours   │
└─────────────────┘
```

### 5.2 Key Tables

**departments**: Hospital departments (OPD, X-Ray, etc.)  
**counters**: Service counters within departments  
**queues**: Daily queue instances per department  
**tokens**: Individual patient tokens with status  
**staff**: Hospital staff with role-based access  
**sms_logs**: Audit trail of all SMS sent  
**daily_statistics**: Aggregated performance metrics  

---

## 6. API Design

### 6.1 REST API Endpoints

```
┌─────────────────────────────────────────────────────────────┐
│                    PATIENT APIs                              │
├─────────────────────────────────────────────────────────────┤
│ POST   /api/tokens/generate       Generate new token        │
│ GET    /api/tokens/status         Check queue position      │
│ GET    /api/departments            List active departments  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     STAFF APIs                               │
├─────────────────────────────────────────────────────────────┤
│ POST   /api/auth/login            Staff authentication      │
│ POST   /api/queue/call-next       Call next patient         │
│ PUT    /api/tokens/update-status  Update token status       │
│ POST   /api/queue/pause           Pause queue               │
│ POST   /api/queue/resume          Resume queue              │
│ POST   /api/tokens/priority       Generate priority token   │
│ GET    /api/queue/current         Get current queue state   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     ADMIN APIs                               │
├─────────────────────────────────────────────────────────────┤
│ GET    /api/analytics/dashboard   Dashboard statistics      │
│ GET    /api/analytics/daily       Daily reports             │
│ GET    /api/analytics/weekly      Weekly reports            │
│ POST   /api/departments/create    Create department         │
│ PUT    /api/departments/:id       Update department         │
│ DELETE /api/departments/:id       Delete department         │
│ POST   /api/staff/create          Create staff account      │
│ PUT    /api/staff/:id             Update staff              │
│ GET    /api/settings              Get system settings       │
│ PUT    /api/settings              Update settings           │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 WebSocket Events (Realtime)

```
┌─────────────────────────────────────────────────────────────┐
│                  REALTIME EVENTS                             │
├─────────────────────────────────────────────────────────────┤
│ token_created        New token generated                    │
│ token_called         Patient called to counter              │
│ token_served         Patient consultation complete          │
│ token_no_show        Patient didn't respond                 │
│ queue_paused         Queue paused by staff                  │
│ queue_resumed        Queue resumed                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Security Architecture

### 7.1 Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PUBLIC ACCESS (No Auth Required)                           │
│  ├─ Token Generation                                        │
│  ├─ Queue Status Checking                                   │
│  └─ Display Screen                                          │
│                                                              │
│  STAFF ACCESS (Session-based Auth)                          │
│  ├─ Queue Management                                        │
│  ├─ Call Next Patient                                       │
│  └─ Token Status Updates                                    │
│                                                              │
│  ADMIN ACCESS (Role-based Auth)                             │
│  ├─ Full Staff Permissions +                                │
│  ├─ Analytics & Reports                                     │
│  ├─ Department Management                                   │
│  ├─ Staff Management                                        │
│  └─ System Configuration                                    │
│                                                              │
│  SUPER ADMIN (Root Access)                                  │
│  └─ All Admin Permissions + Database Access                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Data Security

- **Password Hashing**: bcrypt for staff passwords
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **Row Level Security**: Supabase RLS policies
- **HTTPS**: All communications encrypted
- **Environment Variables**: Sensitive data in .env files
- **API Rate Limiting**: Prevent abuse

---

## 8. Scalability & Performance

### 8.1 Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                 OPTIMIZATION STRATEGIES                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DATABASE LAYER                                              │
│  ├─ Indexed columns (token_number, phone, status)           │
│  ├─ Database views for common queries                       │
│  ├─ Query optimization                                      │
│  └─ Connection pooling                                      │
│                                                              │
│  APPLICATION LAYER                                           │
│  ├─ Server-side rendering (Next.js)                         │
│  ├─ API response caching                                    │
│  ├─ Static page generation                                  │
│  └─ Code splitting                                          │
│                                                              │
│  CLIENT LAYER                                                │
│  ├─ Lazy loading components                                 │
│  ├─ Image optimization                                      │
│  ├─ Minimal JavaScript bundle                               │
│  └─ Progressive Web App (PWA) caching                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Scalability Considerations

**Horizontal Scaling**
- Vercel auto-scales based on traffic
- Supabase connection pooling handles concurrent requests
- Stateless API design enables load balancing

**Vertical Scaling**
- Database can upgrade to larger instances
- Supabase offers multiple pricing tiers

**Expected Load**
- Small hospital: 100-200 tokens/day
- Medium hospital: 500-1000 tokens/day
- Current design handles up to 10,000 tokens/day

---

## 9. Technology Stack Details

### 9.1 Frontend Stack

```
┌─────────────────────────────────────────────────────────────┐
│  Framework       Next.js 14 (App Router)                    │
│  UI Library      React 18                                   │
│  Language        TypeScript                                 │
│  Styling         Tailwind CSS                               │
│  State Mgmt      React Hooks (useState, useEffect)          │
│  HTTP Client     Fetch API                                  │
│  Real-time       Supabase Realtime Client                   │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Backend Stack

```
┌─────────────────────────────────────────────────────────────┐
│  Runtime         Node.js                                    │
│  Framework       Next.js API Routes                         │
│  Database        PostgreSQL (via Supabase)                  │
│  ORM             Supabase Client Library                    │
│  Authentication  NextAuth.js                                │
│  SMS Service     Twilio / MSG91 / Fast2SMS                  │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│  Hosting         Vercel (Serverless)                        │
│  Database        Supabase (Managed PostgreSQL)              │
│  CDN             Vercel Edge Network                        │
│  SSL/TLS         Automatic (Vercel)                         │
│  DNS             Vercel DNS                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Deployment Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                      PRODUCTION ENVIRONMENT                    │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │               Vercel Edge Network                      │    │
│  │  ┌──────────────────────────────────────────────┐    │    │
│  │  │        Next.js Application                    │    │    │
│  │  │  ┌────────────┐  ┌────────────┐             │    │    │
│  │  │  │   Pages    │  │  API Routes│             │    │    │
│  │  │  └────────────┘  └────────────┘             │    │    │
│  │  └──────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────┘    │
│                            │                                   │
│                            │ HTTPS                             │
│                            │                                   │
│  ┌─────────────────────────▼──────────────────────────────┐  │
│  │              Supabase (Cloud)                           │  │
│  │  ┌──────────────────────────────────────────────┐     │  │
│  │  │          PostgreSQL Database                  │     │  │
│  │  └──────────────────────────────────────────────┘     │  │
│  │  ┌──────────────────────────────────────────────┐     │  │
│  │  │          Realtime Engine                      │     │  │
│  │  └──────────────────────────────────────────────┘     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         Third-party Services                            │  │
│  │  ┌──────────────┐  ┌──────────────┐                   │  │
│  │  │   Twilio     │  │   MSG91      │                   │  │
│  │  │   (SMS)      │  │   (SMS)      │                   │  │
│  │  └──────────────┘  └──────────────┘                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

---

## 11. System Interfaces

### 11.1 External Interfaces

**SMS Gateway Interface**
- Protocol: HTTPS/REST
- Format: JSON
- Purpose: Send SMS notifications to patients

**Database Interface**
- Protocol: PostgreSQL wire protocol
- Library: Supabase JavaScript client
- Purpose: All data persistence operations

**Realtime Interface**
- Protocol: WebSocket
- Purpose: Push real-time updates to clients

### 11.2 User Interfaces

**Patient Interface**
- Web-based responsive design
- Mobile-first approach
- Simple, large fonts
- Minimal input fields

**Staff Interface**
- Dashboard with queue overview
- Large action buttons
- Real-time updates
- Minimal clicks to perform actions

**Admin Interface**
- Analytics dashboard with charts
- CRUD forms for management
- Report generation tools
- System configuration panels

**Display Interface**
- Full-screen, auto-refresh
- Large, readable fonts
- Color-coded status
- Multi-department support

---

## 12. Non-Functional Requirements

### 12.1 Performance

- **Response Time**: < 2 seconds for all operations
- **Page Load**: < 3 seconds on 3G connection
- **Real-time Latency**: < 1 second for updates
- **SMS Delivery**: < 30 seconds

### 12.2 Availability

- **Uptime**: 99.9% (managed by Vercel/Supabase SLA)
- **Backup**: Automated daily database backups
- **Recovery**: Point-in-time recovery available

### 12.3 Reliability

- **Data Integrity**: ACID-compliant database
- **Error Handling**: Graceful degradation
- **Failover**: Automatic retry mechanisms
- **Logging**: Comprehensive error and access logs

### 12.4 Usability

- **Learning Curve**: < 5 minutes for patients
- **Accessibility**: WCAG 2.1 Level AA compliance
- **Language**: English (extensible to Hindi/regional)
- **Device Support**: All modern browsers, mobile devices

### 12.5 Maintainability

- **Code Quality**: TypeScript for type safety
- **Documentation**: Inline code comments, README
- **Modularity**: Component-based architecture
- **Testing**: Unit and integration tests

---

## 13. Assumptions & Constraints

### 13.1 Assumptions

- Patients have access to mobile phones
- Hospital has stable internet connection
- Staff have basic computer literacy
- Electricity backup available for displays

### 13.2 Constraints

- Must work on 2G/3G networks
- SMS character limit: 160 characters
- Database size limit (Supabase free tier): 500MB
- API rate limits as per provider

---

## 14. Future Enhancements

### Phase 2
- Appointment pre-booking system
- Patient history tracking
- Prescription management
- Payment integration

### Phase 3
- Mobile app (React Native)
- WhatsApp bot integration
- Multi-language support
- AI-based wait time prediction
- Integration with hospital management systems

---

## 15. Glossary

**Token**: Unique queue number assigned to patient  
**Queue**: Collection of tokens for a department on a given day  
**Counter**: Service point where patients are attended  
**Department**: Hospital division (OPD, X-Ray, etc.)  
**Priority Token**: Emergency token that bypasses regular queue  
**No-Show**: Patient who doesn't respond when called  

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Authors**: Anuj Goyal, Parv Jhanwar, Suhaan Sharma