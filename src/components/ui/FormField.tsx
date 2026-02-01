import styles from './FormField.module.css';

/**
 * Переиспользуемый компонент поля формы
 * Используется в NodePropertiesPanel и EdgePropertiesPanel
 */

export interface FormFieldProps {
  label: string;
  type?: 'text' | 'number' | 'textarea';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
  monospace?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * FormField - переиспользуемое поле формы с label, input/textarea и hint
 * 
 * @example
 * ```tsx
 * <FormField
 *   label="Name"
 *   value={name}
 *   onChange={setName}
 *   placeholder="Enter name"
 * />
 * 
 * <FormField
 *   label="Formula"
 *   type="textarea"
 *   value={formula}
 *   onChange={setFormula}
 *   hint="Use [NodeName] to reference other nodes"
 *   monospace
 *   rows={4}
 * />
 * ```
 */
export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
  monospace = false,
  disabled = false,
  className = '',
}: FormFieldProps) {
  const inputClassName = `${styles.input} ${monospace ? styles.monospace : ''} ${className}`;

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>

      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={`${inputClassName} ${styles.textarea}`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClassName}
        />
      )}

      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}

