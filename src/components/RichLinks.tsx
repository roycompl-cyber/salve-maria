"use client";

interface Props {
  html: string;
  className?: string;
}

export default function RichLinks({ html, className }: Props) {
  return (
    <div className={className}>
      <div className="article-html-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
