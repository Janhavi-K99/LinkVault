import { type TextareaHTMLAttributes, forwardRef } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, className = '', ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        ref={ref}
        className={`w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all duration-150 focus:border-vault-500 focus:ring-2 focus:ring-vault-500/20 outline-none resize-none ${className}`}
        rows={3}
        {...props}
      />
    </div>
  )
)

TextArea.displayName = 'TextArea'
