import type { OrderField } from "../types/order";

interface BaseProps {
  field: OrderField;
  label: string;
  value: string;
  required?: boolean;
  error?: string;
  onChange: (field: OrderField, value: string) => void;
  placeholder?: string;
}

type FieldProps =
  | (BaseProps & { type?: "text" | "date" | "time" | "number" | "email" })
  | (BaseProps & { type: "textarea" })
  | (BaseProps & { type: "select"; options: string[] });

export function Field(props: FieldProps) {
  const { field, label, value, required, error, onChange, placeholder } = props;
  const id = `f_${field}`;
  const className = `field${error ? " field--error" : ""}`;

  return (
    <div className={className}>
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>

      {props.type === "select" ? (
        <select id={id} value={value} onChange={e => onChange(field, e.target.value)}>
          <option value="">— select —</option>
          {props.options.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : props.type === "textarea" ? (
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          rows={3}
          onChange={e => onChange(field, e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={props.type ?? "text"}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(field, e.target.value)}
        />
      )}

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
