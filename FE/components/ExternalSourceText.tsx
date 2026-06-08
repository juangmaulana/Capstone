"use client";

import type { ReactNode } from "react";

const URL_PATTERN = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
const TRAILING_PUNCTUATION_PATTERN = /[.,;:!?)]*$/;

type ExternalSourceTextProps = {
  value: string;
  fallback?: string;
  className?: string;
  linkClassName?: string;
};

const getExternalHref = (value: string) => (/^https?:\/\//i.test(value) ? value : `https://${value}`);

const splitTrailingPunctuation = (value: string) => {
  const punctuation = value.match(TRAILING_PUNCTUATION_PATTERN)?.[0] ?? "";
  return {
    linkText: punctuation ? value.slice(0, -punctuation.length) : value,
    punctuation,
  };
};

export function ExternalSourceText({
  value,
  fallback = "-",
  className,
  linkClassName = "break-all text-primary underline underline-offset-4 hover:text-primary/80",
}: ExternalSourceTextProps) {
  const text = value.trim();

  if (!text) {
    return <span className={className}>{fallback}</span>;
  }

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const matchedText = match[0];
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    const { linkText, punctuation } = splitTrailingPunctuation(matchedText);
    parts.push(
      <a
        key={`${linkText}-${matchIndex}`}
        href={getExternalHref(linkText)}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {linkText}
      </a>
    );

    if (punctuation) {
      parts.push(punctuation);
    }

    lastIndex = matchIndex + matchedText.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts.length ? parts : text}</span>;
}
