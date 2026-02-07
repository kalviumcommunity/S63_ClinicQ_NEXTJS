# MediQueue - Low Level Design (LLD)

## 1. Document Overview

This Low Level Design document provides detailed implementation specifications for the MediQueue system, including class diagrams, sequence diagrams, algorithm details, and code-level design decisions.

---

## 2. Module-wise Detailed Design

### 2.1 Token Generation Module

#### 2.1.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TokenGenerationService                    │
├─────────────────────────────────────────────────────────────┤
│ - supabaseClient: SupabaseClient                            │
│ - smsService: SMSService                                     │
├─────────────────────────────────────────────────────────────┤
│ + generateToken(request: TokenRequest): Promise<Token>      │
│ + validatePatientData(data: PatientData): boolean           │
│ + getNextSequenceNumber(queueId: string): Promise<number>   │
│ + createTokenNumber(dept: string, counter: string,          │
│                     seq: number): string                     │
│ + calculateWaitTime(position: number, avgTime: number): int │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ uses
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       QueueService                           │
├─────────────────────────────────────────────────────────────┤
│ - supabaseClient: SupabaseClient                            │
├─────────────────────────────────────────────────────────────┤
│ + getTodayQueue(deptId: string): Promise<Queue>             │
│ + createQueue(deptId: string, date: Date): Promise<Queue>   │
│ + getQueuePosition(tokenId: string): Promise<number>        │
│ + incrementTokenCounter(queueId: string): Promise<void>     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ uses
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        SMSService                            │
├─────────────────────────────────────────────────────────────┤
│ - provider: SMSProvider                                      │
│ - config: SMSConfig                                          │
├─────────────────────────────────────────────────────────────┤
│ + sendTokenGeneratedSMS(phone: string, token: Token): bool  │
│ + sendReminderSMS(phone: string, token: Token): bool        │
│ + sendYourTurnSMS(phone: string, token: Token): bool        │
│ + formatPhoneNumber(phone: string): string                  │
│ + logSMS(tokenId: string, message: string, status): void    │
└─────────────────────────────────────────────────────────────┘
```

#### 2.1.2 Sequence Diagram - Token Generation

```
Patient      API Route     TokenService    QueueService    Database    SMSService
  │              │               │               │             │            │
  │─Submit Form─>│               │               │             │            │
  │              │               │               │             │            │
  │              │─Validate─────>│               │             │            │
  │              │               │               │             │            │
  │              │               │─Get Queue────>│             │            │
  │              │               │               │─Query──────>│            │
  │              │               │               │<─Queue──────│            │
  │              │               │<─Queue────────│             │            │
  │              │               │               │             │            │
  │              │               │─Get Counter───────────────>│             │
  │              │               │<─Counter───────────────────│             │
  │              │               │               │             │            │
  │              │               │─Generate Token#             │            │
  │              │               │               │             │            │
  │              │               │─Save Token────────────────>│             │
  │              │               │<─Token─────────────────────│             │
  │              │               │               │             │            │
  │              │               │─Update Queue──────────────>│             │
  │              │               │<─Success───────────────────│             │
  │              │               │               │             │            │
  │              │               │─Get Position──>│            │            │
  │              │               │<─Position───────│           │            │
  │              │               │               │             │            │
  │              │               │─Send SMS──────────────────────────────>│
  │              │               │               │             │            │
  │              │               │─Log SMS────────────────────>│            │
  │              │<─Response─────│               │             │            │
  │<─Display─────│               │               │             │            │
  │              │               │               │             │            │
```

#### 2.1.3 Algorithm - Token Number Generation

```typescript
Algorithm: generateTokenNumber(departmentCode, counterCode, sequence)

Input:
  - departmentCode: string (e.g., "OPD")
  - counterCode: string (e.g., "A")
  - sequence: integer (e.g., 42)

Output:
  - tokenNumber: string (e.g., "OPD-A-042")

Steps:
  1. Validate inputs
     IF departmentCode is empty OR counterCode is empty OR sequence < 1
        THROW ValidationError

  2. Pad sequence number to 3 digits
     paddedSequence = sequence.toString().padStart(3, '0')

  3. Construct token number
     tokenNumber = departmentCode + "-" + counterCode + "-" + paddedSequence

  4. Return tokenNumber

Example:
  generateTokenNumber("OPD", "A", 42) → "OPD-A-042"
  generateTokenNumber("XRAY", "B", 5) → "XRAY-B-005"
```

#### 2.1.4 Algorithm - Wait Time Calculation

```typescript
Algorithm: calculateWaitTime(queuePosition, avgServiceTimeMinutes)

