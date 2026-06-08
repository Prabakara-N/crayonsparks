// Optional editable text overlays drawn on top of the generated front art.
export interface FrontTextField {
  on: boolean;
  text: string;
}

export interface FrontTextModel {
  title: FrontTextField;
  tagline: FrontTextField;
  author: FrontTextField;
  pages: FrontTextField;
  titlePos: "top" | "bottom";
  color: string;
  band: boolean;
}

export function defaultFrontText(): FrontTextModel {
  return {
    title: { on: false, text: "" },
    tagline: { on: false, text: "" },
    author: { on: false, text: "" },
    pages: { on: false, text: "" },
    titlePos: "bottom",
    color: "#ffffff",
    band: true,
  };
}
