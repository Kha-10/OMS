import Resizer from 'react-image-file-resizer';

export const resizeFile = (file) => new Promise((resolve) => {
  Resizer.imageFileResizer(
    file,
    400,      // Width
    400,      // Height
    'WEBP',   // Format (can use 'JPEG', 'PNG', etc.)
    75,       // Quality (0 to 100)
    0,        // Rotation (0 degrees here)
    (uri) => {
      resolve(uri);  // Resolved as base64 image
    },
    'base64'  // Output type
  );
});