Input:
  - queuePosition: integer (patient's position in queue)
  - avgServiceTimeMinutes: integer (average service time per patient)

Output:
  - estimatedWaitMinutes: integer

Steps:
  1. Calculate base wait time
     baseWaitTime = (queuePosition - 1) * avgServiceTimeMinutes

  2. Add buffer for realistic estimates (20%)
     buffer = baseWaitTime * 0.2

  3. Calculate total wait time
     totalWaitTime = baseWaitTime + buffer

  4. Round up to nearest minute
     estimatedWaitMinutes = Math.ceil(totalWaitTime)

  5. Return estimatedWaitMinutes

Example:
  calculateWaitTime(10, 15) 
  → baseWaitTime = 9 * 15 = 135 minutes
  → buffer = 135 * 0.2 = 27 minutes
  → total = 162 minutes (2 hours 42 minutes)
```

#### 2.1.5 Data Structures

```typescript
// Token Request Structure
interface TokenGenerationRequest {
  patient_name: string;          // Min 2 chars, max 100 chars
  patient_phone: string;          // 10 digits, validated
  patient_age?: number;           // Optional, 0-120
  visit_reason?: string;          // Optional, max 500 chars
  department_id: string;          // UUID, must exist
  is_priority?: boolean;          // Default: false
}

// Token Response Structure
interface TokenGenerationResponse {
  success: boolean;
  token?: {
    id: string;                   // UUID
    token_number: string;         // Format: DEPT-CTR-NUM
    token_sequence: number;
    patient_name: string;
    patient_phone: string;
    department_name: string;
    department_code: string;
    counter_code: string;
    status: TokenStatus;
    created_at: string;           // ISO timestamp
  };
  queue_position?: number;        // Position in queue
  estimated_wait_minutes?: number;
  error?: string;
}

// Token Status Enum
enum TokenStatus {
  WAITING = 'waiting',
  CALLED = 'called',
  SERVING = 'serving',
  SERVED = 'served',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled'
}
```

---

### 2.2 Queue Management Module

#### 2.2.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   QueueManagementService                     │
├─────────────────────────────────────────────────────────────┤
│ - supabaseClient: SupabaseClient                            │
│ - realtimeService: RealtimeService                          │
│ - smsService: SMSService                                     │
├─────────────────────────────────────────────────────────────┤
│ + callNextPatient(queueId, counterId, staffId): Token       │
│ + updateTokenStatus(tokenId, status, staffId): Token        │
│ + pauseQueue(queueId, message, resumeTime): void            │
│ + resumeQueue(queueId): void                                 │
│ + generatePriorityToken(patientData, deptId): Token         │
│ + markNoShow(tokenId): void                                  │
│ + getQueueStatus(queueId): QueueStatus                       │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2.2 Sequence Diagram - Call Next Patient

```
Staff       API Route    QueueMgmt     Database    Realtime    SMS        Display
  │             │            │            │           │          │            │
  │─Click Next─>│            │            │           │          │            │
  │             │─Auth Check─│            │           │          │            │
  │             │            │            │           │          │            │
  │             │            │─Get Next───>│          │          │            │
  │             │            │  (WHERE status='waiting'          │            │
  │             │            │   ORDER BY sequence               │            │
  │             │            │   LIMIT 1)  │          │          │            │
  │             │            │<─Token──────│          │          │            │
  │             │            │            │           │          │            │
  │             │            │─Update Status─────────>│          │            │
  │             │            │  (status='called')     │          │            │
  │             │            │<─Success───────────────│          │            │
  │             │            │            │           │          │            │
  │             │            │─Mark Previous──────────>│         │            │
  │             │            │  as 'served'│          │          │            │
  │             │            │            │           │          │            │
  │             │            │─Broadcast──────────────>│         │            │
  │             │            │  Event     │           │          │            │
  │             │            │            │           │──────────────────────>│
  │             │            │            │           │          │  (Update)  │
  │             │            │            │           │          │            │
  │             │            │─Send SMS──────────────────────────>│           │
  │             │<─Token─────│            │           │          │            │
  │<─Display────│            │            │           │          │            │
  │             │            │            │           │          │            │
```

#### 2.2.3 Algorithm - Call Next Patient

```typescript
Algorithm: callNextPatient(queueId, counterId, staffId)

Input:
  - queueId: string (UUID)
  - counterId: string (UUID)
  - staffId: string (UUID - authenticated user)

Output:
  - nextToken: Token object or null

Steps:
  1. Validate authentication
     IF staffId is not authenticated
        THROW AuthenticationError

  2. Check if queue is paused
     queue = getQueue(queueId)
     IF queue.is_paused == true
        THROW QueuePausedError("Queue is currently paused")

  3. Get current serving token for this counter (if any)
     currentToken = getToken(WHERE counter_id = counterId AND status = 'serving')
     
  4. Mark current token as served (if exists)
     IF currentToken exists
        updateTokenStatus(currentToken.id, 'served', staffId)
        SET currentToken.served_at = NOW()
        SET currentToken.served_by_staff_id = staffId

  5. Get next waiting token
     nextToken = getToken(
       WHERE queue_id = queueId 
       AND status = 'waiting'
       AND (is_priority = true OR is_priority = false)
       ORDER BY is_priority DESC, token_sequence ASC
       LIMIT 1
     )

  6. If no token found
     IF nextToken is null
        RETURN null (no more patients)

  7. Update next token status
     updateTokenStatus(nextToken.id, 'called', staffId)
     SET nextToken.called_at = NOW()
     SET nextToken.counter_id = counterId

  8. Broadcast realtime event
     broadcastEvent({
       type: 'token_called',
       token: nextToken,
       queue_id: queueId
     })

  9. Send SMS to patient
     sendSMS(nextToken.patient_phone, "Your turn! Token " + nextToken.token_number)

  10. Update daily statistics
      incrementServingCount(queueId)

  11. Return nextToken

Error Handling:
  - IF database error: Rollback transaction, return error
  - IF SMS fails: Log error but continue (non-critical)
  - IF realtime broadcast fails: Log error but continue
```

#### 2.2.4 Algorithm - Queue Position Calculation

```typescript
Algorithm: getQueuePosition(tokenId)

Input:
  - tokenId: string (UUID)

Output:
  - position: integer (1-based position)
  - total: integer (total waiting)
  - currentServing: string (token number being served)

Steps:
  1. Get token details
     token = getToken(tokenId)
     IF token is null
        THROW TokenNotFoundError

  2. Count tokens ahead in queue
     tokensAhead = COUNT(
       WHERE queue_id = token.queue_id
       AND status = 'waiting'
       AND token_sequence < token.token_sequence
     )

  3. Calculate position
     IF token.status == 'waiting'
        position = tokensAhead + 1
     ELSE IF token.status == 'called' OR 'serving'
        position = 0  // Patient is being served
     ELSE
        position = -1  // Already served/cancelled

  4. Get total waiting
     total = COUNT(
       WHERE queue_id = token.queue_id
       AND status = 'waiting'
     )

  5. Get currently serving token
     servingToken = getToken(
       WHERE queue_id = token.queue_id
       AND status = 'serving'
       LIMIT 1
     )
     currentServing = servingToken ? servingToken.token_number : null

  6. Return {position, total, currentServing}

Example:
  Queue has tokens: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
  Token 3 is serving, Token 4 and 5 are called
  For Token 7:
    - tokensAhead = 2 (tokens 6)
    - position = 3
    - total = 6 (tokens 6-10 waiting)
    - currentServing = "OPD-A-003"
```

---

### 2.3 SMS Notification Module

#### 2.3.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      <<interface>>                           │
│                       SMSProvider                            │
├─────────────────────────────────────────────────────────────┤
│ + sendSMS(to: string, message: string): Promise<SMSResult>  │
│ + formatPhoneNumber(phone: string): string                  │
└─────────────────────────────────────────────────────────────┘
                            △
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              │             │             │
┌─────────────┴──┐  ┌───────┴──────┐  ┌──┴──────────┐
│ TwilioProvider │  │ MSG91Provider│  │Fast2SMSProv │
├────────────────┤  ├──────────────┤  ├─────────────┤
│ - accountSid   │  │ - apiKey     │  │ - apiKey    │
│ - authToken    │  │ - senderId   │  │             │
│ - phoneNumber  │  │              │  │             │
├────────────────┤  ├──────────────┤  ├─────────────┤
│ + sendSMS()    │  │ + sendSMS()  │  │ + sendSMS() │
└────────────────┘  └──────────────┘  └─────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       SMSService                             │
├─────────────────────────────────────────────────────────────┤
│ - provider: SMSProvider                                      │
│ - templates: SMSTemplates                                    │
├─────────────────────────────────────────────────────────────┤
│ + sendTokenGeneratedSMS(token: Token): Promise<boolean>     │
│ + sendReminderSMS(token: Token): Promise<boolean>           │
│ + sendYourTurnSMS(token: Token): Promise<boolean>           │
│ + sendQueuePausedSMS(tokens: Token[]): Promise<number>      │
│ + logSMS(log: SMSLog): Promise<void>                        │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3.2 Algorithm - SMS Sending with Retry

```typescript
Algorithm: sendSMSWithRetry(phone, message, type)

Input:
  - phone: string (10-digit number)
  - message: string (SMS content)
  - type: SMSType (token_generated, reminder, your_turn, etc.)

Output:
  - result: {success: boolean, messageId?: string, error?: string}

Constants:
  - MAX_RETRIES = 3
  - RETRY_DELAY = 2000 ms

Steps:
  1. Format phone number
     formattedPhone = formatPhoneNumber(phone)
     IF formattedPhone is invalid
        RETURN {success: false, error: "Invalid phone number"}

  2. Check if SMS is enabled
     IF SMS_ENABLED == false
        LOG "SMS disabled, would have sent: " + message
        RETURN {success: true, messageId: "disabled"}

  3. Initialize retry counter
     retryCount = 0

  4. Attempt to send SMS with retries
     WHILE retryCount < MAX_RETRIES
        TRY
           result = provider.sendSMS(formattedPhone, message)
           
           IF result.success
              // Log successful SMS
              logSMS({
                phone: formattedPhone,
                message: message,
                type: type,
                status: 'sent',
                messageId: result.messageId
              })
              RETURN result
           
        CATCH error
           retryCount++
           IF retryCount < MAX_RETRIES
              WAIT RETRY_DELAY milliseconds
           ELSE
              // Log failed SMS
              logSMS({
                phone: formattedPhone,
                message: message,
                type: type,
                status: 'failed',
                error: error.message
              })
              RETURN {success: false, error: error.message}

  5. If all retries exhausted
     RETURN {success: false, error: "Max retries exceeded"}
```

#### 2.3.3 SMS Templates

```typescript
// SMS Template Structure
interface SMSTemplates {
  TOKEN_GENERATED: (tokenNumber: string, position: number, 
                    waitMinutes: number) => string;
  REMINDER: (tokenNumber: string, patientsAhead: number) => string;
  YOUR_TURN: (tokenNumber: string, counterName: string) => string;
  QUEUE_PAUSED: (tokenNumber: string, resumeTime: string) => string;
  QUEUE_RESUMED: (tokenNumber: string) => string;
}

// Template Implementations
const SMS_TEMPLATES: SMSTemplates = {
  TOKEN_GENERATED: (tokenNumber, position, waitMinutes) => 
    `MediQueue: Your token ${tokenNumber}. Position #${position}. ` +
    `Est. wait: ${waitMinutes} min. Check: mediqueue.com/status`,
  
  REMINDER: (tokenNumber, patientsAhead) =>
    `MediQueue: ${patientsAhead} patients ahead (${tokenNumber}). ` +
    `Please return to waiting area.`,
  
  YOUR_TURN: (tokenNumber, counterName) =>
    `MediQueue: Your turn! Token ${tokenNumber}. ` +
    `Proceed to ${counterName} now.`,
  
  QUEUE_PAUSED: (tokenNumber, resumeTime) =>
    `MediQueue: Queue paused. Token ${tokenNumber} will be called ` +
    `after ${resumeTime}.`,
  
  QUEUE_RESUMED: (tokenNumber) =>
    `MediQueue: Queue resumed. Token ${tokenNumber}. Check your position.`
};

// Character limits validation
const MAX_SMS_LENGTH = 160;  // Standard SMS length

function validateSMSLength(message: string): boolean {
  return message.length <= MAX_SMS_LENGTH;
}
```

---

### 2.4 Real-time Update Module

#### 2.4.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   RealtimeService                            │
├─────────────────────────────────────────────────────────────┤
│ - supabaseClient: SupabaseClient                            │
│ - activeChannels: Map<string, RealtimeChannel>              │
├─────────────────────────────────────────────────────────────┤
│ + subscribeToQueue(queueId: string, callback): Subscription │
│ + subscribeToTokenUpdates(callback): Subscription           │
│ + broadcastEvent(event: RealtimeEvent): void                │
│ + unsubscribe(subscription: Subscription): void             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  RealtimeEventHandler                        │
├─────────────────────────────────────────────────────────────┤
│ + handleTokenCreated(payload): void                         │
│ + handleTokenCalled(payload): void                          │
│ + handleTokenServed(payload): void                          │
│ + handleQueuePaused(payload): void                          │
└─────────────────────────────────────────────────────────────┘
```

#### 2.4.2 Sequence Diagram - Realtime Update Flow

```
Database      Supabase        Display        Patient        Staff
Change        Realtime        Screen         Portal         Panel
  │              │              │              │              │
  │─Token────────>│             │              │              │
  │  Status      │              │              │              │
  │  Changed     │              │              │              │
  │              │              │              │              │
  │              │─Broadcast────>│             │              │
  │              │  Event       │              │              │
  │              │              │─Update───────│              │
  │              │              │  Display     │              │
  │              │              │              │              │
  │              │─Broadcast─────────────────>│              │
  │              │  Event       │              │              │
  │              │              │              │─Refresh──────│
  │              │              │              │  Position    │
  │              │              │              │              │
  │              │─Broadcast──────────────────────────────────>│
  │              │  Event       │              │              │
  │              │              │              │              │─Update
  │              │              │              │              │  Queue
  │              │              │              │              │  List
```

#### 2.4.3 Algorithm - Subscribe to Queue Updates

```typescript
Algorithm: subscribeToQueueUpdates(queueId, onUpdate)

Input:
  - queueId: string (UUID)
  - onUpdate: callback function(event: RealtimeEvent) => void

Output:
  - subscription: Subscription object

Steps:
  1. Create channel name
     channelName = "queue:" + queueId

  2. Check if channel already exists
     IF activeChannels.has(channelName)
        RETURN activeChannels.get(channelName)

  3. Create new Supabase channel
     channel = supabaseClient
       .channel(channelName)
       .on('postgres_changes', {
         event: '*',  // INSERT, UPDATE, DELETE
         schema: 'public',
         table: 'tokens',
         filter: 'queue_id=eq.' + queueId
       }, (payload) => {
         // Handle database change
         event = transformPayloadToEvent(payload)
         onUpdate(event)
       })
       .subscribe()

  4. Store channel reference
     activeChannels.set(channelName, channel)

  5. Return subscription handle
     RETURN {
       channel: channel,
       unsubscribe: () => {
         supabaseClient.removeChannel(channel)
         activeChannels.delete(channelName)
       }
     }

Cleanup on unmount:
  - Call unsubscribe() to prevent memory leaks
  - Remove channel from activeChannels map
```

---

### 2.5 Analytics Module

#### 2.5.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   AnalyticsService                           │
├─────────────────────────────────────────────────────────────┤
│ - supabaseClient: SupabaseClient                            │
├─────────────────────────────────────────────────────────────┤
│ + getDailyStatistics(deptId, date): DailyStats              │
│ + getWeeklyStatistics(deptId, startDate): WeeklyStats       │
│ + getPeakHours(deptId, dateRange): PeakHours[]              │
│ + getNoShowRate(deptId, dateRange): number                  │
│ + calculateAverageWaitTime(tokens: Token[]): number         │
│ + updateDailyStatistics(deptId, date): void                 │
│ + generateReport(params: ReportParams): Report              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ReportGenerator                           │
├─────────────────────────────────────────────────────────────┤
│ - analyticsService: AnalyticsService                        │
├─────────────────────────────────────────────────────────────┤
│ + generatePDFReport(data): Buffer                           │
│ + generateExcelReport(data): Buffer                         │
│ + generateCSVReport(data): string                           │
└─────────────────────────────────────────────────────────────┘
```

#### 2.5.2 Algorithm - Calculate Average Wait Time

```typescript
Algorithm: calculateAverageWaitTime(tokens)

Input:
  - tokens: Array of Token objects (with created_at and served_at)

Output:
  - avgWaitMinutes: number (average wait time in minutes)

Steps:
  1. Filter served tokens only
     servedTokens = tokens.filter(t => 
       t.status == 'served' AND 
       t.created_at != null AND 
       t.served_at != null
     )

  2. If no served tokens
     IF servedTokens.length == 0
        RETURN 0

  3. Calculate wait time for each token
     waitTimes = []
     FOR EACH token IN servedTokens
        createdTime = new Date(token.created_at).getTime()
        servedTime = new Date(token.served_at).getTime()
        waitMinutes = (servedTime - createdTime) / (1000 * 60)
        waitTimes.push(waitMinutes)

  4. Calculate average
     totalWait = SUM(waitTimes)
     avgWaitMinutes = totalWait / waitTimes.length

  5. Round to 2 decimal places
     avgWaitMinutes = Math.round(avgWaitMinutes * 100) / 100

  6. Return avgWaitMinutes

Example:
  Token 1: created 10:00, served 10:20 → 20 minutes
  Token 2: created 10:05, served 10:30 → 25 minutes
  Token 3: created 10:10, served 10:35 → 25 minutes
  Average = (20 + 25 + 25) / 3 = 23.33 minutes
```

#### 2.5.3 Algorithm - Detect Peak Hours

```typescript
Algorithm: getPeakHours(departmentId, startDate, endDate)

Input:
  - departmentId: string
  - startDate: Date
  - endDate: Date

Output:
  - peakHours: Array<{hour: number, count: number}>

Steps:
  1. Fetch all tokens in date range
     tokens = getTokens(
       WHERE department_id = departmentId
       AND created_at >= startDate
       AND created_at <= endDate
     )

  2. Initialize hour count map
     hourCounts = new Map<number, number>()
     FOR hour = 0 TO 23
        hourCounts.set(hour, 0)

  3. Count tokens per hour
     FOR EACH token IN tokens
        hour = new Date(token.created_at).getHours()
        currentCount = hourCounts.get(hour)
        hourCounts.set(hour, currentCount + 1)

  4. Convert to array and sort
     peakHours = []
     FOR EACH [hour, count] IN hourCounts
        peakHours.push({hour: hour, count: count})
     
     peakHours.sort((a, b) => b.count - a.count)

  5. Return top 5 peak hours
     RETURN peakHours.slice(0, 5)

Example Output:
  [
    {hour: 10, count: 45},  // 10:00 AM - 45 patients
    {hour: 9, count: 38},   // 9:00 AM - 38 patients
    {hour: 11, count: 35},  // 11:00 AM - 35 patients
    {hour: 14, count: 28},  // 2:00 PM - 28 patients
    {hour: 15, count: 25}   // 3:00 PM - 25 patients
  ]
```

---

### 2.6 Authentication Module

#### 2.6.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   AuthenticationService                      │
├─────────────────────────────────────────────────────────────┤
│ - supabaseClient: SupabaseClient                            │
│ - sessionStore: SessionStore                                │
├─────────────────────────────────────────────────────────────┤
│ + login(email, password): Promise<AuthResult>               │
│ + logout(sessionId): Promise<void>                          │
│ + verifySession(sessionId): Promise<Staff>                  │
│ + hashPassword(password): string                            │
│ + comparePassword(password, hash): boolean                  │
│ + createSession(staffId): Session                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   AuthorizationService                       │
├─────────────────────────────────────────────────────────────┤
│ - permissions: Map<Role, Permission[]>                      │
├─────────────────────────────────────────────────────────────┤
│ + checkPermission(staff, action): boolean                   │
│ + canManageQueue(staff, queueId): boolean                   │
│ + canViewAnalytics(staff): boolean                          │
│ + canManageStaff(staff): boolean                            │
└─────────────────────────────────────────────────────────────┘
```

#### 2.6.2 Algorithm - Staff Login

```typescript
Algorithm: login(email, password)

Input:
  - email: string
  - password: string (plain text)

Output:
  - result: {success: boolean, staff?: Staff, session?: Session, error?: string}

Steps:
  1. Validate input
     IF email is empty OR password is empty
        RETURN {success: false, error: "Email and password required"}

  2. Fetch staff from database
     staff = getStaff(WHERE email = email AND is_active = true)
     
     IF staff is null
        // Don't reveal whether email exists
        RETURN {success: false, error: "Invalid credentials"}

  3. Verify password
     isPasswordValid = comparePassword(password, staff.password_hash)
     
     IF NOT isPasswordValid
        RETURN {success: false, error: "Invalid credentials"}

  4. Create session
     session = createSession(staff.id)
     session.staff_id = staff.id
     session.created_at = NOW()
     session.expires_at = NOW() + 24 hours
     session.token = generateSecureToken()

  5. Store session
     saveSession(session)

  6. Remove sensitive data from staff object
     DELETE staff.password_hash

  7. Return success
     RETURN {
       success: true,
       staff: staff,
       session: session
     }

Security Considerations:
  - Use bcrypt for password hashing (cost factor: 10)
  - Session tokens are cryptographically secure (32 bytes)
  - Passwords never logged or exposed
  - Rate limiting on login attempts (5 attempts per minute)
```

#### 2.6.3 Role-Based Access Control

```typescript
// Permission Matrix
const PERMISSIONS = {
  super_admin: [
    'view_all_queues',
    'manage_queues',
    'view_analytics',
    'manage_departments',
    'manage_staff',
    'manage_settings',
    'generate_reports'
  ],
  
  admin: [
    'view_all_queues',
    'manage_queues',
    'view_analytics',
    'generate_reports'
  ],
  
  operator: [
    'view_assigned_queue',
    'manage_assigned_queue',
    'call_next_patient',
    'update_token_status'
  ],
  
  viewer: [
    'view_assigned_queue'
  ]
};

Algorithm: checkPermission(staff, requiredPermission)

Input:
  - staff: Staff object with role
  - requiredPermission: string

Output:
  - hasPermission: boolean

Steps:
  1. Get staff role
     role = staff.role

  2. Get permissions for role
     rolePermissions = PERMISSIONS[role]
     
     IF rolePermissions is undefined
        RETURN false

  3. Check if permission exists
     hasPermission = rolePermissions.includes(requiredPermission)

  4. Return result
     RETURN hasPermission

Usage Example:
  IF checkPermission(staff, 'manage_staff')
     // Allow access to staff management
  ELSE
     // Return 403 Forbidden
```

---

## 3. Database Design Details

### 3.1 Table Structures with Constraints

```sql
-- DEPARTMENTS TABLE
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    avg_service_time_minutes INTEGER DEFAULT 15 
        CHECK (avg_service_time_minutes > 0 AND avg_service_time_minutes <= 120),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COUNTERS TABLE
CREATE TABLE counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    counter_number INTEGER NOT NULL CHECK (counter_number > 0),
    counter_code VARCHAR(5) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(department_id, counter_number),
    UNIQUE(department_id, counter_code)
);

-- QUEUES TABLE
CREATE TABLE queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_token_number INTEGER DEFAULT 0 CHECK (current_token_number >= 0),
    is_paused BOOLEAN DEFAULT false,
    pause_message TEXT,
    resume_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(department_id, date)
);

-- TOKENS TABLE
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
    counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
    token_number VARCHAR(20) NOT NULL UNIQUE,
    token_sequence INTEGER NOT NULL CHECK (token_sequence > 0),
    
    -- Patient Info
    patient_name VARCHAR(100) NOT NULL,
    patient_phone VARCHAR(15) NOT NULL,
    patient_age INTEGER CHECK (patient_age >= 0 AND patient_age <= 120),
    visit_reason TEXT,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' 
        CHECK (status IN ('waiting', 'called', 'serving', 'served', 'no_show', 'cancelled')),
    is_priority BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    called_at TIMESTAMP WITH TIME ZONE,
    serving_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    
    -- SMS tracking
    sms_sent BOOLEAN DEFAULT false,
    sms_reminder_sent BOOLEAN DEFAULT false,
    sms_turn_sent BOOLEAN DEFAULT false,
    
    -- Staff reference
    served_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (
        (status = 'called' AND called_at IS NOT NULL) OR
        (status != 'called')
    ),
    CHECK (
        (status = 'served' AND served_at IS NOT NULL) OR
        (status != 'served')
    )
);
```

### 3.2 Indexes for Performance

```sql
-- Token table indexes (most queried)
CREATE INDEX idx_tokens_queue_status ON tokens(queue_id, status);
CREATE INDEX idx_tokens_status_sequence ON tokens(status, token_sequence);
CREATE INDEX idx_tokens_phone ON tokens(patient_phone);
CREATE INDEX idx_tokens_created_at ON tokens(created_at DESC);

-- Queue table indexes
CREATE INDEX idx_queues_dept_date ON queues(department_id, date);
CREATE INDEX idx_queues_date ON queues(date DESC);

-- Counter table indexes
CREATE INDEX idx_counters_dept ON counters(department_id);

-- Staff table indexes
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_dept ON staff(department_id);

-- Composite index for common query
CREATE INDEX idx_tokens_queue_waiting ON tokens(queue_id, status) 
    WHERE status = 'waiting';
```

### 3.3 Database Triggers

```sql
-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_departments_updated_at 
    BEFORE UPDATE ON departments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tokens_updated_at 
    BEFORE UPDATE ON tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update serving timestamp
CREATE OR REPLACE FUNCTION update_serving_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'serving' AND OLD.status != 'serving' THEN
        NEW.serving_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_serving_timestamp 
    BEFORE UPDATE ON tokens 
    FOR EACH ROW EXECUTE FUNCTION update_serving_timestamp();
```

---

## 4. API Route Implementations

### 4.1 POST /api/tokens/generate

```typescript
// File: src/app/api/tokens/generate/route.ts

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body: TokenGenerationRequest = await request.json();
    
    // 2. Validate required fields
    const validation = validateTokenRequest(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }
    
    // 3. Get department
    const department = await getDepartment(body.department_id);
    if (!department) {
      return NextResponse.json({
        success: false,
        error: 'Invalid department'
      }, { status: 400 });
    }
    
    // 4. Get/create today's queue
    const queue = await getTodayQueue(body.department_id);
    if (!queue) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create queue'
      }, { status: 500 });
    }
    
    // 5. Check if queue is paused
    if (queue.is_paused) {
      return NextResponse.json({
        success: false,
        error: `Queue paused. ${queue.pause_message}`
      }, { status: 400 });
    }
    
    // 6. Get counter
    const counter = await getNextAvailableCounter(body.department_id);
    
    // 7. Generate token
    const nextSequence = queue.current_token_number + 1;
    const tokenNumber = generateTokenNumber(
      department.code,
      counter.counter_code,
      nextSequence
    );
    
    // 8. Create token in database (transaction)
    const token = await createToken({
      queue_id: queue.id,
      counter_id: counter.id,
      token_number: tokenNumber,
      token_sequence: nextSequence,
      ...body
    });
    
    // 9. Update queue counter
    await incrementQueueCounter(queue.id);
    
    // 10. Calculate wait time
    const position = await getQueuePosition(token.id);
    const waitTime = calculateWaitTime(position, department.avg_service_time_minutes);
    
    // 11. Send SMS (async, don't wait)
    sendTokenGeneratedSMS(token, position, waitTime)
      .catch(err => console.error('SMS failed:', err));
    
    // 12. Return response
    return NextResponse.json({
      success: true,
      token: token,
      queue_position: position,
      estimated_wait_minutes: waitTime
    });
    
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Helper: Validate request
function validateTokenRequest(body: any): {valid: boolean, error?: string} {
  if (!body.patient_name || body.patient_name.trim().length < 2) {
    return {valid: false, error: 'Invalid patient name'};
  }
  
  if (!body.patient_phone || !/^\d{10}$/.test(body.patient_phone)) {
    return {valid: false, error: 'Invalid phone number (10 digits required)'};
  }
  
  if (!body.department_id || !isValidUUID(body.department_id)) {
    return {valid: false, error: 'Invalid department'};
  }
  
  if (body.patient_age && (body.patient_age < 0 || body.patient_age > 120)) {
    return {valid: false, error: 'Invalid age'};
  }
  
  return {valid: true};
}
```

### 4.2 POST /api/queue/call-next

```typescript
// File: src/app/api/queue/call-next/route.ts

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSession(request);
    if (!session || !session.staff) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }
    
    // 2. Parse request
    const { queue_id, counter_id } = await request.json();
    
    // 3. Verify permissions
    const hasPermission = await checkPermission(
      session.staff,
      'call_next_patient'
    );
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden'
      }, { status: 403 });
    }
    
    // 4. Check if queue is paused
    const queue = await getQueue(queue_id);
    if (queue.is_paused) {
      return NextResponse.json({
        success: false,
        error: 'Queue is paused'
      }, { status: 400 });
    }
    
    // 5. Start transaction
    const result = await supabase.rpc('call_next_patient', {
      p_queue_id: queue_id,
      p_counter_id: counter_id,
      p_staff_id: session.staff.id
    });
    
    // This stored procedure:
    // - Marks current token as served
    // - Gets next waiting token
    // - Updates status to 'called'
    // - Returns next token
    
    if (!result.data) {
      return NextResponse.json({
        success: true,
        token: null,
        message: 'No more patients in queue'
      });
    }
    
    const nextToken = result.data;
    
    // 6. Broadcast realtime event
    await broadcastEvent({
      type: 'token_called',
      token: nextToken,
      queue_id: queue_id
    });
    
    // 7. Send SMS (async)
    sendYourTurnSMS(nextToken)
      .catch(err => console.error('SMS failed:', err));
    
    // 8. Return next patient
    return NextResponse.json({
      success: true,
      token: nextToken
    });
    
  } catch (error) {
    console.error('Call next error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

---

## 5. Frontend Component Design

### 5.1 Component Hierarchy

```
App
├── PatientPortal
│   ├── TokenGenerationForm
│   │   ├── DepartmentSelector
│   │   ├── PatientInfoForm
│   │   └── SubmitButton
│   ├── TokenDisplay
│   └── QueueStatusChecker
│
├── StaffPortal
│   ├── AuthGuard
│   ├── QueueDashboard
│   │   ├── QueueHeader
│   │   ├── CallNextButton
│   │   ├── TokenList
│   │   │   └── TokenCard (multiple)
│   │   ├── QueueControls
│   │   │   ├── PauseButton
│   │   │   └── PriorityTokenButton
│   │   └── SearchBar
│   └── Logout
│
├── AdminPortal
│   ├── AuthGuard
│   ├── Dashboard
│   │   ├── StatsCards
│   │   ├── DepartmentStats
│   │   └── RecentActivity
│   ├── Analytics
│   │   ├── DateRangePicker
│   │   ├── Charts
│   │   └── ReportDownload
│   ├── Settings
│   └── Management
│       ├── DepartmentCRUD
│       └── StaffCRUD
│
└── DisplayScreen
    ├── CurrentTokenDisplay
    ├── DepartmentTabs
    └── AutoRefresh
```

### 5.2 Component Specifications

#### TokenGenerationForm Component

```typescript
// Props
interface TokenGenerationFormProps {
  departments: Department[];
  onSuccess: (token: TokenWithDetails) => void;
  onError: (error: string) => void;
}

// State
interface TokenFormState {
  formData: {
    patient_name: string;
    patient_phone: string;
    patient_age: string;
    visit_reason: string;
    department_id: string;
  };
  loading: boolean;
  errors: Record<string, string>;
}

// Component Logic
const TokenGenerationForm: React.FC<TokenGenerationFormProps> = ({
  departments,
  onSuccess,
  onError
}) => {
  // 1. State management
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // 2. Form validation
  const validateForm = (): boolean => {
    const newErrors = {};
    
    if (formData.patient_name.trim().length < 2) {
      newErrors.patient_name = 'Name must be at least 2 characters';
    }
    
    if (!/^\d{10}$/.test(formData.patient_phone)) {
      newErrors.patient_phone = 'Enter valid 10-digit number';
    }
    
    if (!formData.department_id) {
      newErrors.department_id = 'Please select a department';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 3. Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/tokens/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        onSuccess(data.token);
        setFormData(initialState); // Reset form
      } else {
        onError(data.error);
      }
    } catch (error) {
      onError('Failed to generate token');
    } finally {
      setLoading(false);
    }
  };
  
  // 4. Render
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

#### CallNextButton Component

```typescript
// Props
interface CallNextButtonProps {
  queueId: string;
  counterId: string;
  onTokenCalled: (token: Token) => void;
  disabled?: boolean;
}

// Component
const CallNextButton: React.FC<CallNextButtonProps> = ({
  queueId,
  counterId,
  onTokenCalled,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/queue/call-next', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ queue_id: queueId, counter_id: counterId })
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        onTokenCalled(data.token);
        // Play sound notification (optional)
        playNotificationSound();
      } else if (data.success && !data.token) {
        // No more patients
        alert('No more patients in queue');
      }
    } catch (error) {
      console.error('Failed to call next:', error);
      alert('Failed to call next patient');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className="btn-primary btn-lg"
    >
      {loading ? 'Calling...' : 'Call Next Patient'}
    </button>
  );
};
```

#### RealtimeQueueUpdates Hook

```typescript
// Custom hook for real-time updates
function useQueueRealtime(queueId: string) {
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [waitingCount, setWaitingCount] = useState(0);
  
  useEffect(() => {
    // Subscribe to token changes
    const channel = supabase
      .channel(`queue-${queueId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tokens',
        filter: `queue_id=eq.${queueId}`
      }, (payload) => {
        const token = payload.new as Token;
        
        if (token.status === 'serving') {
          setCurrentToken(token.token_number);
        }
        
        // Refresh waiting count
        refreshWaitingCount();
      })
      .subscribe();
    
    // Initial load
    refreshWaitingCount();
    
    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queueId]);
  
  const refreshWaitingCount = async () => {
    const { count } = await supabase
      .from('tokens')
      .select('*', { count: 'exact', head: true })
      .eq('queue_id', queueId)
      .eq('status', 'waiting');
    
    setWaitingCount(count || 0);
  };
  
  return { currentToken, waitingCount };
}

