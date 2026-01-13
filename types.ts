export enum AspectRatio {
  Wide16_9 = "16:9",
  Cinema2_39_1 = "2.39:1",
  Portrait9_16 = "9:16",
  Square1_1 = "1:1",
  Classic4_3 = "4:3"
}

export enum ShotCount {
  Three = 3,
  Four = 4,
  Six = 6,
  Nine = 9,
  Sixteen = 16,
  Twenty = 20
}

export interface GlobalParams {
  theme: string;
  environment: string;
  lighting: string;
  artistStyle: string;
  camera: string;
  colorGrade: string;
}

export interface GeneratedData {
  shot: string; // The "3x3 Grid..." description
  subjectIntro: string; // The main scene description
  shots: Array<{
    id: number;
    title: string;
    content: string; // The specific Camera/Comp/Char block for this shot
    shortContent: string; // Condensed version
  }>;
  globalParams: GlobalParams;
}

export interface UserConfig {
  shotCount: ShotCount;
  aspectRatio: AspectRatio;
  additionalNotes: string;
  mainDescription: string;
}

// --- New Types for Transition Feature ---

export interface TransitionConfig {
  transitionCount: 1 | 2 | 3;
  additionalNotes: string;
}

export interface TransitionResult {
  analysis: string; // AI's analysis of the uploaded storyboard style
  transitions: Array<{
    fromShotIndex: number;
    toShotIndex: number;
    transitionPrompts: Array<{
      order: number;
      content: string;
    }>;
  }>;
}