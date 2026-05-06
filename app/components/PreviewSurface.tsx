"use client";

type PreviewSurfaceProps = {
  html: string;
  id?: string;
  className?: string;
  contentEditable?: boolean;
  emptyHtml?: string;
};

export default function PreviewSurface({
  html,
  id,
  className,
  contentEditable = false,
  emptyHtml = "<p class=\"empty\">预览会显示在这里</p>",
}: PreviewSurfaceProps) {
  const nextHtml = html.trim() ? html : emptyHtml;

  return (
    <div
      id={id}
      className={className}
      contentEditable={contentEditable}
      suppressContentEditableWarning={contentEditable}
      dangerouslySetInnerHTML={{ __html: nextHtml }}
    />
  );
}
