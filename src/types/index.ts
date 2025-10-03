export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  image?: string;
  title?: string;
  explanation?: string;
  isExplanationLoading?: boolean;
}