// Usage in component
const DisplayScreen = ({ queueId }) => {
  const { currentToken, waitingCount } = useQueueRealtime(queueId);
  
  return (
    <div className="display-screen">
      <h1>NOW SERVING</h1>
      <div className="token-display">{currentToken || '---'}</div>
      <p>{waitingCount} patients waiting</p>
    </div>
  );
};
```

---

## 6. Error Handling Strategy

### 6.1 Error Types and Handling

```typescript
// Custom Error Classes
class ValidationError extends Error {
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends Error {
  constructor(message: string = 'Permission denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

class DatabaseError extends Error {
  constructor(message: string, query?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.query = query;
  }
}

// Global Error Handler
function handleAPIError(error: Error): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof ValidationError) {
    return NextResponse.json({
      success: false,
      error: error.message,
      field: error.field
    }, { status: 400 });
  }
  
  if (error instanceof AuthenticationError) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 401 });
  }
  
  if (error instanceof AuthorizationError) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 403 });
  }
  
  if (error instanceof DatabaseError) {
    // Don't expose database details to client
    return NextResponse.json({
      success: false,
      error: 'Database operation failed'
    }, { status: 500 });
  }
  
  // Generic error
  return NextResponse.json({
    success: false,
    error: 'Internal server error'
  }, { status: 500 });
}
```

### 6.2 Frontend Error Handling

```typescript
// Error Toast Component
const ErrorToast: React.FC<{message: string}> = ({message}) => {
  return (
    <div className="toast toast-error">
      <span className="icon">❌</span>
      <span className="message">{message}</span>
    </div>
  );
};

