DROP TABLE IF EXISTS admins; CREATE TABLE admins (
    [id] INTEGER PRIMARY KEY,
    [fullname] TEXT NOT NULL,
    [username] TEXT NOT NULL,
    [email] TEXT UNIQUE
);
DROP TABLE IF EXISTS assessors; CREATE TABLE assessors (
    [id] INTEGER PRIMARY KEY,
    [fullname] TEXT NOT NULL,
    [username] TEXT NOT NULL,
    [email] TEXT UNIQUE
);
DROP TABLE IF EXISTS organizations; CREATE TABLE organizations (
    [id] INTEGER PRIMARY KEY,
    [name] TEXT NOT NULL,
    [address] TEXT
);
DROP TABLE IF EXISTS tools; CREATE TABLE tools (
    [id] TEXT PRIMARY KEY,
    [category] TEXT CHECK (category IN('self', 'case', 'f2f', 'group')) NOT NULL,
    [title] TEXT NOT NULL,
    [version] TEXT
);
DROP TABLE IF EXISTS slots; CREATE TABLE slots (
    [id] INTEGER PRIMARY KEY,
    [modules] INTEGER CHECK(modules IN(1,2,3,4)) NOT NULL,
    [mode] TEXT NOT NULL,
    [slot1] TEXT CHECK (slot1 IN('self', 'case', 'f2f', 'group')),
    [slot2] TEXT CHECK (slot2 IN('self', 'case', 'f2f', 'group')),
    [slot3] TEXT CHECK (slot3 IN('self', 'case', 'f2f', 'group')),
    [slot4] TEXT CHECK (slot4 IN('self', 'case', 'f2f', 'group'))
);
DROP TABLE IF EXISTS batches; CREATE TABLE batches (
    [id] INTEGER PRIMARY KEY,
    [org_id] INTEGER NOT NULL,
    [name] TEXT NOT NULL,
    [date] TEXT,
    [mode] TEXT,
    [slot_split] INTEGER CHECK(slot_split IN(1, 2, 3, 4)) NOT NULL DEFAULT 1,
    [on_self] TEXT,
    [on_case] TEXT,
    [on_f2f] TEXT,
    [on_group] TEXT, -- if not null then need grouping
    [time1] TEXT,
    [time2] TEXT,
    [time3] TEXT,
    [time4] TEXT
);
DROP TABLE IF EXISTS persons; CREATE TABLE persons (
    [id] TEXT PRIMARY KEY,
    [org_id] INTEGER NOT NULL,
    [batch_id] INTEGER NOT NULL,
    [fullname] TEXT NOT NULL,
    [username] TEXT NOT NULL,
    [email] TEXT,
    UNIQUE(batch_id, email)
);
DROP TABLE IF EXISTS groups; CREATE TABLE groups (
    [id] TEXT PRIMARY KEY,
    [batch_id] INTEGER NOT NULL,
    [name] TEXT NOT NULL,
    [slot_id] TEXT,
    [group_ass_id] INTEGER
);
DROP TABLE IF EXISTS groupings; CREATE TABLE groupings (
    batch_id INTEGER NOT NULL,
    group_id TEXT NOT NULL,
    person_id TEXT NOT NULL,
    f2f_ass_id TEXT,
    case_ass_id TEXT,
    PRIMARY KEY (batch_id, person_id)
);
-- Org Info
DROP VIEW IF EXISTS vorgs; CREATE VIEW vorgs AS SELECT
    o.*,
    (SELECT COUNT(*) FROM batches WHERE org_id=o.id) batches
    FROM organizations o;
