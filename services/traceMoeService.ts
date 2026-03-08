import { IdentificationResult } from "../types";

const API_BASE = "https://api.trace.moe";

interface TraceMoeResponse {
  frameCount: number;
  error: string;
  result: IdentificationResult[];
}

export const traceMoeService = {
  async identifyAnime(imageBlob: Blob): Promise<IdentificationResult[]> {
    const formData = new FormData();
    formData.append("image", imageBlob);

    const response = await fetch(`${API_BASE}/search?anilistInfo&cutBorders`, {
      method: "POST",
      body: formData,
    });

    return handleResponse(response);
  },

  async identifyAnimeByUrl(imageUrl: string): Promise<IdentificationResult[]> {
    const response = await fetch(
      `${API_BASE}/search?anilistInfo&cutBorders&url=${encodeURIComponent(imageUrl)}`,
    );

    return handleResponse(response);
  },
};

async function handleResponse(response: Response): Promise<IdentificationResult[]> {
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `trace.moe returned ${response.status}`);
  }

  const data: TraceMoeResponse = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.result;
}
