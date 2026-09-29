type Option = string | { value: string; label: string };

export function Datalist({ id, options }: { id: string; options: Option[] }) {
  const unique = new Map(options.map((option) => (typeof option === "string" ? [option, ""] : [option.value, option.label])));
  return (
    <datalist id={id}>
      {Array.from(unique, ([value, label]) => (
        <option key={value} value={value}>
          {label || undefined}
        </option>
      ))}
    </datalist>
  );
}
