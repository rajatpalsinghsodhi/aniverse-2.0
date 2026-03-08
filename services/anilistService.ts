
export const anilistService = {
  /**
   * Fetches advanced title metadata and IDs to ensure we find the right stream
   */
  async getMapping(title: string): Promise<{ english: string; romaji: string; native: string; id: number } | null> {
    const query = `
      query ($search: String) {
        Media (search: $search, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
        }
      }
    `;

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query, variables: { search: title } })
      });
      const json = await response.json();
      const media = json.data?.Media;
      return media ? {
        english: media.title.english,
        romaji: media.title.romaji,
        native: media.title.native,
        id: media.id
      } : null;
    } catch (e) {
      console.error("AniList mapping failed", e);
      return null;
    }
  }
};