// Error Boundary
class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  {hasError: boolean}
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo);
    // Log to error tracking service (e.g., Sentry)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

---

## 7. Performance Optimization

### 7.1 Database Query Optimization

```sql
-- Optimized query for getting next token
-- Uses index on (queue_id, status, is_priority, token_sequence)
SELECT * FROM tokens
WHERE queue_id = $1
  AND status = 'waiting'
ORDER BY 
  is_priority DESC,  -- Priority tokens first
  token_sequence ASC  -- Then by sequence
LIMIT 1;

-- Optimized query for queue position
-- Uses index on (queue_id, status, token_sequence)
SELECT COUNT(*) FROM tokens
WHERE queue_id = $1
  AND status = 'waiting'
  AND token_sequence < $2;
```

### 7.2 Caching Strategy

```typescript
// Simple in-memory cache for departments
const departmentCache = new Map<string, {data: Department[], timestamp: number}>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedDepartments(): Promise<Department[]> {
  const cached = departmentCache.get('all');
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  
  // Fetch from database
  const { data } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true);
  
  departmentCache.set('all', {
    data: data || [],
    timestamp: Date.now()
  });
  
  return data || [];
}
```

### 7.3 Frontend Performance

```typescript
// Lazy loading for admin pages
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const Analytics = lazy(() => import('./Analytics'));

// Memoize expensive computations
const MemoizedTokenList = React.memo(TokenList, (prevProps, nextProps) => {
  return prevProps.tokens.length === nextProps.tokens.length &&
         prevProps.tokens[0]?.id === nextProps.tokens[0]?.id;
});

// Debounce search input
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    performSearch(query);
  }, 300),
  []
);
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// Example: Test token number generation
describe('generateTokenNumber', () => {
  test('generates correct format', () => {
    const result = generateTokenNumber('OPD', 'A', 42);
    expect(result).toBe('OPD-A-042');
  });
  
  test('pads sequence correctly', () => {
    const result = generateTokenNumber('XRAY', 'B', 5);
    expect(result).toBe('XRAY-B-005');
  });
  
  test('throws error for invalid input', () => {
    expect(() => generateTokenNumber('', 'A', 1)).toThrow(ValidationError);
  });
});

// Example: Test wait time calculation
describe('calculateWaitTime', () => {
  test('calculates correctly with buffer', () => {
    const result = calculateWaitTime(10, 15);
    // 9 * 15 = 135, +20% = 162
    expect(result).toBe(162);
  });
  
  test('rounds up to nearest minute', () => {
    const result = calculateWaitTime(3, 10);
    // 2 * 10 = 20, +20% = 24
    expect(result).toBe(24);
  });
});
```