-- Batch info
DROP VIEW IF EXISTS vbatches; CREATE VIEW vbatches AS SELECT
    b.*,
    o.name org_name,
    s.modules,
    t1.title mod_self,
    t2.title mod_case,
    t3.title mod_f2f,
    t4.title mod_group,
    (CASE WHEN on_group IS NOT NULL THEN 'group' ELSE 'slot' END) group_type,
    (CASE WHEN (on_group IS NOT NULL OR on_f2f IS NOT NULL) THEN 1 ELSE 0 END) need_assessors,
    (SELECT COUNT(*) from persons WHERE batch_id=b.id) persons,
    (SELECT COUNT(*) from groups WHERE batch_id=b.id) groups
    FROM batches b
    LEFT JOIN organizations o ON b.org_id=o.id
    LEFT JOIN slots s ON b.mode=s.mode
    left join tools t1 on b.on_self=t1.id
    left join tools t2 on b.on_case=t2.id
    left join tools t3 on b.on_f2f=t3.id
    left join tools t4 on b.on_group=t4.id
    GROUP BY b.id;
-- VGroup
DROP VIEW IF EXISTS vgroups; CREATE VIEW groups AS SELECT
    gr.*,
    a.fullname group_assessor_name,
    (SELECT COUNT(*) FROM groupings WHERE group_id=gr.id) members,
    s.slot1, s.slot2, s.slot3, s.slot4
    FROM groups gr
    LEFT JOIN slots s ON gr.slot_id=s.id
    LEFT JOIN assessors a ON gr.group_ass_id=a.id;
-- View persons_sessions
DROP VIEW IF EXISTS persons_sessions; CREATE VIEW persons_sessions AS SELECT
    gr.*,
    p.fullname person_name,
    a1.fullname group_assessor,
    a2.fullname f2f_assessor,
    -- on_self, on_case, on_f2f, on_group,
    slot1, slot2, slot3, slot4
    FROM groupings gr
    LEFT JOIN batches b ON gr.batch_id=b.id
    LEFT JOIN persons p ON gr.person_id=p.id
    LEFT JOIN groups g ON gr.group_id=g.id
    LEFT JOIN assessors a1 ON g.group_ass_id=a1.id
    LEFT JOIN assessors a2 ON gr.f2f_ass_id=a2.id
    LEFT JOIN slots s ON g.slot_id=s.id;
-- View
DROP VIEW IF EXISTS vpersons; CREATE VIEW vpersons AS
    SELECT p.*,
    gg.group_id,
    gp.name group_name,
    gg.f2f_ass_id,
    gg.case_ass_id
    FROM persons p
    LEFT JOIN groupings gg ON p.id=gg.person_id
    LEFT JOIN groups gp ON gg.group_id=gp.id;
-- kebutuhan asesor grup
SELECT
    (SELECT COUNT(id) FROM groups_sessions WHERE slot1='group' AND batch_id=g.batch_id) group_slot1,
    (SELECT COUNT(id) FROM groups_sessions WHERE slot2='group' AND batch_id=g.batch_id) group_slot2,
    (SELECT COUNT(id) FROM groups_sessions WHERE slot3='group' AND batch_id=g.batch_id) group_slot3,
    (SELECT COUNT(id) FROM groups_sessions WHERE slot4='group' AND batch_id=g.batch_id) group_slot4,
    (SELECT COUNT(id) FROM groups_sessions WHERE slot1='f2f' AND batch_id=g.batch_id) f2f_slot1,
    (SELECT COUNT(id) FROM groups_sessions WHERE slot2='f2f' AND batch_id=g.batch_id) f2f_slot2,
    (SELECT COUNT(id) FROM groups_sessions WHERE slot3='f2f' AND batch_id=g.batch_id) f2f_slot3,
    (SELECT COUNT(id) FROM groups_sessions WHERE slot4='f2f' AND batch_id=g.batch_id) f2f_slot4
    FROM groups_sessions g
    WHERE g.batch_id=104
    GROUP BY g.batch_id;
SELECT id,
    (SELECT id FROM groups_sessions WHERE slot1='f2f' AND batch_id=g.batch_id),
    (SELECT members FROM groups_sessions WHERE slot1='f2f' AND batch_id=g.batch_id)
    FROM groups_sessions g
    WHERE g.batch_id=104
    GROUP BY g.id;

