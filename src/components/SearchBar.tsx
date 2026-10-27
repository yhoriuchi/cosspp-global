export function SearchBar({
  value,
  onChange,
  onSubmit,
  id = 'faculty-search',
  large = false,
}: {
  value: string;
  onChange: (s: string) => void;
  onSubmit?: () => void;
  id?: string;
  large?: boolean;
}) {
  return (
    <form
      className={`search-bar ${large ? 'large' : ''}`}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <label className="sr-only" htmlFor={id}>
        Search faculty by name, research topic, or place
      </label>
      <span aria-hidden="true" className="search-icon">
        ⌕
      </span>
      <input
        id={id}
        type="search"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Name, research topic, or place…"
      />
      {onSubmit && (
        <button type="submit">
          Find faculty <span aria-hidden="true">→</span>
        </button>
      )}
    </form>
  );
}
