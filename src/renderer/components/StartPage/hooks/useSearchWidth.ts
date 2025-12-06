import { useState, useEffect } from 'react';

export const useSearchWidth = (searchValue: string) => {
  const [searchWidth, setSearchWidth] = useState(600);

  useEffect(() => {
    const measureTextWidth = (text: string) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      ctx.font = "16px Inter, Arial, sans-serif";
      return ctx.measureText(text).width;
    };

    const baseWidth = 600;
    const maxWidth = 900;
    const availableWidth = baseWidth - 120;

    const textWidth = measureTextWidth(searchValue);
    
    if (textWidth > availableWidth) {
      const overflow = textWidth - availableWidth;
      const newWidth = Math.min(baseWidth + overflow, maxWidth);
      setSearchWidth(newWidth);
    } else {
      setSearchWidth(baseWidth);
    }
  }, [searchValue]);

  return searchWidth;
};