### 8.2 Integration Tests

```typescript
// Example: Test token generation flow
describe('POST /api/tokens/generate', () => {
  test('successfully generates token', async () => {
    const response = await request(app)
      .post('/api/tokens/generate')
      .send({
        patient_name: 'John Doe',
        patient_phone: '9876543210',
        department_id: 'dept-uuid-123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.token.token_number).toMatch(/^[A-Z]+-[A-Z]-\d{3}$/);
  });
  
  test('rejects invalid phone number', async () => {
    const response = await request(app)
      .post('/api/tokens/generate')
      .send({
        patient_name: 'John Doe',
        patient_phone: '123',
        department_id: 'dept-uuid-123'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

---

## 9. Deployment Procedures

### 9.1 Pre-deployment Checklist

```
□ All environment variables set in production
□ Database migrations applied
□ SSL certificates configured
□ API rate limits configured
□ Error logging enabled
□ Backup strategy in place
□ Monitoring alerts configured
□ Load testing completed
□ Security audit passed
□ Documentation updated
```

### 9.2 Deployment Steps

```bash
# 1. Build application
npm run build

# 2. Run tests
npm run test

# 3. Deploy to Vercel
vercel --prod

# 4. Verify deployment
curl https://mediqueue.vercel.app/api/health

# 5. Run smoke tests
npm run test:smoke

# 6. Monitor logs
vercel logs
```

---

## 10. Maintenance Procedures

### 10.1 Daily Tasks

```sql
-- Check queue health
SELECT 
  department_id,
  COUNT(*) as active_tokens,
  MAX(created_at) as last_token
FROM tokens
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY department_id;

-- Check failed SMS
SELECT COUNT(*) as failed_sms
FROM sms_logs
WHERE status = 'failed'
  AND DATE(created_at) = CURRENT_DATE;
```

### 10.2 Cleanup Jobs

```typescript
// Run daily at midnight
async function dailyCleanup() {
  // 1. Archive old queues (>30 days)
  await archiveOldQueues(30);
  
  // 2. Update statistics
  await updateDailyStatistics();
  
  // 3. Clean SMS logs (>90 days)
  await cleanOldSMSLogs(90);
  
  // 4. Backup database
  await triggerBackup();
}

// Schedule with cron
cron.schedule('0 0 * * *', dailyCleanup);
```

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Authors**: Anuj Goyal, Parv Jhanwar, Suhaan Sharma