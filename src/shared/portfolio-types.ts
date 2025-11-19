/**
 * Portfolio Builder - Type Definitions
 * Phase 2: Block System Types
 */

/** 기본 프로필 정보 (Phase 1) */
export interface Profile {
  name: string;
  company: string;
}

/** 이력 블록 */
export interface Experience {
  id: string;
  company: string;
  role: string;
  period: string; // 예: "2020.03 - 2023.12" 또는 "2020.03 - 현재"
  duties: string; // 주요 업무 (줄바꿈은 \n으로 구분)
}

/** 프로젝트 블록 */
export interface Project {
  id: string;
  name: string;
  description: string;
  period: string;
  techStack: string[]; // 기술 스택 배열 (예: ["React", "TypeScript", "Node.js"])
  link?: string; // 선택적 프로젝트 링크
}

/** 기술 스택 카테고리 */
export type SkillCategory = "frontend" | "backend" | "devops" | "database" | "tools" | "etc";

/** 기술 스택 블록 */
export interface Skills {
  [category: string]: string[]; // 카테고리별 기술 스택
}

/** 학력 블록 */
export interface Education {
  id: string;
  school: string;
  major: string;
  period: string;
  degree: string; // 예: "학사", "석사", "박사"
}

/** 전체 포트폴리오 상태 (Widget State) */
export interface PortfolioState {
  profile: Profile;
  experiences: Experience[];
  projects: Project[];
  skills: Skills;
  education: Education[];
}

/** 초기 상태 */
export const initialPortfolioState: PortfolioState = {
  profile: {
    name: "",
    company: "",
  },
  experiences: [],
  projects: [],
  skills: {
    frontend: [],
    backend: [],
    devops: [],
    database: [],
    tools: [],
    etc: [],
  },
  education: [],
};

/** 블록 타입 */
export type BlockType = "experience" | "project" | "skill" | "education";

/** 블록 추가/삭제를 위한 유틸리티 함수 타입 */
export type AddBlockFn<T> = (block: Omit<T, "id">) => void;
export type RemoveBlockFn = (id: string) => void;
export type UpdateBlockFn<T> = (id: string, updates: Partial<T>) => void;
