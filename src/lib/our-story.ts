import prisma from '@/lib/db';
import { DEFAULT_OUR_STORY, type OurStoryContent } from '@/lib/our-story-defaults';

export { DEFAULT_OUR_STORY };
export type { OurStoryContent };

export async function getOurStory(): Promise<OurStoryContent> {
  try {
    const sec = await prisma.websiteSection.findUnique({ where: { sectionKey: 'our_story' } });
    if (!sec) return DEFAULT_OUR_STORY;
    const c = JSON.parse(sec.contentJson || '{}');
    const merged = { ...DEFAULT_OUR_STORY, ...c };
    merged.storyParagraphs = Array.isArray(c.storyParagraphs) ? c.storyParagraphs.filter(Boolean) : DEFAULT_OUR_STORY.storyParagraphs;
    merged.pillars = Array.isArray(c.pillars) ? c.pillars.filter((p: any) => p && (p.title || p.text)) : DEFAULT_OUR_STORY.pillars;
    return merged;
  } catch {
    return DEFAULT_OUR_STORY;
  }
}
