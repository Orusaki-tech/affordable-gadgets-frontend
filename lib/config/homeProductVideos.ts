/**
 * Homepage product / testimonial-style video reel.
 * Replace or load from your API when product-specific clips are available.
 */
export type HomeProductVideo = {
  id: string;
  /** Shown when the video is paused (accessibility + loading state). */
  title: string;
  /** Full URL to MP4 (or other) video. */
  src: string;
  /** Optional poster image URL. */
  poster?: string | null;
};

/** Demo clips (public samples) — swap for your CDN or CMS entries. */
export const HOME_PRODUCT_VIDEOS: HomeProductVideo[] = [
  {
    id: 'demo-1',
    title: 'Sample: product spotlight',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
  },
  {
    id: 'demo-2',
    title: 'Sample: unboxing style',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
  },
  {
    id: 'demo-3',
    title: 'Sample: customer story',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
  },
  {
    id: 'demo-4',
    title: 'Sample: details close-up',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
  },
  {
    id: 'demo-5',
    title: 'Sample: walkthrough',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
  },
];
