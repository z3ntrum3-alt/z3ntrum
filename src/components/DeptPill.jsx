const MAP = {
  CS: 'q-dept-cs',
  Design: 'q-dept-design',
  Eng: 'q-dept-eng',
  Bio: 'q-dept-bio',
  Econ: 'q-dept-econ',
  Lit: 'q-dept-lit',
}

export default function DeptPill({ dept }) {
  return <span className={`q-pill ${MAP[dept] || ''}`}>{dept}</span>
}
