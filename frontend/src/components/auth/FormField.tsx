interface FormFieldProps {
  id: string;
  label: string;
  type: 'email' | 'password' | 'text';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

export const FormField = ({
  id,
  label,
  type,
  value,
  onChange,
  required = false,
  placeholder
}: FormFieldProps) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
};
