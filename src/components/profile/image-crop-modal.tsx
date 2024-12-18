import { useState, useRef } from "react";
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setImageSize({ width, height });
    const crop = centerAspectCrop(width, height, 1);
    setCrop(crop);
  }

  const getCroppedImg = async () => {
    if (!imageRef.current || !crop) return;

    const image = imageRef.current;
    const canvas = document.createElement("canvas");

    // Make the canvas size a fixed square for profile images (e.g., 500x500)
    const size = 500;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Calculate the scaled crop dimensions
    const sourceX = (crop.x * image.naturalWidth) / 100;
    const sourceY = (crop.y * image.naturalHeight) / 100;
    const sourceWidth = (crop.width * image.naturalWidth) / 100;
    const sourceHeight = (crop.height * image.naturalHeight) / 100;

    // Draw the cropped image scaled to our target size
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      size,
      size
    );

    // Convert the canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Check file size (4MB limit)
          if (blob.size > 4 * 1024 * 1024) {
            alert(
              "Image size is too large. Please choose a smaller image (max 4MB)."
            );
            return;
          }
          onCropComplete(blob);
          onClose();
        }
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle>Crop Profile Image</DialogTitle>
          <DialogDescription>
            Drag to reposition and use the corners to resize. The image will be
            cropped to a square.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            aspect={1}
            circularCrop
            className="max-h-[500px] object-contain mx-auto"
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop me"
              onLoad={onImageLoad}
              className="max-h-[500px] object-contain"
            />
          </ReactCrop>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={getCroppedImg}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
