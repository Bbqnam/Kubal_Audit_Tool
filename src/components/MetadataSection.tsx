export default function MetadataSection({
  items,
  compact = false,
  note,
}: {
  items: Array<{ label: string; value: string }>
  compact?: boolean
  note?: string
}) {
  return (
    <>
      <dl className={`metadata-list ${compact ? 'metadata-list-compact' : ''}`.trim()}>
        {items.map((item) => (
          <div key={item.label} className="metadata-item">
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="metadata-note">{note}</p> : null}
    </>
  )
}
