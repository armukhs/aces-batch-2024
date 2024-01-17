DROP VIEW IF EXISTS vpersons; CREATE VIEW vpersons AS SELECT
    p.*, o.name org_name,
    gg.group_id, gr.name group_name,
    gr.group_ass_id, a3.fullname group_assessor_name,
    gg.f2f_ass_id, a1.fullname f2f_assessor_name,
    gg.case_ass_id, a2.fullname case_assessor_name,
    gr.slot_id, s.slot1, s.slot2, s.slot3, s.slot4
    FROM persons p
    LEFT JOIN organizations o ON p.org_id=o.id
    LEFT JOIN groupings gg ON p.id=gg.person_id
    LEFT JOIN groups gr ON gg.group_id=gr.id
    LEFT JOIN slots s ON gr.slot_id=s.id
    LEFT JOIN assessors a1 ON gg.f2f_ass_id=a1.id
    LEFT JOIN assessors a2 ON gg.case_ass_id=a2.id
    LEFT JOIN assessors a3 ON gr.group_ass_id=a3.id;
--

SELECT o.*,
(SELECT COUNT(*) FROM batches WHERE org_id=o.id) batches,
(SELECT COUNT(*) FROM persons WHERE org_id=o.id) heads,
(SELECT min(date) FROM batches WHERE org_id=o.id) first_batch,
(SELECT max(date) FROM batches WHERE org_id=o.id) last_batch
FROM organizations o

SELECT
    batch_id,
    (SELECT count(*) FROM v_groups WHERE slot1='group' AND batch_id=g.batch_id) AS group_slot1_num,
    (SELECT count(*) FROM v_groups WHERE slot2='group' AND batch_id=g.batch_id) AS group_slot2_num,
    (SELECT count(*) FROM v_groups WHERE slot3='group' AND batch_id=g.batch_id) AS group_slot3_num,
    (SELECT count(*) FROM v_groups WHERE slot4='group' AND batch_id=g.batch_id) AS group_slot4_num,
    (SELECT count(*) FROM v_groups WHERE slot1='f2f' AND batch_id=g.batch_id) AS f2f_slot1_num,
    (SELECT count(*) FROM v_groups WHERE slot2='f2f' AND batch_id=g.batch_id) AS f2f_slot2_num,
    (SELECT count(*) FROM v_groups WHERE slot3='f2f' AND batch_id=g.batch_id) AS f2f_slot3_num,
    (SELECT count(*) FROM v_groups WHERE slot4='f2f' AND batch_id=g.batch_id) AS f2f_slot4_num,
    (SELECT sum(members + 0) FROM v_groups WHERE slot1='f2f' AND batch_id=g.batch_id) AS f2f_slot1_size,
    (SELECT sum(members + 0) FROM v_groups WHERE slot2='f2f' AND batch_id=g.batch_id) AS f2f_slot2_size,
    (SELECT sum(members + 0) FROM v_groups WHERE slot3='f2f' AND batch_id=g.batch_id) AS f2f_slot3_size,
    (SELECT sum(members + 0) FROM v_groups WHERE slot4='f2f' AND batch_id=g.batch_id) AS f2f_slot4_size,
    (select COUNT(distinct slot_id) from groups where batch_id=g.batch_id)
    FROM v_groups g
    WHERE g.batch_id=1105 GROUP BY batch_id;

-- number of slot permutations in a batch
select id, (select count(distinct slot_id) from groups where batch_id=b.id) from batches b where id=1103;


-- self
-- case
-- f2f
-- lgd

-- self
-- case
-- face
-- grup

select lgd_ass_id, lgd_assessor_name from v_groups where lgd_ass_id is not null

-- find persons
select person_id
from groupings
where batch_id=1103;
left join

select ba.*, fullname from batch_assessors ba left join assessors a on ba.assessor_id=a.id;

-- GROUPINGS WITH SLOT INFO
-- groups.slot_id
-- grouping.group_id
SELECT
    gg.*, s.pself, s.pcase, s.pf2f, s.plgd
    FROM groupings gg
    LEFT JOIN groups gr ON gg.group_id=gr.id
    LEFT JOIN slots s ON gr.slot_id=s.id;