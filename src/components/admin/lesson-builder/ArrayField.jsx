// ArrayField — the concept/task repeating-row pattern that
// LessonBuilder uses for any "list of short strings" field.
//
// Renders one numbered text input per item, a remove button per row,
// and a single "add" button at the bottom. The parent owns the
// underlying array via update/add/remove callbacks, so this stays
// pure presentation.

export function ArrayField({
  field,
  items,
  itemLabelSingular,
  placeholder,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
}) {
  return (
    <>
      {items.map((value, i) => (
        <div key={i} className="lb-array-row">
          <span className="lb-array-num">{i + 1}</span>
          <input
            value={value}
            onChange={(e) => onUpdateItem(field, i, e.target.value)}
            placeholder={placeholder}
            aria-label={`${itemLabelSingular} ${i + 1}`}
          />
          <button
            type="button"
            className="lb-array-rm"
            onClick={() => onRemoveItem(field, i)}
            title="Remove"
            aria-label={`Remove ${itemLabelSingular.toLowerCase()} ${i + 1}`}
          >
            -
          </button>
        </div>
      ))}
      <button type="button" className="lb-add-item" onClick={() => onAddItem(field)}>
        + Add {itemLabelSingular}
      </button>
    </>
  );
}
