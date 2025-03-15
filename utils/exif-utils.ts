import EXIF from "exif-js";

/**
 * Extracts location data from image EXIF metadata
 */
export function extractExifDataFromArrayBuffer(arrayBuffer: ArrayBuffer) {
  const dv = new DataView(arrayBuffer);
  let offset = 0;
  let latitude: number | undefined;
  let longitude: number | undefined;

  // Check for JPEG SOI marker
  if (dv.getUint16(0, false) !== 0xffd8) {
    return null;
  }

  offset += 2;

  // Look for APP1 marker (EXIF data)
  while (offset < dv.byteLength) {
    if (offset + 2 > dv.byteLength) break;

    const marker = dv.getUint16(offset, false);
    offset += 2;

    // APP1 marker (0xFFE1)
    if (marker === 0xffe1) {
      if (offset + 2 > dv.byteLength) break;

      const length = dv.getUint16(offset, false);
      if (offset + length > dv.byteLength) break;

      // Check for "Exif" string
      if (
        offset + 6 <= dv.byteLength &&
        dv.getUint32(offset + 2, false) === 0x45786966 && // "Exif"
        dv.getUint16(offset + 6, false) === 0x0000
      ) {
        // followed by two 0 bytes

        const tiffOffset = offset + 8; // Start of TIFF header

        // Check byte order
        if (tiffOffset + 4 > dv.byteLength) break;

        const byteOrder = dv.getUint16(tiffOffset, false);
        const littleEndian = byteOrder === 0x4949; // 'II' for Intel byte order

        // Check TIFF header
        if (dv.getUint16(tiffOffset + 2, littleEndian) !== 0x002a) break;

        // Get offset to first IFD
        const firstIFDOffset = dv.getUint32(tiffOffset + 4, littleEndian);
        const ifdOffset = tiffOffset + firstIFDOffset;

        if (ifdOffset + 2 > dv.byteLength) break;

        // Number of directory entries
        const numEntries = dv.getUint16(ifdOffset, littleEndian);

        if (ifdOffset + 2 + numEntries * 12 > dv.byteLength) break;

        // Look for GPS IFD pointer
        let gpsInfoOffset = null;
        for (let i = 0; i < numEntries; i++) {
          const entryOffset = ifdOffset + 2 + i * 12;
          const tag = dv.getUint16(entryOffset, littleEndian);

          if (tag === 0x8825) {
            // GPS Info tag
            const valueOffset = dv.getUint32(entryOffset + 8, littleEndian);
            gpsInfoOffset = tiffOffset + valueOffset;
            break;
          }
        }

        if (gpsInfoOffset && gpsInfoOffset + 2 <= dv.byteLength) {
          const gpsEntries = dv.getUint16(gpsInfoOffset, littleEndian);

          if (gpsInfoOffset + 2 + gpsEntries * 12 > dv.byteLength) break;

          let latRef: string | null = null;
          let latValue: number[] | null = null;
          let longRef: string | null = null;
          let longValue: number[] | null = null;

          for (let i = 0; i < gpsEntries; i++) {
            const entryOffset = gpsInfoOffset + 2 + i * 12;
            const tag = dv.getUint16(entryOffset, littleEndian);

            if (tag === 1) {
              // GPSLatitudeRef
              const format = dv.getUint16(entryOffset + 2, littleEndian);
              const components = dv.getUint32(entryOffset + 4, littleEndian);
              const valueOffset = dv.getUint32(entryOffset + 8, littleEndian);

              if (format === 2) {
                // ASCII string
                const strOffset =
                  components > 4 ? tiffOffset + valueOffset : entryOffset + 8;
                if (strOffset < dv.byteLength) {
                  latRef = String.fromCharCode(dv.getUint8(strOffset));
                }
              }
            } else if (tag === 2) {
              // GPSLatitude
              const format = dv.getUint16(entryOffset + 2, littleEndian);
              const valueOffset = dv.getUint32(entryOffset + 8, littleEndian);

              if (format === 5) {
                // Rational
                const rationalOffset = tiffOffset + valueOffset;
                if (rationalOffset + 24 <= dv.byteLength) {
                  latValue = [
                    dv.getUint32(rationalOffset, littleEndian) /
                      dv.getUint32(rationalOffset + 4, littleEndian),
                    dv.getUint32(rationalOffset + 8, littleEndian) /
                      dv.getUint32(rationalOffset + 12, littleEndian),
                    dv.getUint32(rationalOffset + 16, littleEndian) /
                      dv.getUint32(rationalOffset + 20, littleEndian),
                  ];
                }
              }
            } else if (tag === 3) {
              // GPSLongitudeRef
              const format = dv.getUint16(entryOffset + 2, littleEndian);
              const components = dv.getUint32(entryOffset + 4, littleEndian);
              const valueOffset = dv.getUint32(entryOffset + 8, littleEndian);

              if (format === 2) {
                // ASCII string
                const strOffset =
                  components > 4 ? tiffOffset + valueOffset : entryOffset + 8;
                if (strOffset < dv.byteLength) {
                  longRef = String.fromCharCode(dv.getUint8(strOffset));
                }
              }
            } else if (tag === 4) {
              // GPSLongitude
              const format = dv.getUint16(entryOffset + 2, littleEndian);
              const valueOffset = dv.getUint32(entryOffset + 8, littleEndian);

              if (format === 5) {
                // Rational
                const rationalOffset = tiffOffset + valueOffset;
                if (rationalOffset + 24 <= dv.byteLength) {
                  longValue = [
                    dv.getUint32(rationalOffset, littleEndian) /
                      dv.getUint32(rationalOffset + 4, littleEndian),
                    dv.getUint32(rationalOffset + 8, littleEndian) /
                      dv.getUint32(rationalOffset + 12, littleEndian),
                    dv.getUint32(rationalOffset + 16, littleEndian) /
                      dv.getUint32(rationalOffset + 20, littleEndian),
                  ];
                }
              }
            }
          }

          if (latRef && latValue && longRef && longValue) {
            latitude = convertToDecimalDegrees(latValue);
            if (latRef === "S") latitude = -latitude;

            longitude = convertToDecimalDegrees(longValue);
            if (longRef === "W") longitude = -longitude;

            return { latitude, longitude };
          }
        }
      }

      offset += length - 2;
    } else if ((marker & 0xff00) !== 0xff00) {
      break;
    } else {
      if (offset + 2 > dv.byteLength) break;
      offset += dv.getUint16(offset, false);
    }
  }

  return null;
}

