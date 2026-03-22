
export type AnalysisMode = 'standard' | 'causal' | 'probabilistic' | 'abstract';

export interface Scenario {
  title: string;
  probability: number;
  analysis: string;
}

export interface Artifact {
  id: string;
  type: 'code' | 'text/markdown';
  title: string;
  content: string;
  language?: string;
}

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  image?: string;
  title?: string;
  feedback?: 'liked' | 'disliked';
  explanation?: string;
  isExplanationLoading?: boolean;
  scenarios?: Scenario[];
  isSimulating?: boolean;
  isThinking?: boolean;
  artifacts?: Artifact[];
}
