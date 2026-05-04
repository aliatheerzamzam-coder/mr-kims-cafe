import type { Agent } from '@/lib/types';

export const AGENTS: Agent[] = [
  // Executive
  { id: 'ceo',   team: 'ceo',         role_ko: 'CEO',                role_en: 'CEO',                  initials: 'CE', status: 'online',   model: 'Claude Opus 4.5',   tasks: 3, ctx: 142, reports: ['cfo', 'cpo', 'cto', 'cmo', 'cro', 'clo'] },
  { id: 'cfo',   team: 'cfo',         role_ko: 'CFO',                role_en: 'CFO',                  initials: 'CF', status: 'online',   model: 'Claude Opus 4.5',   tasks: 2, ctx: 88,  reports: [] },
  { id: 'cpo',   team: 'coo',         role_ko: '총괄책임자',          role_en: 'COO / Chief of Staff', initials: 'CP', status: 'thinking', model: 'Claude Opus 4.5',   tasks: 5, ctx: 211, reports: [] },

  // Product
  { id: 'pm-1',  team: 'coo',         role_ko: '프로덕트 리드',       role_en: 'Head of Product',      initials: 'HP', status: 'online',   model: 'Claude Sonnet 4.5', tasks: 4, ctx: 76 },
  { id: 'pm-2',  team: 'coo',         role_ko: '리서처',              role_en: 'Researcher',           initials: 'RS', status: 'busy',     model: 'Claude Sonnet 4.5', tasks: 2, ctx: 41 },

  // Engineering
  { id: 'cto',   team: 'developer',   role_ko: 'CTO',                 role_en: 'CTO',                  initials: 'CT', status: 'online',   model: 'Claude Opus 4.5',   tasks: 6, ctx: 188 },
  { id: 'eng-1', team: 'developer',   role_ko: '백엔드 엔지니어',     role_en: 'Backend Engineer',     initials: 'BE', status: 'busy',     model: 'Claude Sonnet 4.5', tasks: 8, ctx: 120 },
  { id: 'eng-2', team: 'developer',   role_ko: '프론트엔드 엔지니어', role_en: 'Frontend Engineer',    initials: 'FE', status: 'thinking', model: 'Claude Sonnet 4.5', tasks: 5, ctx: 94 },
  { id: 'eng-3', team: 'developer',   role_ko: 'DevOps',              role_en: 'DevOps',               initials: 'DO', status: 'online',   model: 'Claude Sonnet 4.5', tasks: 3, ctx: 62 },
  { id: 'eng-4', team: 'developer',   role_ko: 'QA',                  role_en: 'QA',                   initials: 'QA', status: 'offline',  model: 'Claude Haiku 4.5',  tasks: 0, ctx: 0 },

  // Design (maps to marketing team in server)
  { id: 'des-1', team: 'marketing',   role_ko: '디자인 리드',         role_en: 'Head of Design',       initials: 'HD', status: 'online',   model: 'Claude Sonnet 4.5', tasks: 4, ctx: 71 },
  { id: 'des-2', team: 'marketing',   role_ko: '프로덕트 디자이너',   role_en: 'Product Designer',     initials: 'PD', status: 'online',   model: 'Claude Sonnet 4.5', tasks: 3, ctx: 55 },

  // Marketing
  { id: 'cmo',   team: 'marketing',   role_ko: 'CMO',                 role_en: 'CMO',                  initials: 'CM', status: 'online',   model: 'Claude Opus 4.5',   tasks: 4, ctx: 103 },
  { id: 'mkt-1', team: 'marketing',   role_ko: '콘텐츠 작가',         role_en: 'Content Writer',       initials: 'CW', status: 'busy',     model: 'Claude Sonnet 4.5', tasks: 7, ctx: 88 },
  { id: 'mkt-2', team: 'marketing',   role_ko: '퍼포먼스 마케터',     role_en: 'Performance Marketer', initials: 'PM', status: 'thinking', model: 'Claude Sonnet 4.5', tasks: 3, ctx: 49 },
  { id: 'mkt-3', team: 'marketing',   role_ko: 'SEO 분석가',          role_en: 'SEO Analyst',          initials: 'SE', status: 'online',   model: 'Claude Haiku 4.5',  tasks: 2, ctx: 22 },

  // Sales (maps to coo team in server)
  { id: 'cro',   team: 'coo',         role_ko: 'CRO',                 role_en: 'CRO',                  initials: 'CR', status: 'online',   model: 'Claude Opus 4.5',   tasks: 3, ctx: 67 },
  { id: 'sls-1', team: 'coo',         role_ko: 'SDR',                 role_en: 'SDR',                  initials: 'SD', status: 'busy',     model: 'Claude Sonnet 4.5', tasks: 12, ctx: 144 },
  { id: 'sls-2', team: 'coo',         role_ko: 'AE',                  role_en: 'Account Executive',    initials: 'AE', status: 'online',   model: 'Claude Sonnet 4.5', tasks: 6, ctx: 81 },

  // Finance
  { id: 'fin-1', team: 'cfo',         role_ko: '재무 분석가',         role_en: 'Financial Analyst',    initials: 'FA', status: 'online',   model: 'Claude Sonnet 4.5', tasks: 3, ctx: 58 },
  { id: 'fin-2', team: 'cfo',         role_ko: '회계',                role_en: 'Accountant',           initials: 'AC', status: 'thinking', model: 'Claude Sonnet 4.5', tasks: 4, ctx: 73 },

  // Legal
  { id: 'clo',   team: 'legal',       role_ko: '법무 책임자',         role_en: 'General Counsel',      initials: 'GC', status: 'online',   model: 'Claude Opus 4.5',   tasks: 2, ctx: 95 },
  { id: 'lgl-1', team: 'legal',       role_ko: '컴플라이언스',        role_en: 'Compliance',           initials: 'CO', status: 'busy',     model: 'Claude Sonnet 4.5', tasks: 3, ctx: 64 }
];
