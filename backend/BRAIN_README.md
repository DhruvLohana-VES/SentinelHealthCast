# 🧠 Sentinel Brain - AI Outbreak Detection System

## Overview
The **Sentinel Brain** is an autonomous AI service that continuously monitors citizen reports and automatically detects potential disease outbreaks by analyzing spatial clustering of health risks.

## How It Works

### 1. **Continuous Monitoring** (Every 30 seconds)
- Scans the `reports` table for new civic risk submissions (from Telegram bot)
- Aggregates reports by ward/zone

### 2. **Outbreak Detection Logic**
- **Trigger Threshold:** ≥2 reports in the same ward
- Calculates average severity and categorizes risk types

### 3. **AI Analysis (Gemini 2.5 Flash)**
- Ward name, report count, types, and severity → AI
- Generates:
  - Alert Level (HIGH/CRITICAL)
  - Advisory Header (5-word max)
  - Public Message (citizen warning)
  - Action Items (3 specific steps for authorities)

### 4. **Alert Publishing**
- Saves structured alert to `alerts` table
- Dashboard can fetch and display these alerts in real-time
- Authorities can acknowledge/dismiss

## Database Schema

### `reports` Table (Telegram Bot Input)
```sql
- id: uuid (primary key)
- ward_id: uuid (references wards)
- image_url: text
- description: text
- severity: integer (1-10)
- type: text (Garbage, Stagnant Water, etc.)
- location: geometry(Point) -- PostGIS
- chat_id: bigint (for Telegram notifications)
- created_at: timestamp
```

### `alerts` Table (Brain Output)
```sql
- id: uuid (primary key)
- ward_id: uuid (references wards)
- severity: text (HIGH, CRITICAL, MODERATE, LOW)
- message: text (alert title)
- action_plan: jsonb (full AI response)
- acknowledged: boolean
- created_at: timestamp
```

## Setup Instructions

### 1. Create Database Tables
Run the SQL migration in Supabase SQL Editor:
```bash
# Option 1: Run setup script to get instructions
python setup_brain_tables.py

# Option 2: Manually execute SQL
# Copy contents of create_missing_tables.sql to Supabase SQL Editor
```

### 2. Verify Tables Exist
```python
python -c "from supabase import create_client; import os; from dotenv import load_dotenv; load_dotenv(); sb = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY')); print('reports:', len(sb.table('reports').select('*').execute().data)); print('alerts:', len(sb.table('alerts').select('*').execute().data))"
```

### 3. Start the Brain
```bash
cd backend
python brain.py
```

Expected output:
```
🧠 Sentinel Brain Service Started...
   Press Ctrl+C to stop.
   Scanning every 30 seconds...
📡 Scanning Grid for outbreaks...
Ward 1 stable (1 reports).
...
```

## Integration with Existing System

### Telegram Bot → Reports Table
Already configured! When a citizen sends a photo + location via Telegram:
1. Image analyzed by Gemini
2. Location matched to ward via `match_ward()` RPC
3. Report inserted into `reports` table with `chat_id`

### Brain → Alerts Table
Every 30 seconds:
1. Brain reads `reports` table
2. Groups by `ward_id`
3. If ward has ≥2 reports → AI analysis
4. Inserts structured alert into `alerts` table

### Frontend Dashboard Integration
Update your dashboards to fetch alerts:

```javascript
// Example: Fetch latest alerts
const { data: alerts } = await supabase
  .from('alerts')
  .select(`
    *,
    wards(name, location)
  `)
  .order('created_at', { ascending: false })
  .limit(10);
```

Display in UI:
```jsx
{alerts.map(alert => (
  <Alert severity={alert.severity}>
    <AlertTitle>{alert.message}</AlertTitle>
    <Typography>{alert.action_plan.public_message}</Typography>
    <ul>
      {alert.action_plan.action_items.map(item => (
        <li>{item}</li>
      ))}
    </ul>
  </Alert>
))}
```

## Configuration

### Scan Frequency
Change `time.sleep(30)` in brain.py to adjust scan interval:
- Development: 30 seconds (current)
- Production: 60-300 seconds recommended

### Outbreak Threshold
Change `if count >= 2:` to adjust sensitivity:
- More sensitive: `>= 1` (alert on single report)
- Less sensitive: `>= 5` (require more reports)

### AI Model
Currently using `gemini-2.5-flash` for:
- ✅ Latest Gemini model with improved accuracy
- ✅ Fast responses (~2-3 seconds)
- ✅ Structured JSON output

To use Gemini Pro:
```python
model = genai.GenerativeModel('gemini-2.5-pro')
```

## Fallback Mechanisms

### If `reports` table doesn't exist
Brain will use `citizen_reports` table (web UI submissions)

### If `alerts` table doesn't exist
Brain will insert into `dispatch_tickets` table (existing schema)

### If AI JSON parsing fails
Error logged, continues to next ward without crashing

## Monitoring & Logs

The brain outputs structured logs:
```
📡 Scanning Grid for outbreaks...
⚠️ OUTBREAK CANDIDATE: Ward abc-123 has 3 reports.
✅ ALERT PUBLISHED for Andheri East: Urgent Health Advisory
```

For production, pipe to a log file:
```bash
python brain.py >> logs/brain.log 2>&1 &
```

## Future Enhancements

1. **Push Notifications**
   - Use `chat_id` from reports to notify citizens in affected wards
   - Send alert via Telegram when outbreak detected

2. **Temporal Filtering**
   - Only analyze reports from last 24-48 hours
   - Archive old reports to separate table

3. **ML-Based Clustering**
   - Use DBSCAN/HDBSCAN for spatial clustering
   - Detect hotspots beyond ward boundaries

4. **Multi-Source Input**
   - Aggregate `citizen_reports` (web) + `reports` (telegram)
   - Weight verified reports higher

5. **Alert Escalation**
   - AUTO-APPROVE low-risk alerts
   - Require official approval for CRITICAL alerts

## Testing

### Generate Test Reports
```python
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
sb = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

# Get a ward ID
ward = sb.table('wards').select('id, name').limit(1).execute().data[0]

# Insert 3 test reports for the same ward
for i in range(3):
    sb.table('reports').insert({
        'ward_id': ward['id'],
        'description': f'Test garbage pile #{i+1}',
        'severity': 7,
        'type': 'Garbage',
        'location': f'POINT(72.8{i} 19.1{i})',
        'chat_id': 123456789
    }).execute()

print(f"✅ Created 3 test reports for {ward['name']}")
print("   Brain should detect outbreak in next scan cycle")
```

### Verify Alert Generated
```python
alerts = sb.table('alerts').select('*').order('created_at', {'ascending': False}).limit(1).execute()
print(alerts.data[0])
```

## Troubleshooting

**Brain shows "No reports found"**
- Check if telegram bot is running and has received photo submissions
- Verify `reports` table exists and has data

**"Could not find the table 'public.reports'" error**
- Run `create_missing_tables.sql` in Supabase SQL Editor
- Brain will fallback to `citizen_reports` if reports table missing

**AI Parsing Errors**
- Gemini occasionally returns malformed JSON
- Brain will log error and continue (won't crash)
- Check `response.text` in logs to see raw AI output

**Rate Limit Errors (429)**
- Currently using `gemini-2.5-flash` (latest model)
- Increase scan interval to reduce API calls
- If issues persist, check API key quota at https://aistudio.google.com

## License
Part of SentinelHealthCast epidemic surveillance system.
