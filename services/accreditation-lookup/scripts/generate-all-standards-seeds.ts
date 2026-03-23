import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../data/standards');

const ACCREDITOR_REGISTRY: Array<{ org_key: string; name: string; branches: Array<{ code: string; title: string; leaves: string[] }> }> = [
  { org_key: 'ABET', name: 'Accreditation Board for Engineering and Technology', branches: [{ code: 'SO', title: 'Student Outcomes', leaves: ['SO-1 Apply knowledge', 'SO-2 Design and conduct experiments', 'SO-3 Design system/component'] }, { code: 'PC', title: 'Program Criteria', leaves: ['Program-specific criteria apply'] }, { code: 'CURR', title: 'Curriculum', leaves: ['Mathematics and basic sciences', 'Engineering topics', 'General education'] }] },
  { org_key: 'AACSB', name: 'Association to Advance Collegiate Schools of Business', branches: [{ code: 'STRAT', title: 'Strategic Management', leaves: ['Mission', 'Innovation', 'Engagement'] }, { code: 'PART', title: 'Participants', leaves: ['Students', 'Faculty', 'Staff'] }, { code: 'LRN', title: 'Learning and Teaching', leaves: ['Curriculum', 'Assurance of learning'] }] },
  { org_key: 'ACAE', name: 'American Council for Acupuncture and Oriental Medicine', branches: [{ code: 'PROG', title: 'Program Standards', leaves: ['Curriculum structure', 'Clinical training', 'Faculty qualifications'] }] },
  { org_key: 'ACEN', name: 'Accreditation Commission for Education in Nursing', branches: [{ code: 'MISSION', title: 'Mission and Administration', leaves: ['Mission', 'Governance', 'Resources'] }, { code: 'CURR', title: 'Curriculum', leaves: ['Program outcomes', 'Clinical experiences'] }, { code: 'FAC', title: 'Faculty and Students', leaves: ['Faculty qualifications', 'Student services'] }] },
  { org_key: 'CCNE', name: 'Commission on Collegiate Nursing Education', branches: [{ code: 'I', title: 'Program Quality', leaves: ['Mission and governance', 'Institutional commitment'] }, { code: 'II', title: 'Program Quality', leaves: ['Curriculum and teaching-learning', 'Student outcomes'] }, { code: 'III', title: 'Program Quality', leaves: ['Faculty and staff', 'Resources'] }] },
  { org_key: 'ACPHA', name: 'Accreditation Commission for Programs in Hospitality Administration', branches: [{ code: 'PROG', title: 'Program Standards', leaves: ['Curriculum', 'Faculty', 'Resources'] }] },
  { org_key: 'ACBSP', name: 'Accreditation Council for Business Schools and Programs', branches: [{ code: 'LEAD', title: 'Leadership', leaves: ['Strategic planning', 'Stakeholder focus'] }, { code: 'STU', title: 'Student Learning', leaves: ['Outcomes assessment', 'Continuous improvement'] }] },
  { org_key: 'ACPE', name: 'Accreditation Council for Pharmacy Education', branches: [{ code: 'STAND', title: 'Standards', leaves: ['Curriculum', 'Professional competencies', 'Assessment'] }] },
  { org_key: 'ARC_PA', name: 'Accreditation Review Commission on Education for the Physician Assistant', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Didactic', 'Clinical', 'Assessment'] }, { code: 'ADMIN', title: 'Administration', leaves: ['Faculty', 'Resources', 'Students'] }] },
  { org_key: 'ACEJMC', name: 'Accrediting Council on Education in Journalism and Mass Communications', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Core competencies', 'Professional values'] }, { code: 'DIV', title: 'Diversity and Inclusion', leaves: ['Recruitment', 'Retention'] }] },
  { org_key: 'ABFSE', name: 'American Board of Funeral Service Education', branches: [{ code: 'PROG', title: 'Program Standards', leaves: ['Curriculum', 'Faculty', 'Facilities'] }] },
  { org_key: 'ACCE', name: 'American Council for Construction Education', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Core content', 'Assessment'] }, { code: 'FAC', title: 'Faculty and Resources', leaves: ['Qualifications', 'Support'] }] },
  { org_key: 'ACFEF', name: 'American Culinary Federation Education Foundation', branches: [{ code: 'PROG', title: 'Program Standards', leaves: ['Curriculum', 'Facilities', 'Faculty'] }] },
  { org_key: 'ALA', name: 'American Library Association', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Core competencies', 'Assessment'] }] },
  { org_key: 'AOTA', name: 'American Occupational Therapy Association', branches: [{ code: 'ACOTE', title: 'ACOTE Standards', leaves: ['Curriculum', 'Fieldwork', 'Faculty'] }] },
  { org_key: 'ACOTE', name: 'Accreditation Council for Occupational Therapy Education', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Content', 'Experiential component'] }, { code: 'ADMIN', title: 'Administration', leaves: ['Faculty', 'Resources'] }] },
  { org_key: 'APTA', name: 'American Physical Therapy Association', branches: [{ code: 'CAPTE', title: 'CAPTE Standards', leaves: ['Curriculum', 'Clinical education'] }] },
  { org_key: 'CAPTE', name: 'Commission on Accreditation in Physical Therapy Education', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Didactic', 'Clinical', 'Assessment'] }] },
  { org_key: 'APMA', name: 'American Podiatric Medical Association', branches: [{ code: 'CPME', title: 'CPME Standards', leaves: ['Curriculum', 'Clinical'] }] },
  { org_key: 'CPME', name: 'Council on Podiatric Medical Education', branches: [{ code: 'PROG', title: 'Program Standards', leaves: ['Curriculum', 'Faculty', 'Resources'] }] },
  { org_key: 'APA', name: 'American Psychological Association', branches: [{ code: 'DOM', title: 'Domains', leaves: ['Knowledge', 'Skills', 'Values'] }, { code: 'IMPL', title: 'Implementation', leaves: ['Curriculum', 'Competency assessment'] }] },
  { org_key: 'AVMA', name: 'American Veterinary Medical Association', branches: [{ code: 'STAND', title: 'Standards', leaves: ['Organization', 'Resources', 'Curriculum', 'Outcomes'] }] },
  { org_key: 'AAQEP', name: 'Association for Advancing Quality in Educator Preparation', branches: [{ code: 'QUAL', title: 'Quality Principles', leaves: ['Program design', 'Evidence', 'Improvement'] }] },
  { org_key: 'ABAI', name: 'Association for Behavior Analysis International', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Content', 'Supervised experience'] }] },
  { org_key: 'AERAC', name: 'Accreditation of Entertainment, Recreation and Leisure Education', branches: [{ code: 'PROG', title: 'Program Standards', leaves: ['Curriculum', 'Faculty', 'Assessment'] }] },
  { org_key: 'ATMAE', name: 'Association of Technology, Management, and Applied Engineering', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Technical content', 'Management', 'Assessment'] }] },
  { org_key: 'AABI', name: 'Aviation Accreditation Board International', branches: [{ code: 'STAND', title: 'Standards', leaves: ['Curriculum', 'Faculty', 'Resources'] }] },
  { org_key: 'CAHIIM', name: 'Commission on Accreditation for Health Informatics and Information Management', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Core competencies', 'Assessment'] }] },
  { org_key: 'COAMFTE', name: 'Commission on Accreditation for Marriage and Family Therapy Education', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Core curriculum', 'Clinical training'] }, { code: 'FAC', title: 'Faculty', leaves: ['Qualifications', 'Supervision'] }] },
  { org_key: 'AAMFT', name: 'American Association for Marriage and Family Therapy', branches: [{ code: 'COAMFTE', title: 'COAMFTE Standards', leaves: ['Curriculum', 'Clinical', 'Faculty'] }] },
  { org_key: 'COARC', name: 'Commission on Accreditation for Respiratory Care', branches: [{ code: 'PROG', title: 'Program Standards', leaves: ['Curriculum', 'Clinical', 'Faculty'] }] },
  { org_key: 'CAAHEP', name: 'Commission on Accreditation of Allied Health Education Programs', branches: [{ code: 'STAND', title: 'Standards', leaves: ['Curriculum', 'Clinical', 'Resources'] }] },
  { org_key: 'CAATE', name: 'Commission on Accreditation of Athletic Training Education', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Content', 'Clinical experience'] }] },
  { org_key: 'CAHME', name: 'Commission on Accreditation of Healthcare Management Education', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Core competencies', 'Assessment'] }] },
  { org_key: 'CAMPEP', name: 'Commission on Accreditation of Medical Physics Education Programs', branches: [{ code: 'PROG', title: 'Program Standards', leaves: ['Curriculum', 'Clinical', 'Faculty'] }] },
  { org_key: 'COA', name: 'Council on Accreditation', branches: [{ code: 'STAND', title: 'Standards', leaves: ['Program quality', 'Outcomes', 'Resources'] }] },
  { org_key: 'COSMA', name: 'Commission on Sport Management Accreditation', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Core content', 'Assessment'] }] },
  { org_key: 'CACREP', name: 'Council for Accreditation of Counseling and Related Educational Programs', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Core areas', 'Specialty'] }, { code: 'CLIN', title: 'Clinical', leaves: ['Practicum', 'Internship'] }] },
  { org_key: 'CIDA', name: 'Council for Interior Design Accreditation', branches: [{ code: 'STAND', title: 'Standards', leaves: ['Curriculum', 'Faculty', 'Resources'] }] },
  { org_key: 'CSHSE', name: 'Council for Standards in Human Service Education', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Knowledge and skills', 'Field experience'] }] },
  { org_key: 'CAA', name: 'Council on Academic Accreditation in Audiology and Speech-Language Pathology', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Knowledge and skills', 'Clinical practicum'] }] },
  { org_key: 'ASHA', name: 'American Speech-Language-Hearing Association', branches: [{ code: 'CAA', title: 'CAA Standards', leaves: ['Curriculum', 'Clinical', 'Assessment'] }] },
  { org_key: 'COA_NAEP', name: 'Council for the Accreditation of Educator Preparation (NAEP)', branches: [{ code: 'STAND', title: 'Standards', leaves: ['Content', 'Clinical', 'Candidate quality'] }] },
  { org_key: 'COAPRT', name: 'Council on Accreditation of Parks, Recreation, Tourism and Related Professions', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Core content', 'Experiential'] }] },
  { org_key: 'CCE', name: 'Council on Chiropractic Education', branches: [{ code: 'STAND', title: 'Standards', leaves: ['Curriculum', 'Clinical', 'Faculty'] }] },
  { org_key: 'CORE', name: 'Council on Rehabilitation Education', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Core competencies', 'Practicum'] }] },
  { org_key: 'CSWE', name: 'Council on Social Work Education', branches: [{ code: 'EPAS', title: 'Educational Policy and Accreditation Standards', leaves: ['Competencies', 'Curriculum', 'Assessment'] }] },
  { org_key: 'IACBE', name: 'International Accreditation Council for Business Education', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Outcomes', 'Assessment'] }, { code: 'FAC', title: 'Faculty', leaves: ['Qualifications', 'Development'] }] },
  { org_key: 'JRCERT', name: 'Joint Review Committee on Education in Radiologic Technology', branches: [{ code: 'STAND', title: 'Standards', leaves: ['Curriculum', 'Clinical', 'Resources'] }] },
  { org_key: 'JRCNMT', name: 'Joint Review Committee on Educational Programs in Nuclear Medicine Technology', branches: [{ code: 'PROG', title: 'Program Standards', leaves: ['Curriculum', 'Clinical', 'Faculty'] }] },
  { org_key: 'LAAB', name: 'Landscape Architectural Accreditation Board', branches: [{ code: 'STAND', title: 'Standards', leaves: ['Curriculum', 'Faculty', 'Resources'] }] },
  { org_key: 'ASLA', name: 'American Society of Landscape Architects', branches: [{ code: 'LAAB', title: 'LAAB Standards', leaves: ['Program criteria', 'Assessment'] }] },
  { org_key: 'MPCAC', name: 'Master\u2019s in Psychology and Counseling Accreditation Council', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Core content', 'Practicum'] }] },
  { org_key: 'NAACLS', name: 'National Accrediting Agency for Clinical Laboratory Sciences', branches: [{ code: 'STAND', title: 'Standards', leaves: ['Curriculum', 'Clinical', 'Faculty'] }] },
  { org_key: 'NAEYC', name: 'National Association for the Education of Young Children', branches: [{ code: 'STAND', title: 'Standards', leaves: ['Curriculum', 'Assessment', 'Clinical'] }] },
  { org_key: 'NASP', name: 'National Association of School Psychologists', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Domains', 'Practicum', 'Internship'] }] },
  { org_key: 'NASPAA', name: 'Network of Schools of Public Policy, Affairs, and Administration', branches: [{ code: 'COPRA', title: 'COPRA Standards', leaves: ['Mission', 'Governance', 'Curriculum', 'Faculty'] }] },
  { org_key: 'COPRA', name: 'Commission on Peer Review and Accreditation', branches: [{ code: 'STAND', title: 'Standards', leaves: ['Mission', 'Program evaluation', 'Student learning'] }] },
  { org_key: 'PAB', name: 'Planning Accreditation Board', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Core knowledge', 'Skills', 'Values'] }] },
  { org_key: 'PCSAS', name: 'Psychological Clinical Science Accreditation System', branches: [{ code: 'SCI', title: 'Clinical Science', leaves: ['Scientific training', 'Clinical competency'] }] },
  { org_key: 'FEPAC', name: 'Forensic Science Education Programs Accreditation Commission', branches: [{ code: 'CURR', title: 'Curriculum', leaves: ['Core content', 'Laboratory'] }] },
];

function toNodes(org_key: string, branches: Array<{ code: string; title: string; leaves: string[] }>): any[] {
  const nodes: any[] = [];
  let sortOrder = 10;
  for (const b of branches) {
    const groupId = `${org_key}-G-${b.code}`;
    nodes.push({ public_id: groupId, parent_public_id: null, group_code: b.code, title: b.title, kind: 'group', sort_order: sortOrder++ });
    for (let i = 0; i < b.leaves.length; i++) {
      nodes.push({ public_id: `${org_key}-${b.code}-${String(i + 1).padStart(2, '0')}`, parent_public_id: groupId, group_code: b.code, title: b.leaves[i], kind: 'leaf', sort_order: sortOrder++ });
    }
    sortOrder += 5;
  }
  return nodes;
}

function main() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const existing = new Set(fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '').toLowerCase()));
  let created = 0;
  for (const acc of ACCREDITOR_REGISTRY) {
    const fname = `${acc.org_key.toLowerCase()}.json`;
    const fpath = path.join(DATA_DIR, fname);
    if (fs.existsSync(fpath)) continue;
    const nodes = toNodes(acc.org_key, acc.branches);
    const obj = { org_key: acc.org_key, name: acc.name, display_name: acc.org_key, source_note: 'Template structure; refine against official publications.', nodes };
    fs.writeFileSync(fpath, JSON.stringify(obj, null, 2));
    created++;
    console.log('Created', fname);
  }
  console.log(`Done. Created ${created} new seed files (${existing.size + created} total in registry).`);
}

main();