/**
 * Convert degrees, minutes, seconds to decimal degrees
 */
export function convertToDecimalDegrees(dms: number[]): number {
  return dms[0] + dms[1] / 60 + dms[2] / 3600;
}

/**
 * Extract location from image file using EXIF.js and fallback to binary parsing
 */
export async function extractImageLocation(
  file: File,
  onLocationFound: (lat: number, lng: number) => void,
  toast: any
) {
  // Create an image element to use with EXIF.js
  const img = document.createElement("img");
  const imageUrl = URL.createObjectURL(file);

  // Set up the image onload handler
  img.onload = () => {
    // Use EXIF.js to get the metadata
    // @ts-ignore - EXIF.js adds this method to the image element
    EXIF.getData(img, function () {
      try {
        // @ts-ignore - EXIF.js adds this method to the image element
        const allTags = EXIF.getAllTags(this);
        console.log("EXIF data:", allTags);

        // Check if GPS data exists
        if (allTags.GPSLatitude && allTags.GPSLongitude) {
          // Convert coordinates from DMS (degrees, minutes, seconds) to decimal
          const latDegrees =
            allTags.GPSLatitude[0].numerator /
            allTags.GPSLatitude[0].denominator;
          const latMinutes =
            allTags.GPSLatitude[1].numerator /
            allTags.GPSLatitude[1].denominator;
          const latSeconds =
            allTags.GPSLatitude[2].numerator /
            allTags.GPSLatitude[2].denominator;

          const lngDegrees =
            allTags.GPSLongitude[0].numerator /
            allTags.GPSLongitude[0].denominator;
          const lngMinutes =
            allTags.GPSLongitude[1].numerator /
            allTags.GPSLongitude[1].denominator;
          const lngSeconds =
            allTags.GPSLongitude[2].numerator /
            allTags.GPSLongitude[2].denominator;

          let latitude = latDegrees + latMinutes / 60 + latSeconds / 3600;
          let longitude = lngDegrees + lngMinutes / 60 + lngSeconds / 3600;

          // Apply reference (N/S, E/W)
          if (allTags.GPSLatitudeRef === "S") latitude = -latitude;
          if (allTags.GPSLongitudeRef === "W") longitude = -longitude;

          console.log("Extracted coordinates:", latitude, longitude);
          onLocationFound(latitude, longitude);

          toast({
            title: "Location extracted",
            description:
              "Location data was found in your image and has been applied.",
          });
        } else {
          // Try alternative approach with binary data
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              try {
                // Extract EXIF data from binary file
                const exifData = extractExifDataFromArrayBuffer(
                  e.target.result as ArrayBuffer
                );

                if (
                  exifData &&
                  exifData.latitude !== undefined &&
                  exifData.longitude !== undefined
                ) {
                  const { latitude, longitude } = exifData;
                  onLocationFound(latitude, longitude);

                  toast({
                    title: "Location extracted",
                    description:
                      "Location data was found in your image and has been applied.",
                  });
                } else {
                  console.log("No location data found in image");
                  toast({
                    title: "No location data",
                    description:
                      "This image doesn't contain location information.",
                  });
                }
              } catch (error) {
                console.error("Error extracting binary EXIF data:", error);
              }
            }
          };
          reader.readAsArrayBuffer(file);
        }
      } catch (error) {
        console.error("Error extracting EXIF data:", error);
      }
    });
  };

  // Set the image source to trigger loading
  img.src = imageUrl;
}
