# Database Scaling & Integrity Guide

This document outlines the advanced database patterns implemented and recommended for the OpenSite platform as it scales from SQLite to PostgreSQL.

## 💾 Data Integrity

### Check Constraints
We have implemented `CHECK` constraints at the database level to ensure data validity regardless of the application logic.
- **Prices & Values**: All price and value columns (e.g., `leads.value`, `materials.unit_cost`) have a `CHECK (value >= 0)` constraint.
- **Progress Tracking**: Project progress is constrained to `CHECK (progress BETWEEN 0 AND 100)`.
- **Quantities**: Material quantities and fixture counts in estimates are constrained to be non-negative.

### Foreign Key Constraints
All relationships are enforced with `FOREIGN KEY` constraints.
- **Cascading Deletes**: Used for dependent items (e.g., `takeoff_items` are deleted when a `takeoff` is deleted).
- **Set Null**: Used for non-critical relationships (e.g., `projects.user_id` is set to NULL if a user is deleted, preserving the project data).

---

## 🚀 Performance Scaling

### Materialized Views (PostgreSQL)
For slow dashboard statistics, we use **Materialized Views**. These pre-calculate complex aggregations and store them as a physical table.

**Implemented View: `jobs_per_month`**
- Calculates job counts and total values grouped by month and status.
- Can be refreshed concurrently to avoid locking the view during updates.

```javascript
// To refresh the view (e.g., in a cron job)
await db.refreshMaterializedView('jobs_per_month');
```

### Query Timeouts
To prevent a single "heavy" query from exhausting database resources, we have implemented a global **Statement Timeout** in the PostgreSQL pool configuration.
- **Default**: 30 seconds.
- Queries exceeding this limit will be automatically terminated by the database.

---

## 🌍 Advanced Scaling Patterns

### Multi-Region Replication
For low-latency access across different geographic regions (e.g., US and Europe):

1. **Read Replicas**: Deploy read-only replicas in target regions.
2. **Global Server Load Balancing (GSLB)**: Route users to the nearest regional endpoint.
3. **Application Routing**:
   - Send `SELECT` queries to the local regional replica.
   - Send `INSERT/UPDATE/DELETE` queries to the primary database (usually in the US).
4. **Data Locality**: For "Settings" or "User Profiles", consider using a globally distributed key-value store or local caching with invalidation.

### WAL Archiving & Point-in-Time Recovery (PITR)
For disaster recovery beyond simple backups, set up Write-Ahead Logging (WAL) archiving.

#### 1. PostgreSQL WAL Archiving to S3
Configure `postgresql.conf`:
```conf
archive_mode = on
archive_command = 'aws s3 cp %p s3://my-opensite-backups/wal/%f'
```
This allows you to restore the database to any specific second in the past if corruption occurs.

#### 2. SQLite WAL Archiving
If staying on SQLite, use **Litestream** for real-time replication to S3:
```bash
litestream replicate /path/to/opensite.db s3://my-opensite-backups/replication
```

---

## 🛡️ Disaster Recovery Strategy

1. **Daily Backups**: Automated full backups (implemented in `DatabaseService.backup()`).
2. **WAL Archiving**: Real-time transaction logging to off-site storage.
3. **Health Checks**: Automated monitoring of pool connections and query latency.
4. **Regular Testing**: Periodically practice restoring from WAL archives to verify PITR capability.
