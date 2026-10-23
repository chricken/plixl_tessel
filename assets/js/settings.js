/**
 * Central defaults for the app. Adjust here — no other file needs to change.
 */
export const settings = {
  // Default width of the rendered image (height defaults to 16:9 of this width)
  defaultWidth: 1280,
  // Mosaic strategy: 'brightness' | 'color' | 'brightness-color' | 'random'
  defaultStrategy: 'brightness-color',
  // Layout: 'grid' | 'stochastic'
  defaultLayout: 'grid',
  // Keep the original aspect ratio of the source images
  defaultKeepAspectRatio: false,
  // Default number of images placed in the mosaic
  defaultNumberOfImages: 200,
  // Folders under images/source/ that hold the default source images
  defaultSourceFolders: ['faces', 'forms'],
  // File name template for default source images; each run of '#' is replaced
  // by the zero-padded image number (#### = four digits), e.g. img_0001.jpg
  fileNameTemplate: 'img_####.jpg',
};
